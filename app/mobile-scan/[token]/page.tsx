"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Scan, RefreshCw, Check, X, ChevronLeft, MapPin, FileText, Package, Send, Camera, CameraOff, ArrowUp, ArrowDown, QrCode, Pause, Square } from "lucide-react"
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

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Main Card */}
        <Card className="bg-white border-2 border-blue-200">
          <CardContent className="p-6">
            {/* Session Info */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Pistoleo Móvil</h2>
              <p className="text-gray-600">{session.session_name || "Sesión Demo"}</p>
              {!ipLoading && deviceIP && (
                <p className="text-sm text-gray-500">
                  {isProduction ? `URL: ${deviceIP}` : `IP: ${deviceIP}`}
                </p>
              )}
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge className="bg-blue-600 text-white">Activa</Badge>
                <span className="text-sm text-gray-500">{session.scans_count} escaneos</span>
              </div>
            </div>

            {/* Movement Type Selection */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-4">Tipo de Movimiento</h3>
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  className={`h-20 w-32 text-lg ${
                    movementType === 'entrada' 
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => setMovementType('entrada')}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ArrowUp className="w-8 h-8 text-green-600" />
                    <span className="font-bold">Entrada</span>
                    <span className="text-xs">Suma al inventario</span>
                  </div>
                </Button>
                
                <Button
                  size="lg"
                  className={`h-20 w-32 text-lg ${
                    movementType === 'salida' 
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => setMovementType('salida')}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ArrowDown className="w-8 h-8 text-red-600" />
                    <span className="font-bold">Salida</span>
                    <span className="text-xs">Resta del inventario</span>
                  </div>
                </Button>
              </div>
            </div>

            {/* Camera Button */}
            <div className="text-center mb-4">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-xl font-bold shadow-lg"
                onClick={() => {
                  if (isBarcodeScannerActive) {
                    setIsBarcodeScannerActive(false)
                    toast.info("Cámara desactivada")
                  } else {
                    setIsBarcodeScannerActive(true)
                    toast.info("Iniciando cámara para escaneo...")
                  }
                }}
              >
                <Camera className="w-8 h-8 mr-4" />
                {isBarcodeScannerActive ? 'Detener Cámara' : 'Iniciar Cámara'}
              </Button>
              <p className="text-sm text-gray-500 mt-3">
                Modo: {movementType === 'entrada' ? 'Entrada' : 'Salida'}
              </p>
            </div>

            {/* Camera Feed */}
            {isBarcodeScannerActive && (
              <div className="mb-4">
                <BarcodeScanner
                  onScan={handleBarcodeScan}
                  isActive={isBarcodeScannerActive}
                  onToggle={() => setIsBarcodeScannerActive(!isBarcodeScannerActive)}
                />
              </div>
            )}

            {/* Session Actions */}
            <div className="flex gap-2 justify-center pt-4 border-t">
              {session.status === 'active' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch(`${API_BASE_URL}/scanning/sessions/${session.id}/pause`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json'
                        }
                      })
                      if (response.ok) {
                        toast.success("Sesión pausada")
                        setSession(prev => prev ? {...prev, status: 'paused'} : null)
                      } else {
                        toast.error("Error al pausar sesión")
                      }
                    } catch (error) {
                      toast.error("Error al pausar sesión")
                    }
                  }}
                >
                  <Pause className="w-3 h-3 mr-1" />
                  Pausar
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_BASE_URL}/scanning/sessions/${session.id}/complete`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json'
                      }
                    })
                    if (response.ok) {
                      toast.success("Sesión completada")
                      setSession(prev => prev ? {...prev, status: 'completed'} : null)
                    } else {
                      toast.error("Error al completar sesión")
                    }
                  } catch (error) {
                    toast.error("Error al completar sesión")
                  }
                }}
              >
                <Square className="w-3 h-3 mr-1" />
                Completar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Mostrar QR en nueva ventana
                  const qrUrl = `${window.location.origin}/mobile-scan/${token}`
                  window.open(qrUrl, '_blank')
                  toast.info("QR abierto en nueva ventana")
                }}
              >
                <QrCode className="w-3 h-3 mr-1" />
                QR
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
