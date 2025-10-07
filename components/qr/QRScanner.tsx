"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Scan, Camera, CameraOff, RotateCcw, ExternalLink } from "lucide-react"
import { toast } from "sonner"

export default function QRScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<string[]>([])
  const [hasCamera, setHasCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    checkCameraAvailability()
    return () => {
      stopCamera()
    }
  }, [])

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasVideoDevice = devices.some(device => device.kind === 'videoinput')
      setHasCamera(hasVideoDevice)
    } catch (error) {
      console.error('Error checking camera:', error)
      setHasCamera(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
        toast.success("Cámara iniciada - Escanea un código QR")
        
        // Simular detección de QR (en producción usarías una librería como qr-scanner)
        simulateQRDetection()
      }
    } catch (error) {
      console.error('Error starting camera:', error)
      toast.error("Error al acceder a la cámara")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  // Simulación de detección de QR (en producción integrarías qr-scanner)
  const simulateQRDetection = () => {
    const interval = setInterval(() => {
      if (!isScanning) {
        clearInterval(interval)
        return
      }
      
      // Simula la detección aleatoria de QRs para demo
      if (Math.random() < 0.1) { // 10% probabilidad cada 2 segundos
        const mockQRData = `${window.location.origin}/scan/GD-${Date.now()}`
        handleQRDetected(mockQRData)
        clearInterval(interval)
      }
    }, 2000)
  }

  const handleQRDetected = (data: string) => {
    setScannedData(prev => [data, ...prev])
    toast.success("¡Código QR detectado!")
    stopCamera()
  }

  const openScannedUrl = (url: string) => {
    window.open(url, '_blank')
  }

  const clearHistory = () => {
    setScannedData([])
    toast.success("Historial limpiado")
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Scan className="mr-2 h-5 w-5" />
          Escáner QR
        </CardTitle>
        <CardDescription className="text-slate-400">
          Escanea códigos QR para acceso rápido a guías de despacho
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {hasCamera ? (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isScanning && (
                  <div className="absolute inset-0 border-2 border-blue-500 animate-pulse">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">Enfoca el QR aquí</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                {!isScanning ? (
                  <Button 
                    onClick={startCamera}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Iniciar Escáner
                  </Button>
                ) : (
                  <Button 
                    onClick={stopCamera}
                    variant="destructive"
                    className="flex-1"
                  >
                    <CameraOff className="mr-2 h-4 w-4" />
                    Detener Escáner
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-slate-700/50 rounded-lg">
              <CameraOff className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-400 mb-2">Cámara no disponible</p>
              <p className="text-sm text-slate-500">
                Permite el acceso a la cámara para escanear códigos QR
              </p>
            </div>
          )}
        </div>

        {scannedData.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-white font-medium">QRs Escaneados</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={clearHistory}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Limpiar
              </Button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {scannedData.map((data, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{data}</p>
                    <p className="text-xs text-slate-500">
                      Escaneado hace {index === 0 ? 'unos segundos' : `${index + 1} escaneos`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge variant="outline" className="border-green-600 text-green-400">
                      Válido
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openScannedUrl(data)}
                      className="text-slate-400 hover:text-white"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-700/50 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-2">Instrucciones:</h4>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• Permite el acceso a la cámara del dispositivo</li>
            <li>• Enfoca el código QR dentro del marco de escaneo</li>
            <li>• Los QRs válidos se abren automáticamente</li>
            <li>• El historial guarda los últimos escaneos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}