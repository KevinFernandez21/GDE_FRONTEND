"use client"

import { useState, useEffect, useRef } from "react"
import { QrCode, Scan, Play, Pause, Square, Eye, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

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
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

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
  const [scanType, setScanType] = useState<"guide" | "product" | "package">("guide")
  const [scanLocation, setScanLocation] = useState("")
  const [scanNotes, setScanNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadActiveSessions()
  }, [])

  useEffect(() => {
    if (currentSession) {
      loadScanHistory(currentSession.id)
      const interval = setInterval(() => {
        loadScanHistory(currentSession.id)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [currentSession])

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  }

  const loadActiveSessions = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/api/v1/scanning/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
      const token = getAuthToken()
      if (!token) {
        toast.error("No autorizado")
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/scanning/sessions`, {
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
        const newSession = await response.json()
        setCurrentSession(newSession)
        setActiveSessions(prev => [...prev, newSession])
        setNewSessionName("")
        setNewSessionDescription("")
        setNewSessionExpiry(480)
        setShowQRDialog(true)
        toast.success("Sesión de pistoleo creada exitosamente")
      } else {
        const error = await response.json()
        toast.error(`Error: ${error.detail}`)
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

      const response = await fetch(`${API_BASE_URL}/api/v1/scanning/sessions/${sessionId}/pause`, {
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

      const response = await fetch(`${API_BASE_URL}/api/v1/scanning/sessions/${sessionId}/complete`, {
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
    if (!currentSession || !manualBarcode.trim()) {
      toast.error("Selecciona una sesión activa e ingresa un código de barras")
      return
    }

    setIsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error("No autorizado")
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/scanning/scan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_token: currentSession.session_token,
          barcode: manualBarcode,
          scan_type: scanType,
          location: scanLocation || null,
          notes: scanNotes || null
        })
      })

      if (response.ok) {
        const scanResult = await response.json()
        setScanHistory(prev => [scanResult, ...prev])
        setManualBarcode("")
        setScanLocation("")
        setScanNotes("")

        // Update session scan count
        setCurrentSession(prev => prev ? {
          ...prev,
          scans_count: prev.scans_count + 1,
          last_scan_at: scanResult.scanned_at
        } : null)

        toast.success(`${scanType === 'guide' ? 'Guía' : 'Producto'} escaneado correctamente`)
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

      const response = await fetch(`${API_BASE_URL}/api/v1/scanning/history?session_id=${sessionId}&limit=50`, {
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
    const baseUrl = window.location.origin
    return `${baseUrl}/mobile-scan/${sessionToken}`
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
                  className={`cursor-pointer transition-colors ${
                    currentSession?.id === session.id ? 'ring-2 ring-primary' : 'hover:bg-accent'
                  }`}
                  onClick={() => setCurrentSession(session)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{session.session_name}</h4>
                        {getStatusBadge(session.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {session.description || "Sin descripción"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{session.scans_count} escaneos</span>
                        <span>Expira: {formatDateTime(session.expires_at)}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        {session.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              pauseSession(session.id)
                            }}
                          >
                            <Pause className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            completeSession(session.id)
                          }}
                        >
                          <Square className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentSession(session)
                            setShowQRDialog(true)
                          }}
                        >
                          <QrCode className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Scanning Section */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5" />
              Escaneo Manual - {currentSession.session_name}
            </CardTitle>
            <CardDescription>
              Ingresa códigos de barras manualmente o usa el QR para escaneo móvil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Código de Barras</label>
                <Input
                  placeholder="Escanea o ingresa el código..."
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      scanBarcode()
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Escaneo</label>
                <Select value={scanType} onValueChange={(value: any) => setScanType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guide">Guía de Despacho</SelectItem>
                    <SelectItem value="product">Producto</SelectItem>
                    <SelectItem value="package">Paquete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ubicación (Opcional)</label>
                <Input
                  placeholder="Ej: Almacén A-1"
                  value={scanLocation}
                  onChange={(e) => setScanLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas (Opcional)</label>
                <Textarea
                  placeholder="Observaciones adicionales..."
                  value={scanNotes}
                  onChange={(e) => setScanNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <Button onClick={scanBarcode} disabled={isLoading || !manualBarcode.trim()}>
              {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Scan className="w-4 h-4 mr-2" />}
              Procesar Escaneo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      {currentSession && scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Escaneos</CardTitle>
            <CardDescription>
              Últimos escaneos de la sesión actual ({scanHistory.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scanHistory.slice(0, 10).map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell className="font-mono text-xs">
                      {formatDateTime(scan.scanned_at)}
                    </TableCell>
                    <TableCell className="font-mono">{scan.barcode}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {scan.scan_type === 'guide' ? 'Guía' :
                         scan.scan_type === 'product' ? 'Producto' : 'Paquete'}
                      </Badge>
                    </TableCell>
                    <TableCell>{scan.location || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={scan.processed ? "default" : "secondary"}>
                        {scan.processed ? 'Procesado' : 'Pendiente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {scan.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={generateQRCode(getMobileUrl(currentSession.session_token))}
                  alt="QR Code"
                  className="border rounded-lg"
                  width={250}
                  height={250}
                />
              </div>
              <Alert>
                <AlertDescription className="text-center">
                  <strong>URL Móvil:</strong><br />
                  <code className="text-xs break-all">{getMobileUrl(currentSession.session_token)}</code>
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(getMobileUrl(currentSession.session_token))
                    toast.success("URL copiada al portapapeles")
                  }}
                  className="flex-1"
                >
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
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}