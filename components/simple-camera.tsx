"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, CameraOff } from 'lucide-react'
import CameraPermissionsHelp from './camera-permissions-help'

interface SimpleCameraProps {
  onToggle: () => void
  isActive: boolean
}

export default function SimpleCamera({ onToggle, isActive }: SimpleCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPermissionsHelp, setShowPermissionsHelp] = useState(false)

  useEffect(() => {
    if (isActive) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isActive])

  const startCamera = async () => {
    try {
      setError(null)
      
      // Diagnóstico detallado del navegador
      console.log('🔍 Diagnóstico del navegador:')
      console.log('- navigator.mediaDevices:', !!navigator.mediaDevices)
      console.log('- getUserMedia:', !!navigator.mediaDevices?.getUserMedia)
      console.log('- User Agent:', navigator.userAgent)
      console.log('- Protocolo:', window.location.protocol)
      console.log('- Host:', window.location.host)
      
      // Verificar protocolo (HTTPS es requerido para cámara en producción)
      const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost'
      if (!isSecureContext) {
        throw new Error('Se requiere HTTPS para acceder a la cámara. Usa https:// o localhost.')
      }
      
      // Verificar si getUserMedia está disponible
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices no está disponible. Asegúrate de usar HTTPS o localhost.')
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia no está disponible en este navegador.')
      }

      // Solicitar acceso a la cámara con diferentes configuraciones
      let mediaStream: MediaStream | null = null
      
      try {
        // Primero intentar con cámara trasera
        mediaStream = await navigator.mediaDevices.getUserMedia({
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
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          })
        } catch (userError) {
          console.log('Cámara frontal no disponible, intentando cualquier cámara...')
          // Último fallback: cualquier cámara disponible
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          })
        }
      }

      if (!mediaStream) {
        throw new Error('No se pudo obtener acceso a ninguna cámara')
      }

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }

    } catch (err) {
      console.error('❌ Error accessing camera:', err)
      
      let errorMessage = 'No se pudo acceder a la cámara.'
      
      if (err instanceof Error) {
        console.log('Error name:', err.name)
        console.log('Error message:', err.message)
        
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
        } else if (err.message.includes('HTTPS')) {
          errorMessage = err.message
        } else if (err.message.includes('navigator.mediaDevices')) {
          errorMessage = err.message
        } else if (err.message.includes('getUserMedia')) {
          errorMessage = err.message
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      
      // Mostrar ayuda de permisos si es un error de permisos
      if (errorMessage.includes('denegados') || errorMessage.includes('NotAllowedError')) {
        setShowPermissionsHelp(true)
      }
    }
  }

  const handleRetry = () => {
    setShowPermissionsHelp(false)
    setError(null)
    startCamera()
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
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
          <Button 
            onClick={onToggle}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <CameraOff className="w-4 h-4 mr-2" />
            Desactivar Cámara
          </Button>

          {/* Video */}
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-black rounded-lg object-cover"
              playsInline
              muted
              autoPlay
            />
            <div className="absolute inset-0 border-2 border-blue-500 rounded-lg">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-20 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs text-center">Enfoca el código aquí</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Instrucciones */}
          <div className="text-sm text-gray-600 text-center">
            <p>Cámara activada. Usa el campo de texto abajo para escribir el código de barras.</p>
            <p className="text-xs text-blue-600 mt-1">
              💡 Tip: Puedes usar una app de escáner de códigos de barras en tu teléfono y copiar el resultado aquí.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
