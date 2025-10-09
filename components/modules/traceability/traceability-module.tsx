"use client"

import { Search, Plus, Eye, Edit, Download, Upload, Check, X, Save, Trash2, RowsIcon, QrCode, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import BulkImportModal from "@/components/bulk-import-modal"
import BulkGuideImportModal from "@/components/bulk-guide-import-modal"
import ScanningInterface from "@/components/scanning-interface"
import GuideModal from "@/components/modals/guide-modal"
import KardexModal from "@/components/modals/kardex-modal"
import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"

export default function TraceabilityModule() {
  const [showImportModal, setShowImportModal] = useState(false)
  const [showGuideImportModal, setShowGuideImportModal] = useState(false)

  // New modals state
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [showKardexModal, setShowKardexModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editingCell, setEditingCell] = useState<{rowId: number, field: string, tab: string} | null>(null)
  const [editValue, setEditValue] = useState("")
  const [selectedRows, setSelectedRows] = useState<{[key: string]: number[]}>({guias: [], kardex: []})
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchGuiasDespacho = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('No se encontró token de autenticación')
        return
      }

      const response = await fetch('http://localhost:8000/api/v1/delivery-guides/?page=1&size=50', {
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
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('No se encontró token de autenticación')
        return
      }

      const response = await fetch('http://localhost:8000/api/v1/kardex/?page=1&size=50', {
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

  const fetchTraceabilityData = async () => {
    setLoading(true)
    await Promise.all([fetchGuiasDespacho(), fetchKardexData()])
    setLoading(false)
  }

  useEffect(() => {
    fetchTraceabilityData()
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
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('No se encontró token de autenticación')
        return
      }

      const response = await fetch('http://localhost:8000/api/v1/delivery-guides/', {
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
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('No se encontró token de autenticación')
        return
      }

      const response = await fetch('http://localhost:8000/api/v1/kardex/movement', {
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
          <Tabs defaultValue="guias" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guias">Guías de Despacho</TabsTrigger>
          <TabsTrigger value="kardex">Kardex</TabsTrigger>
          <TabsTrigger value="scanning">Escaneo de Guías</TabsTrigger>
        </TabsList>

        <TabsContent value="guias" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Buscar guías..." className="pl-10" />
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
              <Button variant="outline" onClick={() => setShowGuideImportModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Excel
              </Button>
              <Button onClick={() => handleAddRow('guias')}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Guía
              </Button>
            </div>
          </div>

          {/* Controles de Edición - Guías */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedRows.guias.length === guiasDespacho.length && guiasDespacho.length > 0}
                  onCheckedChange={() => handleSelectAll('guias')}
                />
                <span className="text-sm font-medium">
                  {selectedRows.guias.length > 0 ? `${selectedRows.guias.length} seleccionadas` : "Seleccionar todo"}
                </span>
              </div>
              {selectedRows.guias.length > 0 && (
                <Button variant="destructive" size="sm" onClick={() => handleDeleteRows('guias')}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Seleccionadas
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleAddRow('guias')} size="sm">
                <RowsIcon className="w-4 h-4 mr-2" />
                Agregar Fila
              </Button>
              {hasChanges && (
                <Button onClick={() => {setHasChanges(false); toast.success("Cambios guardados");}} size="sm" variant="default">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              )}
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
                    <TableHead className="w-12">Sel.</TableHead>
                    <TableHead>Código Guía</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Usuario Responsable</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guiasDespacho.map((guia) => {
                    const isSelected = selectedRows.guias?.includes(guia.id)
                    return (
                      <TableRow key={guia.id} className={isSelected ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => handleSelectRow(guia.id, 'guias')}
                          />
                        </TableCell>
                        <TableCell>{renderEditableCell(guia, 'codigo', 'guias')}</TableCell>
                        <TableCell>{renderEditableCell(guia, 'fecha', 'guias')}</TableCell>
                        <TableCell>{renderEditableCell(guia, 'cliente', 'guias')}</TableCell>
                        <TableCell>{renderEditableCell(guia, 'productos', 'guias')}</TableCell>
                        <TableCell>{renderEditableCell(guia, 'estado', 'guias')}</TableCell>
                        <TableCell>{renderEditableCell(guia, 'usuario', 'guias')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
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

        <TabsContent value="kardex" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Buscar movimientos..." className="pl-10" />
              </div>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de movimiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="salida">Salida</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input type="date" className="w-[150px]" />
                <Input type="date" className="w-[150px]" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Excel
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar Kardex
              </Button>
              <Button onClick={() => handleAddRow('kardex')}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Movimiento
              </Button>
            </div>
          </div>

          {/* Controles de Edición - Kardex */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedRows.kardex.length === kardexData.length && kardexData.length > 0}
                  onCheckedChange={() => handleSelectAll('kardex')}
                />
                <span className="text-sm font-medium">
                  {selectedRows.kardex.length > 0 ? `${selectedRows.kardex.length} seleccionadas` : "Seleccionar todo"}
                </span>
              </div>
              {selectedRows.kardex.length > 0 && (
                <Button variant="destructive" size="sm" onClick={() => handleDeleteRows('kardex')}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Seleccionadas
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleAddRow('kardex')} size="sm">
                <RowsIcon className="w-4 h-4 mr-2" />
                Agregar Fila
              </Button>
              {hasChanges && (
                <Button onClick={() => {setHasChanges(false); toast.success("Cambios guardados");}} size="sm" variant="default">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kardex - Historial de Movimientos</CardTitle>
              <CardDescription>Registro detallado de todos los movimientos de inventario</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Sel.</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo Movimiento</TableHead>
                    <TableHead>Documento Ref.</TableHead>
                    <TableHead>Cantidad Entrada</TableHead>
                    <TableHead>Cantidad Salida</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kardexData.map((movement) => {
                    const isSelected = selectedRows.kardex?.includes(movement.id)
                    return (
                      <TableRow key={movement.id} className={isSelected ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => handleSelectRow(movement.id, 'kardex')}
                          />
                        </TableCell>
                        <TableCell>{renderEditableCell(movement, 'fecha', 'kardex')}</TableCell>
                        <TableCell>{renderEditableCell(movement, 'tipoMovimiento', 'kardex')}</TableCell>
                        <TableCell>{renderEditableCell(movement, 'documento', 'kardex')}</TableCell>
                        <TableCell>{renderEditableCell(movement, 'cantidadEntrada', 'kardex')}</TableCell>
                        <TableCell>{renderEditableCell(movement, 'cantidadSalida', 'kardex')}</TableCell>
                        <TableCell>{renderEditableCell(movement, 'saldo', 'kardex')}</TableCell>
                        <TableCell>{renderEditableCell(movement, 'usuario', 'kardex')}</TableCell>
                        <TableCell>{renderEditableCell(movement, 'observaciones', 'kardex')}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

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
        </>
      )}
    </div>
  )
}
