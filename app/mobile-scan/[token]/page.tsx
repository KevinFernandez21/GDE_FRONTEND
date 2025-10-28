"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Scan, RefreshCw, Check, X, ChevronLeft, MapPin, FileText, Package, Send, Camera, CameraOff, ArrowUp, ArrowDown, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import QrScanner from 'qr-scanner'
import BarcodeScanner from '@/components/barcode-scanner'
import SimpleCamera from '@/components/simple-camera'
import { useDeviceIP } from '@/hooks/use-device-ip'

interface ScanSession {
  id: string
  session_token: string
  session_name: string | null
  description: string | null
  status: "active" | "paused" | "completed" | "expired"
  created_by: string
  created_at: string
  expires_at: string
  scans_count: number
  last_scan_at: string | null
}

interface BarcodeScan {
  id: string
  session_id: string
  barcode: string
  scan_type: "guide" | "product" | "package" | "qr_session"
  location: string | null
  notes: string | null
  scanned_by: string
  scanned_at: string
  processed: boolean
  product_info: any
  movement_type?: "entrada" | "salida"
  guide_info?: {
    guide_number: string
    fecha: string
    cliente: string
    estado: string
  }
}

// Configuración de API para desarrollo y producción
const getApiBaseUrl = () => {
  // Prefer a full API base including /api/v1 to avoid double slashes
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL
  if (process.env.NEXT_PUBLIC_API_URL) return `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api/v1`
  return "http://localhost:8000/api/v1"
}

const API_BASE_URL = getApiBaseUrl()

export default function MobileScanPage() {
  const params = useParams()
  const token = params.token as string
  const { deviceIP, isLoading: ipLoading, isProduction } = useDeviceIP()

  const [session, setSession] = useState<ScanSession | null>(null)
  const [recentScans, setRecentScans] = useState<BarcodeScan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [scanBarcode, setScanBarcode] = useState("")
  const [scanType, setScanType] = useState<"guide" | "product" | "package">("guide")
  const [scanLocation, setScanLocation] = useState("")
  const [scanNotes, setScanNotes] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [isCameraScanning, setIsCameraScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const [isBarcodeScannerActive, setIsBarcodeScannerActive] = useState(false)
  const [useSimpleCamera, setUseSimpleCamera] = useState(false)
  const [movementType, setMovementType] = useState<"entrada" | "salida">("entrada")
  const [scannedGuides, setScannedGuides] = useState<Set<string>>(new Set())

  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)

  useEffect(() => {
    if (token) {
      loadSessionData()
    }
    checkCameraAvailability()
    return () => {
      stopCameraScanning()
    }
  }, [token])

  useEffect(() => {
    // Auto-focus barcode input for mobile scanning
    if (barcodeInputRef.current && !isCameraScanning) {
      barcodeInputRef.current.focus()
    }
  }, [session, isCameraScanning])

  const loadSessionData = async () => {
    try {
      console.log('🔍 Intentando conectar con backend:', `${API_BASE_URL}/scanning/mobile/${token}`)
      
      const response = await fetch(`${API_BASE_URL}/scanning/mobile/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const data = await response.json()
        setSession(data.session_info)
        setRecentScans(data.recent_scans || [])
        setError(null)
        console.log('✅ Datos de sesión cargados correctamente')
      } else {
        throw new Error(`Backend responded with status: ${response.status}`)
      }
    } catch (error) {
      console.log('⚠️ Backend no disponible, usando modo demo:', error)
        
      // Usar datos mock como fallback
      const mockSession: ScanSession = {
        id: `session-${token}`,
        session_token: token,
        session_name: "Sesión Demo",
        description: "Sesión de demostración (Modo Demo)",
        status: "active",
        created_by: "demo-user",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        expires_at: new Date(Date.now() + 7 * 3600000).toISOString(),
        scans_count: 5,
        last_scan_at: new Date(Date.now() - 300000).toISOString()
      }

      const mockScans: BarcodeScan[] = [
        {
          id: "scan-1",
          session_id: mockSession.id,
          barcode: "G00045",
          scan_type: "guide",
          location: "Guayaquil",
          notes: "Guía de entrada",
          scanned_by: "demo-user",
          scanned_at: new Date(Date.now() - 300000).toISOString(),
          processed: true,
          product_info: null
        },
        {
          id: "scan-2",
          session_id: mockSession.id,
          barcode: "G00046",
          scan_type: "guide",
          location: "Guayaquil",
          notes: "Guía de salida",
          scanned_by: "demo-user",
          scanned_at: new Date(Date.now() - 600000).toISOString(),
          processed: true,
          product_info: null
        }
      ]

      setSession(mockSession)
      setRecentScans(mockScans)
      setError(null)
      toast.success("Modo Demo activado - Funcionando sin backend")
    } finally {
      setIsLoading(false)
    }
  }

  const submitScan = async () => {
    if (!scanBarcode.trim() || !session) {
      toast.error("Ingresa un código de barras válido")
      return
    }

    // Validar duplicados para guías
    if (scanType === 'guide' && scannedGuides.has(scanBarcode.trim())) {
      toast.error("Esta guía ya ha sido escaneada en esta sesión")
      return
    }

    setIsSubmitting(true)
    try {
      console.log('📤 Enviando escaneo al backend:', scanBarcode.trim())
      
      const response = await fetch(`${API_BASE_URL}/scanning/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_token: token,
          barcode: scanBarcode.trim(),
          scan_type: scanType,
          location: scanLocation.trim() || null,
          notes: scanNotes.trim() || null,
          movement_type: scanType === 'guide' ? movementType : null
        }),
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const scanResult = await response.json()
        setRecentScans(prev => [scanResult, ...prev.slice(0, 9)])
        
        // Agregar a guías escaneadas si es una guía
        if (scanType === 'guide') {
          setScannedGuides(prev => new Set([...prev, scanBarcode.trim()]))
        }
        
        setScanBarcode("")
        setScanLocation("")
        setScanNotes("")
        setSession(prev => prev ? {
          ...prev,
          scans_count: prev.scans_count + 1,
          last_scan_at: scanResult.scanned_at
        } : null)

        const movementText = scanType === 'guide' ? ` (${movementType})` : ''
        toast.success(`${scanType === 'guide' ? 'Guía' : scanType === 'product' ? 'Producto' : 'Paquete'} registrado${movementText}`)
        console.log('✅ Escaneo registrado en backend')

        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus()
        }
      } else {
        throw new Error(`Backend responded with status: ${response.status}`)
      }
    } catch (error) {
      console.log('⚠️ Backend no disponible, registrando en modo demo:', error)
        
      const mockScan: BarcodeScan = {
        id: `scan-${Date.now()}`,
        session_id: session.id,
        barcode: scanBarcode.trim(),
        scan_type: scanType,
        location: scanLocation.trim() || "Guayaquil",
        notes: scanNotes.trim() || null,
        scanned_by: "demo-user",
        scanned_at: new Date().toISOString(),
        processed: true,
        product_info: null
      }

      setRecentScans(prev => [mockScan, ...prev.slice(0, 9)])
      setScanBarcode("")
      setScanLocation("")
      setScanNotes("")
      setSession(prev => prev ? {
        ...prev,
        scans_count: prev.scans_count + 1,
        last_scan_at: mockScan.scanned_at
      } : null)

      toast.success(`${scanType === 'guide' ? 'Guía' : scanType === 'product' ? 'Producto' : 'Paquete'} registrado (Modo Demo)`)
      console.log('✅ Escaneo registrado en modo demo')

      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBarcodeScan = (barcode: string) => {
    setScanBarcode(barcode)
    toast.success(`Código escaneado: ${barcode}`)
    
    // Auto-submit si hay datos mínimos
    if (barcode.trim()) {
      setTimeout(() => {
        submitScan()
      }, 500)
    }
  }

  const checkCameraAvailability = async () => {
    try {
      const hasCamera = await QrScanner.hasCamera()
      setHasCamera(hasCamera)
    } catch (error) {
      console.error('Error checking camera:', error)
      setHasCamera(false)
    }
  }

  const startCameraScanning = async () => {
    try {
      if (!videoRef.current) return

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          setScanBarcode(result.data)
          stopCameraScanning()
          toast.success("Código escaneado exitosamente")
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment'
        }
      )

      await qrScannerRef.current.start()
      setIsCameraScanning(true)
    } catch (error) {
      console.error('Error starting camera:', error)
      toast.error("Error al acceder a la cámara")
    }
  }

  const stopCameraScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
      qrScannerRef.current.destroy()
      qrScannerRef.current = null
    }
    setIsCameraScanning(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando sesión de pistoleo...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <X className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Sesión no encontrada</p>
          <Button 
            onClick={() => window.history.back()} 
            className="mt-4"
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Pistoleo Móvil</h1>
              <p className="text-sm text-gray-600">{session.session_name || "Sesión Demo"}</p>
              {!ipLoading && deviceIP && (
                <p className="text-xs text-gray-500">
                  {isProduction ? `URL: ${deviceIP}` : `IP: ${deviceIP}`}
                </p>
              )}
            </div>
            <Button 
              onClick={() => window.history.back()} 
              variant="outline" 
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Escanear Código Card */}
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Escanear Código</CardTitle>
            <CardDescription>
              Escanea códigos de barras o ingrésalos manualmente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scanner Options */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBarcodeScannerActive(!isBarcodeScannerActive)
                  setUseSimpleCamera(false)
                }}
                className="flex flex-col gap-1 h-auto p-3"
              >
                <Scan className="w-5 h-5" />
                <span className="text-xs">Escáner Avanzado</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setUseSimpleCamera(!useSimpleCamera)
                  setIsBarcodeScannerActive(false)
                }}
                className="flex flex-col gap-1 h-auto p-3"
              >
                <Camera className="w-5 h-5" />
                <span className="text-xs">Cámara Simple</span>
              </Button>
            </div>

            {/* Camera Feed */}
            {isBarcodeScannerActive && (
              <BarcodeScanner
                onScan={handleBarcodeScan}
                isActive={isBarcodeScannerActive}
                onToggle={() => setIsBarcodeScannerActive(!isBarcodeScannerActive)}
              />
            )}

            {useSimpleCamera && (
              <SimpleCamera
                onToggle={() => setUseSimpleCamera(!useSimpleCamera)}
                isActive={useSimpleCamera}
              />
            )}

            {/* Manual Input */}
            {!isBarcodeScannerActive && !useSimpleCamera && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escanea o escribe el código de barras...
                  </label>
                  <Input
                    ref={barcodeInputRef}
                    value={scanBarcode}
                    onChange={(e) => setScanBarcode(e.target.value)}
                    placeholder="Ej: G00045, 1234567890..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        submitScan()
                      }
                    }}
                    className="text-lg font-mono border-blue-500 focus:border-blue-600"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                  />
                </div>

                {/* Type Selection */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={scanType === 'guide' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setScanType('guide')}
                    className="flex flex-col gap-1 h-auto p-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">Guía</span>
                  </Button>
                  <Button
                    variant={scanType === 'product' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setScanType('product')}
                    className="flex flex-col gap-1 h-auto p-2"
                  >
                    <Package className="w-4 h-4" />
                    <span className="text-xs">Producto</span>
                  </Button>
                  <Button
                    variant={scanType === 'package' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setScanType('package')}
                    className="flex flex-col gap-1 h-auto p-2"
                  >
                    <Package className="w-4 h-4" />
                    <span className="text-xs">Paquete</span>
                  </Button>
                </div>

                {/* Movement Type for Guides */}
                {scanType === 'guide' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo de Movimiento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={movementType === 'entrada' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMovementType('entrada')}
                        className="flex items-center gap-2 h-auto p-3"
                      >
                        <ArrowUp className="w-4 h-4 text-green-600" />
                        <span>Entrada</span>
                      </Button>
                      <Button
                        variant={movementType === 'salida' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMovementType('salida')}
                        className="flex items-center gap-2 h-auto p-3"
                      >
                        <ArrowDown className="w-4 h-4 text-red-600" />
                        <span>Salida</span>
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {movementType === 'entrada' 
                        ? 'Suma al inventario' 
                        : 'Resta del inventario'
                      }
                    </p>
                  </div>
                )}

                {/* Location and Notes */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación (Opcional)
                    </label>
                    <Input
                      value={scanLocation}
                      onChange={(e) => setScanLocation(e.target.value)}
                      placeholder="Ej: Guayaquil, Quito..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas (Opcional)
                    </label>
                    <Textarea
                      value={scanNotes}
                      onChange={(e) => setScanNotes(e.target.value)}
                      placeholder="Notas adicionales..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={submitScan}
                  disabled={isSubmitting || !scanBarcode.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Registrar Escaneo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Escaneos Recientes Card */}
        {recentScans.length > 0 && (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Escaneos Recientes</CardTitle>
              <CardDescription>
                Últimos {recentScans.length} escaneos registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentScans.slice(0, 2).map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-blue-600">
                          {scan.scan_type === 'guide' ? 'Guía' : scan.scan_type === 'product' ? 'Producto' : 'Paquete'}
                        </Badge>
                        <span className="font-mono text-sm font-semibold">{scan.barcode}</span>
                      </div>
                      {scan.location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-600">{scan.location}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(scan.scanned_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session Status */}
        {session.status === 'paused' && (
          <Alert>
            <AlertDescription>
              La sesión está pausada. No se pueden realizar escaneos en este momento.
            </AlertDescription>
          </Alert>
        )}

        {(session.status === 'completed' || session.status === 'expired') && (
          <Alert>
            <AlertDescription>
              Esta sesión de pistoleo ha finalizado. No se pueden realizar más escaneos.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
