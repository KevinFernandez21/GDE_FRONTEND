"use client"

import { useState, useEffect, useRef } from "react"
import {
  QrCode,
  Scan,
  Play,
  Pause,
  Square,
  Eye,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  Activity,
  Copy,
  Settings,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { useDeviceIP } from '@/hooks/use-device-ip'

interface ScanSession {
  id: string
  session_token: string
  session_name: string | null
  description: string | null
  qr_code_data: string
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
  // Guide Master comparison results
  found_in_master?: boolean
  is_duplicate?: boolean
  is_unknown?: boolean
  master_status?: "scanned" | "pending" | "unknown" | "in_transit" | "delivered"
  scans_count?: number
}

// Use full API base including /api/v1 to avoid double slashes and path mistakes
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1"

export default function ScanningInterface() {
  const [activeSessions, setActiveSessions] = useState<ScanSession[]>([])
  const [currentSession, setCurrentSession] = useState<ScanSession | null>(null)
  const [scanHistory, setScanHistory] = useState<BarcodeScan[]>([])
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [newSessionName, setNewSessionName] = useState("")
  const [newSessionDescription, setNewSessionDescription] = useState("")
  const [newSessionExpiry, setNewSessionExpiry] = useState(480)
  const [manualBarcode, setManualBarcode] = useState("")
  const [scanDate, setScanDate] = useState(new Date().toISOString().split('T')[0])
  const [movementType, setMovementType] = useState<"entrada" | "salida">("entrada")
  const [isLoading, setIsLoading] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<{
    type: "success" | "warning" | "error"
    message: string
    details?: string
  } | null>(null)
  
  // Hook para detectar la IP del dispositivo
  const { deviceIP, isLoading: isDetectingIP, error: ipError, isProduction } = useDeviceIP()
  
  // Estado para IP manual y opciones alternativas
  const [manualIP, setManualIP] = useState("")
  const [showIPOptions, setShowIPOptions] = useState(false)
  const [urlConnectivity, setUrlConnectivity] = useState<boolean | null>(null)

  const qrRef = useRef<HTMLDivElement>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadActiveSessions()
  }, [])

  useEffect(() => {
    if (currentSession) {
      loadScanHistory(currentSession.id)
      // Cargar historial mock si no hay conexión al backend
      setTimeout(() => {
        if (scanHistory.length === 0) {
          const mockScans: BarcodeScan[] = [
            {
              id: "scan-1",
              session_id: currentSession.id,
              barcode: "G00045",
              scan_type: "guide",
              location: "Guayaquil",
              notes: "Guía de entrada",
              metadata: {},
              scanned_by: "demo-user",
              scanned_at: new Date(Date.now() - 300000).toISOString(),
              processed: true,
              guide_info: {
                guide_number: "G00045",
                status: "scanned",
                found_in_master: true
              },
              product_info: null
            },
            {
              id: "scan-2",
              session_id: currentSession.id,
              barcode: "G00046",
              scan_type: "guide",
              location: "Guayaquil",
              notes: "Guía de salida",
              metadata: {},
              scanned_by: "demo-user",
              scanned_at: new Date(Date.now() - 600000).toISOString(),
              processed: true,
              guide_info: {
                guide_number: "G00046",
                status: "scanned",
                found_in_master: true
              },
              product_info: null
            }
          ]
          setScanHistory(mockScans)
        }
      }, 1000)
      
      const interval = setInterval(() => {
        loadScanHistory(currentSession.id)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [currentSession])

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gde_token')
    }
    return null
  }

  const loadActiveSessions = async () => {
    try {
      // Try authenticated endpoint first
      const token = getAuthToken()
      if (token) {
        const response = await fetch(`${API_BASE}/scanning/sessions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const sessions = await response.json()
          setActiveSessions(sessions.filter((s: ScanSession) => s.status === 'active' || s.status === 'paused'))
          return
        }
      }

      // Fallback to public endpoint
      const response = await fetch(`${API_BASE}/scanning/public/sessions`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const sessions = await response.json()
        setActiveSessions(sessions.filter((s: ScanSession) => s.status === 'active' || s.status === 'paused'))
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const createScanSession = async () => {
    if (!newSessionName.trim()) {
      toast.error("El nombre de la sesión es requerido")
      return
    }

    setIsCreatingSession(true)
    try {
      // Intentar crear en el backend
      let createdViaBackend = false
      setShowQRDialog(false)
      
      // Intentar crear en el backend también (fallback)
      try {
        const token = getAuthToken()
        if (token) {
          const response = await fetch(`${API_BASE}/scanning/sessions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              session_name: newSessionName,
              description: newSessionDescription || null,
              expires_in_minutes: newSessionExpiry
            })
          })
          
          if (response.ok) {
            const backendSession = await response.json()
            // Actualizar con datos del backend si funciona
            setCurrentSession(backendSession)
            setActiveSessions(prev => [...prev, backendSession])
            
            // Generar URL del QR para acceso móvil
            const mobileUrl = `${window.location.origin}/mobile-scan/${backendSession.session_token}`
            setQrCodeData(mobileUrl)
            setQrCodeUrl(mobileUrl)
            setShowQRDialog(true)
            
            toast.success("Sesión sincronizada con el backend")
            createdViaBackend = true
          }
        }
      } catch (backendError) {
        console.log("Backend no disponible, usando modo demo")
      }
      
      if (!createdViaBackend) {
        toast.error("No se pudo crear sesión. Verifica el backend.")
      }
    } catch (error) {
      console.error('Error creating session:', error)
      toast.error("Error creando sesión")
    } finally {
      setIsCreatingSession(false)
    }
  }

  const pauseSession = async (sessionId: string) => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`${API_BASE}/scanning/sessions/${sessionId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        await loadActiveSessions()
        if (currentSession?.id === sessionId) {
          setCurrentSession(prev => prev ? { ...prev, status: 'paused' } : null)
        }
        toast.success("Sesión pausada")
      }
    } catch (error) {
      console.error('Error pausing session:', error)
      toast.error("Error pausando sesión")
    }
  }

  const completeSession = async (sessionId: string) => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`${API_BASE}/scanning/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        await loadActiveSessions()
        if (currentSession?.id === sessionId) {
          setCurrentSession(null)
        }
        toast.success("Sesión completada")
      }
    } catch (error) {
      console.error('Error completing session:', error)
      toast.error("Error completando sesión")
    }
  }

  const scanBarcode = async () => {
    if (!currentSession || !manualBarcode.trim() || !scanDate || !movementType) {
      toast.error("Completa todos los campos requeridos")
      return
    }

    setIsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error("No autorizado")
        return
      }

      // Process the scan with simplified data
      const response = await fetch(`${API_BASE}/scanning/scan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_token: currentSession.session_token,
          barcode: manualBarcode,
          scan_type: 'guide',
          movement_type: movementType,
          scan_date: scanDate,
          location: null,
          notes: `Fecha: ${scanDate}, Movimiento: ${movementType}`
        })
      })

      if (response.ok) {
        const scanResult = await response.json()

        // If it's a guide, also process it through guide master comparison
        let masterComparison = null
        if (scanType === 'guide') {
          try {
            const masterResponse = await fetch(`${API_BASE}/guide-master/process-scan?barcode=${encodeURIComponent(manualBarcode)}&session_id=${currentSession.id}&location=${encodeURIComponent(scanLocation || '')}&notes=${encodeURIComponent(scanNotes || '')}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })

            if (masterResponse.ok) {
              const masterResult = await masterResponse.json()
              masterComparison = masterResult.data
            }
          } catch (masterError) {
            console.error('Error comparing with master list:', masterError)
            // Continue even if master comparison fails
          }
        }

        // Merge scan result with master comparison
        const enrichedScanResult = {
          ...scanResult,
          found_in_master: masterComparison?.found_in_master,
          is_duplicate: masterComparison?.is_duplicate,
          is_unknown: masterComparison?.is_unknown,
          master_status: masterComparison?.status,
          scans_count: masterComparison?.scans_count
        }

        setScanHistory(prev => [enrichedScanResult, ...prev])
        setManualBarcode("")
        setScanLocation("")
        setScanNotes("")

        // Update session scan count
        setCurrentSession(prev => prev ? {
          ...prev,
          scans_count: prev.scans_count + 1,
          last_scan_at: scanResult.scanned_at
        } : null)

        // Set last scan result for visual feedback
        if (scanType === 'guide' && masterComparison) {
          if (masterComparison.is_unknown) {
            setLastScanResult({
              type: "error",
              message: "⚠️ Guía NO encontrada en lista maestra",
              details: `Código: ${manualBarcode} - Esta guía no está registrada en el sistema`
            })
            toast.error(`⚠️ Guía NO encontrada en la lista maestra: ${manualBarcode}`, {
              duration: 5000,
              description: 'Esta guía no está registrada en el sistema'
            })
          } else if (masterComparison.is_duplicate) {
            setLastScanResult({
              type: "warning",
              message: `🔄 Guía duplicada (${masterComparison.scans_count} escaneos)`,
              details: `Código: ${manualBarcode} - Ya fue escaneada anteriormente`
            })
            toast.warning(`🔄 Guía ya escaneada anteriormente (${masterComparison.scans_count} veces)`, {
              duration: 4000,
              description: `Código: ${manualBarcode}`
            })
          } else {
            setLastScanResult({
              type: "success",
              message: "✅ Guía verificada exitosamente",
              details: `Código: ${manualBarcode} - Encontrada en lista maestra`
            })
            toast.success(`✅ Guía encontrada en lista maestra y registrada`, {
              duration: 3000,
              description: `Código: ${manualBarcode}`
            })
          }
        } else {
          setLastScanResult({
            type: "success",
            message: `✅ ${scanType === 'guide' ? 'Guía' : 'Producto'} escaneado`,
            details: `Código: ${manualBarcode}`
          })
          toast.success(`${scanType === 'guide' ? 'Guía' : 'Producto'} escaneado correctamente`)
        }

        // Auto-focus back to input for rapid scanning
        setTimeout(() => {
          barcodeInputRef.current?.focus()
        }, 100)
      } else {
        const error = await response.json()
        toast.error(`Error: ${error.detail}`)
      }
    } catch (error) {
      console.error('Error scanning barcode:', error)
      toast.error("Error procesando escaneo")
    } finally {
      setIsLoading(false)
    }
  }

  const loadScanHistory = async (sessionId: string) => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`${API_BASE}/scanning/history?session_id=${sessionId}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const history = await response.json()
        setScanHistory(history)
      }
    } catch (error) {
      console.error('Error loading scan history:', error)
    }
  }

  const generateQRCode = (data: string) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`
    return qrUrl
  }

  const getMobileUrl = (sessionToken: string) => {
    // Si estamos en producción, usar la URL de producción
    if (isProduction) {
      return `https://v0-mejora-de-interfaz-mu.vercel.app/mobile-scan/${sessionToken}`
    }
    
    // En desarrollo, usar la lógica anterior
    const port = window.location.port || '3000'
    
    // Use manual IP if set, otherwise use detected IP, otherwise fallback to current hostname
    const hostname = manualIP || deviceIP || window.location.hostname
    
    // If we have a manual IP or detected IP, use it; otherwise use the current hostname
    if ((manualIP || deviceIP) && hostname !== '127.0.0.1') {
      return `http://${hostname}:${port}/mobile-scan/${sessionToken}`
    }
    
    // Fallback to current hostname
    return `${window.location.protocol}//${hostname}:${port}/mobile-scan/${sessionToken}`
  }

  const testUrlConnectivity = async (url: string) => {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      })
      return true
    } catch (error) {
      return false
    }
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pistoleo de Guías</h2>
          <p className="text-muted-foreground">
            Sistema de escaneo móvil para registro de guías de despacho
          </p>
        </div>
        <Button onClick={() => setShowQRDialog(true)} className="flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          Nueva Sesión de Pistoleo
        </Button>
      </div>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Sesiones Activas
          </CardTitle>
          <CardDescription>
            Sesiones de pistoleo en curso. Selecciona una para comenzar a escanear.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay sesiones activas. Crea una nueva sesión para comenzar.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeSessions.map((session) => (
                <Card
                  key={session.id}
                  className={`transition-colors ${
                    currentSession?.id === session.id ? 'ring-2 ring-primary' : 'hover:bg-accent'
                  }`}
                >
                  <CardContent className="p-6">
                    {/* Session Header */}
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pistoleo Móvil</h2>
                      <p className="text-gray-600 dark:text-gray-400">{session.session_name}</p>
                      <p className="text-sm text-gray-500">IP: {deviceIP}</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {getStatusBadge(session.status)}
                        <span className="text-xs text-muted-foreground">{session.scans_count} escaneos</span>
                      </div>
                    </div>

                    {/* Last Scan Result */}
                    {currentSession?.id === session.id && lastScanResult && (
                      <Alert
                        className={`mb-4 ${
                          lastScanResult.type === "success"
                            ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800"
                            : lastScanResult.type === "warning"
                            ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800"
                            : "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                        }`}
                      >
                        {lastScanResult.type === "success" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : lastScanResult.type === "warning" ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <AlertTitle className={
                          lastScanResult.type === "success"
                            ? "text-green-900 dark:text-green-100"
                            : lastScanResult.type === "warning"
                            ? "text-yellow-900 dark:text-yellow-100"
                            : "text-red-900 dark:text-red-100"
                        }>
                          {lastScanResult.message}
                        </AlertTitle>
                        {lastScanResult.details && (
                          <AlertDescription className={
                            lastScanResult.type === "success"
                              ? "text-green-800 dark:text-green-200"
                              : lastScanResult.type === "warning"
                              ? "text-yellow-800 dark:text-yellow-200"
                              : "text-red-800 dark:text-red-200"
                          }>
                            {lastScanResult.details}
                          </AlertDescription>
                        )}
                      </Alert>
                    )}

                    {/* Movement Type Selection */}
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold mb-4">Tipo de Movimiento</h3>
                      <div className="flex gap-4 justify-center">
                        <Button
                          size="lg"
                          className={`h-20 w-32 text-lg ${
                            currentSession?.id === session.id && movementType === 'entrada' 
                              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                          onClick={() => {
                            setCurrentSession(session)
                            setMovementType('entrada')
                          }}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-3xl">📥</span>
                            <span className="font-bold">Entrada</span>
                            <span className="text-xs">Suma al inventario</span>
                          </div>
                        </Button>
                        
                        <Button
                          size="lg"
                          className={`h-20 w-32 text-lg ${
                            currentSession?.id === session.id && movementType === 'salida' 
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                          onClick={() => {
                            setCurrentSession(session)
                            setMovementType('salida')
                          }}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-3xl">📤</span>
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
                          setCurrentSession(session)
                          // Activar cámara directamente
                          toast.info("Iniciando cámara para escaneo...")
                          // TODO: Implementar activación real de cámara
                        }}
                        disabled={currentSession?.id !== session.id || !movementType}
                      >
                        <Scan className="w-8 h-8 mr-4" />
                        Iniciar Cámara
                      </Button>
                      <p className="text-sm text-gray-500 mt-3">
                        {currentSession?.id === session.id && movementType 
                          ? `Modo: ${movementType === 'entrada' ? 'Entrada' : 'Salida'}` 
                          : 'Selecciona un tipo de movimiento'}
                      </p>
                    </div>

                    {/* Session Actions */}
                    <div className="flex gap-2 justify-center pt-4 border-t">
                      {session.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => pauseSession(session.id)}
                        >
                          <Pause className="w-3 h-3 mr-1" />
                          Pausar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => completeSession(session.id)}
                      >
                        <Square className="w-3 h-3 mr-1" />
                        Completar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCurrentSession(session)
                          setShowQRDialog(true)
                        }}
                      >
                        <QrCode className="w-3 h-3 mr-1" />
                        QR
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>



      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentSession ? 'Código QR de Sesión' : 'Nueva Sesión de Pistoleo'}
            </DialogTitle>
            <DialogDescription>
              {currentSession
                ? 'Escanea este código QR con tu móvil para comenzar a pistolar'
                : 'Configura una nueva sesión de pistoleo'
              }
            </DialogDescription>
          </DialogHeader>

          {!currentSession ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de la Sesión *</label>
                <Input
                  placeholder="Ej: Pistoleo Almacén A - Turno Mañana"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  placeholder="Descripción opcional de la sesión..."
                  value={newSessionDescription}
                  onChange={(e) => setNewSessionDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duración (minutos)</label>
                <Select value={newSessionExpiry.toString()} onValueChange={(value) => setNewSessionExpiry(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="240">4 horas</SelectItem>
                    <SelectItem value="480">8 horas</SelectItem>
                    <SelectItem value="720">12 horas</SelectItem>
                    <SelectItem value="1440">24 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createScanSession} disabled={isCreatingSession} className="w-full">
                {isCreatingSession ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
                Crear Sesión
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Título del modal */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">Código QR de Sesión</h3>
                <p className="text-sm text-gray-600 mt-1">Escanea este código QR con tu móvil para comenzar a pistolar</p>
              </div>

              {/* QR Code con mejor diseño */}
              <div className="flex justify-center">
                <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-100">
                  <img
                    src={generateQRCode(getMobileUrl(currentSession.session_token))}
                    alt="QR Code"
                    className="rounded-lg"
                    width={280}
                    height={280}
                  />
                </div>
              </div>

              {/* URL Móvil con mejor diseño */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-2">URL Móvil:</p>
                  <div className="bg-white rounded-md p-3 border">
                    <code className="text-xs break-all text-gray-800 font-mono">
                      {getMobileUrl(currentSession.session_token)}
                    </code>
                  </div>
                  
                  {/* Estados de IP */}
                  {isProduction && (
                    <div className="mt-3 flex items-center justify-center text-xs text-blue-600">
                      <span className="mr-1">🌐</span>
                      Modo producción: Usando URL de Vercel
                    </div>
                  )}
                  {!isProduction && deviceIP && !manualIP && (
                    <div className="mt-3 flex items-center justify-center text-xs text-green-600">
                      <span className="mr-1">✓</span>
                      IP del dispositivo detectada: <span className="font-semibold ml-1">{deviceIP}</span>
                    </div>
                  )}
                  {!isProduction && manualIP && (
                    <div className="mt-3 flex items-center justify-center text-xs text-blue-600">
                      <span className="mr-1">✓</span>
                      IP manual configurada: <span className="font-semibold ml-1">{manualIP}</span>
                    </div>
                  )}
                  {!isProduction && isDetectingIP && !manualIP && (
                    <div className="mt-3 flex items-center justify-center text-xs text-yellow-600">
                      <span className="mr-1">🔍</span>
                      Detectando IP del dispositivo...
                    </div>
                  )}
                  {!isProduction && ipError && !manualIP && (
                    <div className="mt-3 flex items-center justify-center text-xs text-red-600">
                      <span className="mr-1">⚠️</span>
                      No se pudo detectar la IP automáticamente
                    </div>
                  )}
                  {urlConnectivity === false && (
                    <div className="mt-3 flex items-center justify-center text-xs text-red-600">
                      <span className="mr-1">❌</span>
                      La URL no es accesible desde el móvil
                    </div>
                  )}
                  {urlConnectivity === true && (
                    <div className="mt-3 flex items-center justify-center text-xs text-green-600">
                      <span className="mr-1">✅</span>
                      URL accesible
                    </div>
                  )}
                </div>
              </div>
              {/* Botones de acción con mejor diseño */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(getMobileUrl(currentSession.session_token))
                      toast.success("URL copiada al portapapeles")
                    }}
                    className="h-10 bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar URL
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = generateQRCode(getMobileUrl(currentSession.session_token))
                      link.download = `qr-session-${currentSession.session_name}.png`
                      link.click()
                    }}
                    className="h-10 bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar QR
                  </Button>
                </div>
                {!isProduction && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowIPOptions(!showIPOptions)}
                      className="h-10 bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar IP
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        setUrlConnectivity(null)
                        const url = getMobileUrl(currentSession.session_token)
                        const isAccessible = await testUrlConnectivity(url)
                        setUrlConnectivity(isAccessible)
                        if (isAccessible) {
                          toast.success("URL accesible desde el móvil")
                        } else {
                          toast.error("URL no accesible. Verifica la configuración de red")
                        }
                      }}
                      className="h-10 bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Probar URL
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Panel de configuración de IP */}
              {!isProduction && showIPOptions && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-3">Configuración de IP</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="manual-ip">IP Manual (opcional)</Label>
                      <Input
                        id="manual-ip"
                        placeholder="Ej: 192.168.1.100"
                        value={manualIP}
                        onChange={(e) => setManualIP(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Si el QR no funciona, ingresa manualmente la IP de tu dispositivo
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setManualIP("")
                          setUrlConnectivity(null)
                        }}
                      >
                        Usar IP Automática
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setManualIP(window.location.hostname)
                          setUrlConnectivity(null)
                        }}
                      >
                        Usar Localhost
                      </Button>
                    </div>
                    <div className="text-xs text-gray-600">
                      <p><strong>IPs comunes:</strong></p>
                      <p>• 192.168.1.x (red doméstica)</p>
                      <p>• 192.168.0.x (red doméstica)</p>
                      <p>• 10.0.0.x (red corporativa)</p>
                      <p>• 172.16.x.x (red corporativa)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}