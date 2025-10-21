"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, CameraOff, RotateCcw } from 'lucide-react'
import QrScanner from 'qr-scanner'
import CameraPermissionsHelp from './camera-permissions-help'

interface BarcodeScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
  isActive: boolean
  onToggle: () => void
}

export default function BarcodeScanner({ onScan, onError, isActive, onToggle }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const [useNativeCamera, setUseNativeCamera] = useState(false)
  const [showPermissionsHelp, setShowPermissionsHelp] = useState(false)

  useEffect(() => {
    if (isActive) {
      initializeScanner()
    } else {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isActive])

  const initializeScanner = async () => {
    try {
      setError(null)
      setIsScanning(true)

      // Primero intentar con QrScanner
      try {
        const hasCameraAvailable = await QrScanner.hasCamera()
        setHasCamera(hasCameraAvailable)

        if (!hasCameraAvailable) {
          throw new Error('QrScanner no detecta cámara')
        }

        if (!videoRef.current) {
          throw new Error('Elemento de video no disponible')
        }

        // Crear el escáner QR
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            if (isValidBarcode(result.data)) {
              onScan(result.data)
              stopScanning()
            }
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment',
            maxScansPerSecond: 5,
          }
        )

        await qrScannerRef.current.start()
        setUseNativeCamera(false)

      } catch (qrError) {
        console.log('QrScanner falló, intentando con cámara nativa:', qrError)
        
        // Fallback: usar cámara nativa
        await initializeNativeCamera()
      }

    } catch (err) {
      console.error('Error initializing scanner:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al inicializar la cámara'
      setError(errorMessage)
      setIsScanning(false)
      
      // Mostrar ayuda de permisos si es un error de permisos
      if (errorMessage.includes('denegados') || errorMessage.includes('NotAllowedError')) {
        setShowPermissionsHelp(true)
      }
      
      onError?.(errorMessage)
    }
  }

  const initializeNativeCamera = async () => {
    try {
      if (!videoRef.current) {
        throw new Error('Elemento de video no disponible')
      }

      // Verificar si getUserMedia está disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara. Usa Chrome, Firefox o Safari.')
      }

      // Solicitar permisos de cámara explícitamente
      try {
        const permissionResult = await navigator.permissions.query({ name: 'camera' as PermissionName })
        console.log('Estado del permiso de cámara:', permissionResult.state)
        
        if (permissionResult.state === 'denied') {
          throw new Error('Permisos de cámara denegados. Por favor, habilita los permisos de cámara en la configuración de tu navegador.')
        }
      } catch (permError) {
        console.log('No se pudo verificar permisos, continuando...', permError)
      }

      // Solicitar acceso a la cámara con diferentes configuraciones
      let stream: MediaStream | null = null
      
      try {
        // Primero intentar con cámara trasera
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
      } catch (envError) {
        console.log('Cámara trasera no disponible, intentando cámara frontal...')
        try {
          // Fallback a cámara frontal
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          })
        } catch (userError) {
          console.log('Cámara frontal no disponible, intentando cualquier cámara...')
          // Último fallback: cualquier cámara disponible
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          })
        }
      }

      if (!stream) {
        throw new Error('No se pudo obtener acceso a ninguna cámara')
      }

      videoRef.current.srcObject = stream
      await videoRef.current.play()
      
      setHasCamera(true)
      setUseNativeCamera(true)
      setError(null)

      console.log('Cámara nativa activada exitosamente')

    } catch (err) {
      console.error('Error detallado de cámara:', err)
      
      let errorMessage = 'No se pudo acceder a la cámara.'
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Permisos de cámara denegados. Haz clic en el ícono de cámara en la barra de direcciones y permite el acceso.'
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No se encontró ninguna cámara en este dispositivo.'
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'La cámara está siendo usada por otra aplicación.'
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'La configuración de cámara solicitada no es compatible.'
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Error de seguridad. Asegúrate de que la página esté servida por HTTPS o localhost.'
        } else {
          errorMessage = err.message
        }
      }
      
      throw new Error(errorMessage)
    }
  }

  const handleRetry = () => {
    setShowPermissionsHelp(false)
    setError(null)
    initializeScanner()
  }

  const isValidBarcode = (data: string): boolean => {
    // Verificar si el dato escaneado parece un código de barras
    // Los códigos de barras típicamente contienen solo números o tienen un formato específico
    const barcodePatterns = [
      /^\d{8,14}$/, // Códigos EAN/UPC (8-14 dígitos)
      /^\d{12}$/, // Código UPC-A
      /^\d{13}$/, // Código EAN-13
      /^\d{8}$/, // Código EAN-8
      /^[A-Z0-9]{8,20}$/, // Códigos alfanuméricos
    ]

    return barcodePatterns.some(pattern => pattern.test(data))
  }

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
      qrScannerRef.current.destroy()
      qrScannerRef.current = null
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    setIsScanning(false)
    setUseNativeCamera(false)
  }

  const switchCamera = async () => {
    if (!qrScannerRef.current) return

    stopScanning()
    
    // Reiniciar el escáner (QrScanner maneja automáticamente el cambio de cámara)
    setTimeout(() => {
      if (isActive) {
        initializeScanner()
      }
    }, 100)
  }

  if (!isActive) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <Button 
            onClick={onToggle}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Camera className="w-4 h-4 mr-2" />
            Activar Cámara
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (showPermissionsHelp) {
    return <CameraPermissionsHelp onRetry={handleRetry} />
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Controles */}
          <div className="flex gap-2">
            <Button 
              onClick={onToggle}
              variant="outline"
              size="sm"
            >
              <CameraOff className="w-4 h-4 mr-2" />
              Desactivar
            </Button>
            <Button 
              onClick={switchCamera}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Cambiar Cámara
            </Button>
          </div>

          {/* Video */}
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-black rounded-lg object-cover"
              playsInline
              muted
            />
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                  Escaneando códigos de barras...
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Instrucciones */}
          <div className="text-sm text-gray-600 text-center">
            {useNativeCamera ? (
              <div>
                <p>Cámara activada. Usa el campo de texto abajo para escribir el código de barras manualmente.</p>
                <p className="text-xs text-yellow-600 mt-1">
                  ⚠️ Detección automática no disponible en este dispositivo
                </p>
              </div>
            ) : (
              <p>Apunta la cámara al código de barras para escanearlo automáticamente</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}