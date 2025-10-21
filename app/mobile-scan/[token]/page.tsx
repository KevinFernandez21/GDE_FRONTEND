"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Scan, RefreshCw, Check, X, ChevronLeft, MapPin, FileText, Package, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

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
  guide_info: any
  product_info: any
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function MobileScanPage() {
  const params = useParams()
  const token = params.token as string

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

  const barcodeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (token) {
      loadSessionData()
    }
  }, [token])

  useEffect(() => {
    // Auto-focus barcode input for mobile scanning
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [session])

  const loadSessionData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/scanning/mobile/${token}`)

      if (response.ok) {
        const data = await response.json()
        setSession(data.session_info)
        setRecentScans(data.recent_scans || [])
        setError(null)
      } else {
        const errorData = await response.json()
        console.log('Backend error, using mock data:', errorData.detail)
        
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
        toast.success("Modo Demo activado - Backend no disponible")
      }
    } catch (error) {
      console.error('Error loading session:', error)
      
      // Usar datos mock como fallback en caso de error de red
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
        }
      ]

      setSession(mockSession)
      setRecentScans(mockScans)
      setError(null)
      toast.success("Modo Demo activado - Sin conexión al servidor")
    } finally {
      setIsLoading(false)
    }
  }

  const submitScan = async () => {
    if (!scanBarcode.trim() || !session) {
      toast.error("Ingresa un código de barras válido")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/scanning/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_token: token,
          barcode: scanBarcode.trim(),
          scan_type: scanType,
          location: scanLocation.trim() || null,
          notes: scanNotes.trim() || null
        })
      })

      if (response.ok) {
        const scanResult = await response.json()
        setRecentScans(prev => [scanResult, ...prev.slice(0, 9)]) // Keep last 10 scans
        setScanBarcode("")
        setScanLocation("")
        setScanNotes("")
        setSession(prev => prev ? {
          ...prev,
          scans_count: prev.scans_count + 1,
          last_scan_at: scanResult.scanned_at
        } : null)

        toast.success(`${scanType === 'guide' ? 'Guía' : scanType === 'product' ? 'Producto' : 'Paquete'} registrado`)

        // Auto-focus back to barcode input
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus()
        }
      } else {
        // Modo demo - simular escaneo exitoso
        console.log('Backend error, simulating scan in demo mode')
        
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

        setRecentScans(prev => [mockScan, ...prev.slice(0, 9)]) // Keep last 10 scans
        setScanBarcode("")
        setScanLocation("")
        setScanNotes("")
        setSession(prev => prev ? {
          ...prev,
          scans_count: prev.scans_count + 1,
          last_scan_at: mockScan.scanned_at
        } : null)

        toast.success(`${scanType === 'guide' ? 'Guía' : scanType === 'product' ? 'Producto' : 'Paquete'} registrado (Modo Demo)`)

        // Auto-focus back to barcode input
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus()
        }
      }
    } catch (error) {
      console.error('Error submitting scan:', error)
      
      // Modo demo - simular escaneo exitoso en caso de error de red
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

      setRecentScans(prev => [mockScan, ...prev.slice(0, 9)]) // Keep last 10 scans
      setScanBarcode("")
      setScanLocation("")
      setScanNotes("")
      setSession(prev => prev ? {
        ...prev,
        scans_count: prev.scans_count + 1,
        last_scan_at: mockScan.scanned_at
      } : null)

      toast.success(`${scanType === 'guide' ? 'Guía' : scanType === 'product' ? 'Producto' : 'Paquete'} registrado (Modo Demo)`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      paused: "secondary",
      completed: "outline",
      expired: "destructive"
    } as const

    const labels = {
      active: "Activa",
      paused: "Pausada",
      completed: "Completada",
      expired: "Expirada"
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const getScanTypeIcon = (type: string) => {
    switch (type) {
      case 'guide':
        return <FileText className="w-4 h-4" />
      case 'product':
        return <Package className="w-4 h-4" />
      case 'package':
        return <Package className="w-4 h-4" />
      default:
        return <Scan className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
          <p>Cargando sesión de pistoleo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-red-600">
              <X className="w-6 h-6" />
              Error de Sesión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={loadSessionData} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Sesión no encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              La sesión de pistoleo no está disponible.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scan className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="font-semibold text-lg">Pistoleo Móvil</h1>
                <p className="text-sm text-muted-foreground">{session.session_name}</p>
              </div>
            </div>
            {getStatusBadge(session.status)}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Session Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Escaneos realizados:</span>
                  <Badge variant="outline">{session.scans_count}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Expira: {formatDateTime(session.expires_at)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Ocultar" : "Detalles"}
              </Button>
            </div>

            {showDetails && session.description && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm">{session.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scanning Interface */}
        {session.status === 'active' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Scan className="w-5 h-5" />
                Escanear Código
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Barcode Input */}
              <div className="space-y-2">
                <Input
                  ref={barcodeInputRef}
                  placeholder="Escanea o escribe el código de barras..."
                  value={scanBarcode}
                  onChange={(e) => setScanBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && scanBarcode.trim()) {
                      submitScan()
                    }
                  }}
                  className="text-lg font-mono"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
              </div>

              {/* Quick Options */}
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

              {/* Optional Fields */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Ubicación
                  </label>
                  <Input
                    placeholder="Ej: Almacén A-1"
                    value={scanLocation}
                    onChange={(e) => setScanLocation(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Notas</label>
                  <Textarea
                    placeholder="Observaciones..."
                    value={scanNotes}
                    onChange={(e) => setScanNotes(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={submitScan}
                disabled={isSubmitting || !scanBarcode.trim()}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Registrar Escaneo
              </Button>
            </CardContent>
          </Card>
        )}

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

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Últimos Escaneos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentScans.slice(0, 5).map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getScanTypeIcon(scan.scan_type)}
                      <div>
                        <p className="font-mono text-sm font-medium">{scan.barcode}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(scan.scanned_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {scan.location && (
                        <Badge variant="outline" className="text-xs">
                          {scan.location}
                        </Badge>
                      )}
                      <Badge variant={scan.processed ? "default" : "secondary"} className="text-xs">
                        {scan.processed ? <Check className="w-3 h-3" /> : "..."}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}