"use client"

import { Search, Plus, Eye, Edit, Download, Upload, Check, X, Save, Trash2, RowsIcon, QrCode, Scan, FileUp, BarChart3, AlertCircle, CheckCircle2, Clock, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import BulkImportModal from "@/components/bulk-import-modal"
import BulkGuideImportModal from "@/components/bulk-guide-import-modal"
import ScanningInterface from "@/components/scanning-interface"
import GuideModal from "@/components/modals/guide-modal"
import KardexModal from "@/components/modals/kardex-modal"
import UniversalImportWizard from "@/components/shared/universal-import-wizard"
import ExportButton from "@/components/shared/export-button"
import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface TrackingSummary {
  batch_id: string
  batch_name: string
  import_date: string
  total_guides: number
  guides_scanned: number
  guides_pending: number
  guides_in_transit: number
  guides_unknown: number
  guides_duplicate: number
  completion_percentage: number
}

export default function TraceabilityModule() {
  const [showImportModal, setShowImportModal] = useState(false)
  const [showGuideImportModal, setShowGuideImportModal] = useState(false)

  // Universal Import Wizards
  const [showDeliveryGuideImport, setShowDeliveryGuideImport] = useState(false)
  const [showKardexImport, setShowKardexImport] = useState(false)

  // New modals state
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [showKardexModal, setShowKardexModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editingCell, setEditingCell] = useState<{rowId: number, field: string, tab: string} | null>(null)
  const [editValue, setEditValue] = useState("")
  const [selectedRows, setSelectedRows] = useState<{[key: string]: number[]}>({guias: [], kardex: []})
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Search states
  const [searchGuides, setSearchGuides] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter function for guides
  const filterGuides = (guides: any[]) => {
    if (!searchGuides) return guides
    return guides.filter(guia => 
      (guia.codigo || "").toLowerCase().includes(searchGuides.toLowerCase()) ||
      (guia.cliente || "").toLowerCase().includes(searchGuides.toLowerCase()) ||
      (guia.estado || "").toLowerCase().includes(searchGuides.toLowerCase()) ||
      (guia.usuario || "").toLowerCase().includes(searchGuides.toLowerCase())
    )
  }

  // Delete guide function
  const handleDeleteGuide = async (guideId: string) => {
    setIsDeleting(true)
    try {
      // Call API to delete from database
      const response = await apiClient.request(`/delivery-guides/${guideId}`, {
        method: "DELETE"
      })
      
      if (response.data || response.message) {
        // Remove from local state only after successful API call
        setGuiasDespacho(prev => prev.filter(guia => guia.id !== guideId))
        toast.success("Guía eliminada exitosamente")
        setDeleteTarget(null)
      } else {
        toast.error(response.error || "Error al eliminar la guía")
      }
    } catch (error) {
      toast.error("Error al eliminar la guía")
      console.error("Delete guide error:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Guide Master state
  const [trackingSummary, setTrackingSummary] = useState<TrackingSummary | null>(null)
  const [importBatches, setImportBatches] = useState<any[]>([])
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)
  const [pendingGuides, setPendingGuides] = useState<any[]>([])
  const [unknownGuides, setUnknownGuides] = useState<any[]>([])

  const fetchGuiasDespacho = async () => {
    try {
      const token = localStorage.getItem('gde_token')
      if (!token) {
        toast.error('No se encontró token de autenticación')
        return
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'
      const response = await fetch(`${API_BASE_URL}/delivery-guides/?page=1&size=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setGuiasDespacho(result.items || [])
      } else {
        const errorData = await response.json()
        toast.error(errorData.detail || 'Error al cargar guías de despacho')
      }
    } catch (error) {
      console.error('Error fetching delivery guides:', error)
      toast.error('Error de conexión con el servidor')
    }
  }

  const fetchKardexData = async () => {
    try {
      const token = localStorage.getItem('gde_token')
      if (!token) {
        toast.error('No se encontró token de autenticación')
        return
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'
      const response = await fetch(`${API_BASE_URL}/kardex/?page=1&size=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setKardexData(result.items || [])
      } else {
        const errorData = await response.json()
        toast.error(errorData.detail || 'Error al cargar datos de kardex')
      }
    } catch (error) {
      console.error('Error fetching kardex data:', error)
      toast.error('Error de conexión con el servidor')
    }
  }

  const fetchGuideMasterData = async () => {
    try {
      const token = localStorage.getItem('gde_token')
      if (!token) return

      // Fetch tracking summary
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'
      const summaryResponse = await fetch(`${API_BASE_URL}/guide-master/tracking-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (summaryResponse.ok) {
        const summaryResult = await summaryResponse.json()
        setTrackingSummary(summaryResult.data)
      }

      // Fetch import batches
      const batchesResponse = await fetch(`${API_BASE_URL}/guide-master/batches?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (batchesResponse.ok) {
        const batchesResult = await batchesResponse.json()
        setImportBatches(batchesResult.data || [])
      }

      // Fetch pending guides
      const pendingResponse = await fetch(`${API_BASE_URL}/guide-master/pending-guides?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (pendingResponse.ok) {
        const pendingResult = await pendingResponse.json()
        setPendingGuides(pendingResult.data || [])
      }

      // Fetch unknown guides
      const unknownResponse = await fetch(`${API_BASE_URL}/guide-master/unknown-guides?limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (unknownResponse.ok) {
        const unknownResult = await unknownResponse.json()
        setUnknownGuides(unknownResult.data || [])
      }

    } catch (error) {
      console.error('Error fetching guide master data:', error)
    }
  }

  const fetchTraceabilityData = async () => {
    setLoading(true)
    await Promise.all([fetchGuiasDespacho(), fetchKardexData(), fetchGuideMasterData()])
    setLoading(false)
  }

  useEffect(() => {
    fetchTraceabilityData()

    // Auto-refresh tracking summary every 30 seconds
    const interval = setInterval(() => {
      fetchGuideMasterData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const [guiasDespacho, setGuiasDespacho] = useState([])
  const [kardexData, setKardexData] = useState([])

  const handleCellClick = useCallback((rowId: number, field: string, currentValue: any, tab: string) => {
    setEditingCell({ rowId, field, tab })
    setEditValue(String(currentValue))
  }, [])

  const handleCellSave = useCallback(() => {
    if (!editingCell) return

    if (editingCell.tab === 'guias') {
      setGuiasDespacho(prev => prev.map(item => {
        if (item.id === editingCell.rowId) {
          const updatedItem = { ...item }
          const fieldValue = editingCell.field === 'productos' ? parseFloat(editValue) || 0 : editValue
          updatedItem[editingCell.field] = fieldValue
          return updatedItem
        }
        return item
      }))
    } else {
      setKardexData(prev => prev.map(item => {
        if (item.id === editingCell.rowId) {
          const updatedItem = { ...item }
          const fieldValue = ['cantidadEntrada', 'cantidadSalida', 'saldo'].includes(editingCell.field)
                            ? parseFloat(editValue) || 0
                            : editValue
          updatedItem[editingCell.field] = fieldValue
          return updatedItem
        }
        return item
      }))
    }

    setEditingCell(null)
    setEditValue("")
    setHasChanges(true)
    toast.success("Celda actualizada")
  }, [editingCell, editValue])

  const handleCellCancel = useCallback(() => {
    setEditingCell(null)
    setEditValue("")
  }, [])

  const handleSelectRow = useCallback((rowId: number, tab: string) => {
    setSelectedRows(prev => ({
      ...prev,
      [tab]: prev[tab].includes(rowId)
        ? prev[tab].filter(id => id !== rowId)
        : [...prev[tab], rowId]
    }))
  }, [])

  const handleSelectAll = useCallback((tab: string) => {
    const data = tab === 'guias' ? guiasDespacho : kardexData
    setSelectedRows(prev => ({
      ...prev,
      [tab]: prev[tab].length === data.length
        ? []
        : data.map(item => item.id)
    }))
  }, [guiasDespacho, kardexData])

  // Modal handlers
  const handleOpenGuideModal = () => {
    setEditingItem(null)
    setShowGuideModal(true)
  }

  const handleOpenKardexModal = () => {
    setEditingItem(null)
    setShowKardexModal(true)
  }

  const handleSaveGuide = async (guideData: any) => {
    try {
      const token = localStorage.getItem('gde_token')
      if (!token) {
        toast.error('No se encontró token de autenticación')
        return
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'
      const response = await fetch(`${API_BASE_URL}/delivery-guides/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(guideData)
      })

      if (response.ok) {
        toast.success('Guía de despacho creada exitosamente')
        fetchGuiasDespacho()
        setShowGuideModal(false)
      } else {
        const errorData = await response.json()
        toast.error(errorData.detail || 'Error al crear guía de despacho')
      }
    } catch (error) {
      console.error('Error creating guide:', error)
      toast.error('Error de conexión con el servidor')
    }
  }

  const handleSaveKardex = async (kardexMovementData: any) => {
    try {
      const token = localStorage.getItem('gde_token')
      if (!token) {
        toast.error('No se encontró token de autenticación')
        return
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'
      const response = await fetch(`${API_BASE_URL}/kardex/movement`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(kardexMovementData)
      })

      if (response.ok) {
        toast.success('Movimiento de kardex creado exitosamente')
        fetchKardexData()
        setShowKardexModal(false)
      } else {
        const errorData = await response.json()
        toast.error(errorData.detail || 'Error al crear movimiento de kardex')
      }
    } catch (error) {
      console.error('Error creating kardex movement:', error)
      toast.error('Error de conexión con el servidor')
    }
  }

  const handleAddRow = useCallback((tab: string) => {
    if (tab === 'guias') {
      handleOpenGuideModal()
    } else if (tab === 'kardex') {
      handleOpenKardexModal()
    }
  }, [])

  const handleDeleteRows = useCallback((tab: string) => {
    const selectedInTab = selectedRows[tab]
    if (selectedInTab.length === 0) return

    if (tab === 'guias') {
      setGuiasDespacho(prev => prev.filter(item => !selectedInTab.includes(item.id)))
    } else {
      setKardexData(prev => prev.filter(item => !selectedInTab.includes(item.id)))
    }

    setSelectedRows(prev => ({ ...prev, [tab]: [] }))
    setHasChanges(true)
    toast.success(`${selectedInTab.length} filas eliminadas`)
  }, [selectedRows])

  const renderEditableCell = useCallback((item: any, field: string, tab: string) => {
    const isEditing = editingCell?.rowId === item.id && editingCell?.field === field && editingCell?.tab === tab
    const value = item[field]
    const isSelected = selectedRows[tab]?.includes(item.id)

    if (isEditing) {
      if (field === 'estado' || field === 'tipoMovimiento') {
        const options = field === 'estado'
          ? ['Pendiente', 'Despachado', 'En Tránsito', 'Entregado']
          : ['Entrada', 'Salida', 'Ajuste', 'Transferencia']

        return (
          <div className="flex items-center gap-1">
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={handleCellSave}>
              <Check className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCellCancel}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )
      } else {
        return (
          <div className="flex items-center gap-1">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-8 w-full min-w-[120px]"
              type={['productos', 'cantidadEntrada', 'cantidadSalida', 'saldo'].includes(field) ? 'number' : 'text'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCellSave()
                if (e.key === 'Escape') handleCellCancel()
              }}
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleCellSave}>
              <Check className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCellCancel}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )
      }
    }

    const cellClass = `cursor-pointer hover:bg-gray-50 p-2 rounded min-h-[32px] border border-transparent hover:border-blue-300 ${isSelected ? 'bg-blue-50' : ''}`

    if (field === 'estado') {
      const variant = value === "Pendiente" ? "destructive" : value === "Despachado" ? "default" : "secondary"
      return (
        <div className={cellClass} onClick={() => handleCellClick(item.id, field, value, tab)}>
          <Badge variant={variant}>{value}</Badge>
        </div>
      )
    }

    if (field === 'tipoMovimiento') {
      const variant = value === "Entrada" ? "default" : value === "Salida" ? "destructive" : "secondary"
      return (
        <div className={cellClass} onClick={() => handleCellClick(item.id, field, value, tab)}>
          <Badge variant={variant}>{value}</Badge>
        </div>
      )
    }

    if (field === 'codigo' || field === 'documento') {
      return (
        <div className={cellClass} onClick={() => handleCellClick(item.id, field, value, tab)}>
          <span className="font-mono">{value}</span>
        </div>
      )
    }

    return (
      <div className={cellClass} onClick={() => handleCellClick(item.id, field, value, tab)}>
        {value}
      </div>
    )
  }, [editingCell, editValue, selectedRows, handleCellClick, handleCellSave, handleCellCancel])

  return (
    <div className="p-6 space-y-6">
      {loading && (
        <div className="text-center py-8">
          <p>Cargando datos de trazabilidad...</p>
        </div>
      )}

      {!loading && (
        <>
          <Tabs defaultValue="master" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="master">Guías Madre</TabsTrigger>
          <TabsTrigger value="guias">Guías de Despacho</TabsTrigger>
          <TabsTrigger value="scanning">Escaneo de Guías</TabsTrigger>
        </TabsList>

        {/* TAB: GUÍAS MADRE */}
        <TabsContent value="master" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Control de Guías Madre</h3>
              <p className="text-muted-foreground">Sistema de seguimiento en tiempo real con comparación automática</p>
            </div>
            <div className="flex gap-2">
              <ExportButton
                exportEndpoint="/guide-master/export"
                filename="guias_madre"
                variant="outline"
                showLabel={false}
              />
            </div>
          </div>

          {/* Dashboard en Tiempo Real */}
          {trackingSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    Total Guías
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{trackingSummary.total_guides}</div>
                  <p className="text-xs text-muted-foreground mt-1">Guías en el sistema</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Escaneadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{trackingSummary.guides_scanned}</div>
                  <p className="text-xs text-muted-foreground mt-1">{typeof trackingSummary.completion_percentage === 'number' ? trackingSummary.completion_percentage.toFixed(1) : '0.0'}% completado</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    Pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{trackingSummary.guides_pending}</div>
                  <p className="text-xs text-muted-foreground mt-1">Por escanear</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Desconocidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{trackingSummary.guides_unknown}</div>
                  <p className="text-xs text-muted-foreground mt-1">No están en lista madre</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Alerts */}
          {unknownGuides.length > 0 && (
            <Alert className="border-red-500">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertTitle className="text-red-600">Guías Desconocidas Detectadas</AlertTitle>
              <AlertDescription>
                Se han escaneado {unknownGuides.length} guías que NO están en la lista maestra. Revisa estas guías para verificar su origen.
              </AlertDescription>
            </Alert>
          )}

          {/* Lotes de Importación */}
          <Card>
            <CardHeader>
              <CardTitle>Lotes de Importación</CardTitle>
              <CardDescription>Historial de archivos CSV importados desde Droppi</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Lote</TableHead>
                    <TableHead>Fecha de Importación</TableHead>
                    <TableHead>Total Guías</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importBatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No hay lotes importados. Importa un CSV de Droppi para comenzar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    importBatches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.batch_name}</TableCell>
                        <TableCell>{new Date(batch.import_date).toLocaleString('es-ES')}</TableCell>
                        <TableCell>{batch.total_guides}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={50} className="w-24" />
                            <span className="text-xs">50%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Guías Pendientes */}
          {pendingGuides.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Guías Pendientes de Escanear</CardTitle>
                <CardDescription>Estas guías están en la lista madre pero aún no han sido escaneadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Productos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingGuides.slice(0, 10).map((guide) => (
                        <TableRow key={guide.id}>
                          <TableCell className="font-mono">{guide.codigo}</TableCell>
                          <TableCell>{guide.cliente || '-'}</TableCell>
                          <TableCell>{guide.fecha}</TableCell>
                          <TableCell>{guide.productos || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {pendingGuides.length > 10 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Mostrando 10 de {pendingGuides.length} guías pendientes
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Guías Desconocidas */}
          {unknownGuides.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Guías Desconocidas</CardTitle>
                <CardDescription>Estas guías fueron escaneadas pero NO están en la lista maestra</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Fecha Escaneo</TableHead>
                      <TableHead>Veces Escaneada</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unknownGuides.map((guide) => (
                      <TableRow key={guide.id}>
                        <TableCell className="font-mono font-bold text-red-600">{guide.codigo}</TableCell>
                        <TableCell>{new Date(guide.first_scan_at).toLocaleString('es-ES')}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{guide.scans_count}</Badge>
                        </TableCell>
                        <TableCell>{guide.location || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{guide.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: GUÍAS DE DESPACHO (Original) */}
        <TabsContent value="guias" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Buscar guías..." 
                  className="pl-10" 
                  value={searchGuides}
                  onChange={(e) => setSearchGuides(e.target.value)}
                />
              </div>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="despachado">Despachado</SelectItem>
                  <SelectItem value="transito">En Tránsito</SelectItem>
                  <SelectItem value="entregado">Entregado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDeliveryGuideImport(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Guías
              </Button>
              <ExportButton
                exportEndpoint="/delivery-guides/export"
                filename="guias_despacho"
                variant="outline"
                showLabel={false}
              />
              <Button onClick={() => handleAddRow('guias')}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Guía
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estado de Guías de Despacho</CardTitle>
              <CardDescription>Últimas guías registradas en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código Guía</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Usuario Responsable</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterGuides(guiasDespacho).map((guia) => {
                    return (
                      <TableRow key={guia.id}>
                        <TableCell>{renderEditableCell(guia, 'codigo', 'guias')}</TableCell>
                        <TableCell>{renderEditableCell(guia, 'fecha', 'guias')}</TableCell>
                        <TableCell>{renderEditableCell(guia, 'cliente', 'guias')}</TableCell>
                        <TableCell>{renderEditableCell(guia, 'productos', 'guias')}</TableCell>
                        <TableCell>{renderEditableCell(guia, 'estado', 'guias')}</TableCell>
                        <TableCell>{renderEditableCell(guia, 'usuario', 'guias')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setDeleteTarget(guia)}
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar guía"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>


        {/* TAB: ESCANEO DE GUÍAS (Original) */}
        <TabsContent value="scanning" className="space-y-4">
          <ScanningInterface />
        </TabsContent>
      </Tabs>

      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
      <BulkGuideImportModal
        isOpen={showGuideImportModal}
        onClose={() => setShowGuideImportModal(false)}
      />


      <GuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onSave={handleSaveGuide}
        editingGuide={editingItem}
      />

      <KardexModal
        isOpen={showKardexModal}
        onClose={() => setShowKardexModal(false)}
        onSave={handleSaveKardex}
        editingKardex={editingItem}
      />

      {/* Universal Import Wizards */}
      

      {/* Import Guías de Despacho */}
      <Dialog open={showDeliveryGuideImport} onOpenChange={setShowDeliveryGuideImport}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Guías de Despacho</DialogTitle>
            <DialogDescription>
              Importe guías de despacho con validación automática
            </DialogDescription>
          </DialogHeader>
          <UniversalImportWizard
            validateEndpoint="/delivery-guides/import/validate"
            importEndpoint="/delivery-guides/import/import"
            importType="delivery_guides"
            moduleName="Guías de Despacho"
            onSuccess={() => {
              setShowDeliveryGuideImport(false)
              fetchGuiasDespacho()
              toast.success("Guías de despacho importadas exitosamente")
            }}
            onCancel={() => setShowDeliveryGuideImport(false)}
            allowUpdate={true}
          />
        </DialogContent>
      </Dialog>

      {/* Import Kardex */}
      <Dialog open={showKardexImport} onOpenChange={setShowKardexImport}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Movimientos de Kardex</DialogTitle>
            <DialogDescription>
              Importe movimientos de inventario con validación automática
            </DialogDescription>
          </DialogHeader>
          <UniversalImportWizard
            validateEndpoint="/kardex/import/validate"
            importEndpoint="/kardex/import/import"
            importType="kardex"
            moduleName="Kardex"
            onSuccess={() => {
              setShowKardexImport(false)
              fetchKardexData()
              toast.success("Movimientos de kardex importados exitosamente")
            }}
            onCancel={() => setShowKardexImport(false)}
            allowUpdate={false}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar guía?</DialogTitle>
            <DialogDescription>
              {`Esta acción eliminará la guía${deleteTarget ? ` "${deleteTarget.codigo || deleteTarget.id}"` : ""} y no se puede deshacer.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteGuide(deleteTarget?.id)}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  )
}
