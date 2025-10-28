"use client"

import { useState, useCallback, useEffect } from "react"
import { Search, Plus, Eye, Edit, Download, DollarSign, TrendingUp, BarChart3, RotateCcw, Save, X, Check, RowsIcon, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import BulkFinancialImportModal from "@/components/bulk-financial-import-modal"
import CostModal from "@/components/modals/cost-modal"
import ExpenseModal from "@/components/modals/expense-modal"
import CapitalModal from "@/components/modals/capital-modal"
import UniversalImportWizard from "@/components/shared/universal-import-wizard"
import ExportButton from "@/components/shared/export-button"

export default function ManagementModule() {
  const [showCostImportModal, setShowCostImportModal] = useState(false)
  const [showExpenseImportModal, setShowExpenseImportModal] = useState(false)
  const [showCapitalImportModal, setShowCapitalImportModal] = useState(false)

  // Universal Import Wizards
  const [showCostsImport, setShowCostsImport] = useState(false)
  const [showExpensesImport, setShowExpensesImport] = useState(false)
  const [showCapitalImport, setShowCapitalImport] = useState(false)

  // Helper function to safely format numbers
  const formatCurrency = (value: any, options?: Intl.NumberFormatOptions) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0'
    }
    return Number(value).toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      ...options
    })
  }

  const formatNumber = (value: any, options?: Intl.NumberFormatOptions) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0'
    }
    return Number(value).toLocaleString('es-CL', options)
  }

  const formatPercentage = (value: any, decimals: number = 1) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0'
    }
    return Number(value).toFixed(decimals)
  }

  // Modals state
  const [showCostModal, setShowCostModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showCapitalModal, setShowCapitalModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const [editingCell, setEditingCell] = useState<{rowId: number, field: string, tab: string} | null>(null)
  const [editValue, setEditValue] = useState("")
  const [selectedRows, setSelectedRows] = useState<{[key: string]: number[]}>({costos: [], gastos: [], capital: []})
  const [hasChanges, setHasChanges] = useState(false)
  const [managementData, setManagementData] = useState<{costos: any[], gastos: any[], capital: any[]}>({costos: [], gastos: [], capital: []})
  const [kpiFinancieros, setKpiFinancieros] = useState<any>({
    totalCostos: 0,
    totalGastos: 0,
    totalCapital: 0,
    utilidadBruta: 0,
    utilidadNeta: 0,
    margenBruto: 0,
    rotacionInventario: 0,
    aporteSocios: 0,
    prestamosActivos: 0,
    ventasTotales: 0,
    activosTotales: 0,
    pasivosTotales: 0,
    patrimonio: 0,
    ratioEndeudamiento: 0,
    costoPromedioPonderado: 0,
    porcCostosVentas: 0,
    porcGastosAdmin: 0,
    porcUtilidadNeta: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchCosts = async () => {
    try {
      const response = await apiClient.request('/accounting/costs?page=1&size=50', {
        method: 'GET'
      })

      if (response.data) {
        return response.data.items || response.data || []
      }
    } catch (error) {
      console.error('Error fetching costs:', error)
    }
    return []
  }

  const fetchExpenses = async () => {
    try {
      const response = await apiClient.request('/accounting/expenses?page=1&size=50', {
        method: 'GET'
      })

      if (response.data) {
        return response.data.items || response.data || []
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    }
    return []
  }

  const fetchCapital = async () => {
    try {
      const response = await apiClient.request('/accounting/capital?page=1&size=50', {
        method: 'GET'
      })

      if (response.data) {
        return response.data.items || response.data || []
      }
    } catch (error) {
      console.error('Error fetching capital:', error)
    }
    return []
  }

  const fetchKPIs = async () => {
    try {
      const response = await apiClient.request('/accounting/kpis', {
        method: 'GET'
      })

      if (response.data) {
        return response.data
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error)
    }
    return null
  }

  const fetchManagementData = async () => {
    setLoading(true)
    try {
      const [costos, gastos, capital, kpis] = await Promise.all([
        fetchCosts(),
        fetchExpenses(),
        fetchCapital(),
        fetchKPIs()
      ])

      setManagementData({
        costos,
        gastos,
        capital
      })

      if (kpis) {
        // Merge with default values to ensure all properties exist
        setKpiFinancieros({
          totalCostos: 0,
          totalGastos: 0,
          totalCapital: 0,
          utilidadBruta: 0,
          utilidadNeta: 0,
          margenBruto: 0,
          rotacionInventario: 0,
          aporteSocios: 0,
          prestamosActivos: 0,
          ventasTotales: 0,
          activosTotales: 0,
          pasivosTotales: 0,
          patrimonio: 0,
          ratioEndeudamiento: 0,
          costo_promedio_ponderado: 0,
          ...kpis
        })
      }
    } catch (error) {
      console.error('Error fetching management data:', error)
      toast.error('Error al cargar datos de gestión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchManagementData()
  }, [])

  const handleCellClick = useCallback((rowId: number, field: string, currentValue: any, tab: string) => {
    setEditingCell({ rowId, field, tab })
    setEditValue(String(currentValue))
  }, [])

  const handleCellSave = useCallback(() => {
    if (!editingCell) return
    
    setManagementData(prev => {
      const newData = { ...prev }
      const tabData = newData[editingCell.tab]
      const updatedItems = tabData.map(item => {
        if (item.id === editingCell.rowId) {
          const updatedItem = { ...item }
          const fieldValue = editingCell.field === 'monto'
                            ? parseFloat(editValue) || 0
                            : editValue
          updatedItem[editingCell.field] = fieldValue
          if (editingCell.tab !== 'capital') {
            updatedItem.fecha = new Date().toISOString().slice(0, 10)
          }
          return updatedItem
        }
        return item
      })
      newData[editingCell.tab] = updatedItems
      return newData
    })
    
    setEditingCell(null)
    setEditValue("")
    setHasChanges(true)
    toast.success("Celda actualizada")
  }, [editingCell, editValue])

  const handleCellCancel = useCallback(() => {
    setEditingCell(null)
    setEditValue("")
  }, [])

  // Modal handlers
  const handleOpenCostModal = () => {
    setEditingItem(null)
    setShowCostModal(true)
  }

  const handleOpenExpenseModal = () => {
    setEditingItem(null)
    setShowExpenseModal(true)
  }

  const handleOpenCapitalModal = () => {
    setEditingItem(null)
    setShowCapitalModal(true)
  }

  const handleSaveCost = async (costData: any) => {
    try {
      const token = localStorage.getItem('gde_token')
      if (!token) {
        toast.error('No se encontró token de autenticación')
        return
      }

      const response = await fetch('http://localhost:8000/api/v1/accounting/costs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(costData)
      })

      if (response.ok) {
        toast.success('Costo creado exitosamente')
        fetchManagementData()
        setShowCostModal(false)
      } else {
        const errorData = await response.json()
        toast.error(errorData.detail || 'Error al crear costo')
      }
    } catch (error) {
      console.error('Error creating cost:', error)
      toast.error('Error de conexión con el servidor')
    }
  }

  const handleSaveExpense = async (expenseData: any) => {
    try {
      const token = localStorage.getItem('gde_token')
      if (!token) {
        toast.error('No se encontró token de autenticación')
        return
      }

      const response = await fetch('http://localhost:8000/api/v1/accounting/expenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(expenseData)
      })

      if (response.ok) {
        toast.success('Gasto creado exitosamente')
        fetchManagementData()
        setShowExpenseModal(false)
      } else {
        const errorData = await response.json()
        toast.error(errorData.detail || 'Error al crear gasto')
      }
    } catch (error) {
      console.error('Error creating expense:', error)
      toast.error('Error de conexión con el servidor')
    }
  }

  const handleSaveCapital = async (capitalData: any) => {
    try {
      const token = localStorage.getItem('gde_token')
      if (!token) {
        toast.error('No se encontró token de autenticación')
        return
      }

      const response = await fetch('http://localhost:8000/api/v1/accounting/capital', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(capitalData)
      })

      if (response.ok) {
        toast.success('Movimiento de capital creado exitosamente')
        fetchManagementData()
        setShowCapitalModal(false)
      } else {
        const errorData = await response.json()
        toast.error(errorData.detail || 'Error al crear movimiento de capital')
      }
    } catch (error) {
      console.error('Error creating capital movement:', error)
      toast.error('Error de conexión con el servidor')
    }
  }

  const handleAddRow = useCallback((tab: string) => {
    if (tab === 'costos') {
      handleOpenCostModal()
    } else if (tab === 'gastos') {
      handleOpenExpenseModal()
    } else if (tab === 'capital') {
      handleOpenCapitalModal()
    }
  }, [])

  const handleDeleteRows = useCallback((tab: string) => {
    const selectedInTab = selectedRows[tab]
    if (selectedInTab.length === 0) return
    
    setManagementData(prev => ({
      ...prev,
      [tab]: prev[tab].filter(item => !selectedInTab.includes(item.id))
    }))
    
    setSelectedRows(prev => ({ ...prev, [tab]: [] }))
    setHasChanges(true)
    toast.success(`${selectedInTab.length} filas eliminadas`)
  }, [selectedRows])

  const handleSelectRow = useCallback((rowId: number, tab: string) => {
    setSelectedRows(prev => ({
      ...prev,
      [tab]: prev[tab].includes(rowId) 
        ? prev[tab].filter(id => id !== rowId)
        : [...prev[tab], rowId]
    }))
  }, [])

  const handleSelectAll = useCallback((tab: string) => {
    const tabData = managementData[tab]
    setSelectedRows(prev => ({
      ...prev,
      [tab]: prev[tab].length === tabData.length 
        ? []
        : tabData.map(item => item.id)
    }))
  }, [managementData])

  const renderEditableCell = useCallback((item: any, field: string, tab: string) => {
    const isEditing = editingCell?.rowId === item.id && editingCell?.field === field && editingCell?.tab === tab
    const value = item[field]
    const isSelected = selectedRows[tab]?.includes(item.id)
    
    if (isEditing) {
      if (field === 'estado' || field === 'categoria' || field === 'tipo') {
        const options = field === 'estado' 
          ? ['Pendiente', 'Aprobado', 'Pagado', 'Registrado', 'Activo']
          : field === 'categoria'
            ? ['Costo de Ventas', 'Gastos Operativos', 'Gastos Administrativos', 'Gastos de Ventas', 'Gastos Generales']
            : ['Aporte de Capital', 'Préstamo Bancario', 'Inversión']
            
        return (
          <div className="flex items-center gap-1">
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="h-8 w-40">
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
              type={field === 'monto' ? 'number' : field === 'fecha' ? 'date' : 'text'}
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
      const variant = value === "Aprobado" || value === "Pagado" || value === "Registrado" || value === "Activo" ? "default" : "secondary"
      return (
        <div className={cellClass} onClick={() => handleCellClick(item.id, field, value, tab)}>
          <Badge variant={variant}>{value}</Badge>
        </div>
      )
    }
    
    if (field === 'monto') {
      return (
        <div className={cellClass} onClick={() => handleCellClick(item.id, field, value, tab)}>
          <span className="font-bold">{formatCurrency(value)}</span>
        </div>
      )
    }

    if (field === 'documento') {
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
          <p>Cargando datos de gestión...</p>
        </div>
      )}

      {!loading && (
        <>
          <Tabs defaultValue="costos" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="costos">Costos</TabsTrigger>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
          <TabsTrigger value="capital">Capital</TabsTrigger>
          <TabsTrigger value="kpis">KPIs Financieros</TabsTrigger>
        </TabsList>

        <TabsContent value="costos" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Buscar costos..." className="pl-10" />
              </div>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="costo-ventas">Costo de Ventas</SelectItem>
                  <SelectItem value="gastos-operativos">Gastos Operativos</SelectItem>
                  <SelectItem value="gastos-financieros">Gastos Financieros</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input type="date" className="w-[150px]" />
                <Input type="date" className="w-[150px]" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCostsImport(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Costos
              </Button>
              <ExportButton
                exportEndpoint="/accounting/costs/export"
                filename="costos"
                variant="outline"
                showLabel={false}
              />
              <Button onClick={() => handleAddRow('costos')}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Costo
              </Button>
            </div>
          </div>

          {/* Controles de Edicion - Costos */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={(selectedRows.costos?.length || 0) === (managementData.costos?.length || 0) && (managementData.costos?.length || 0) > 0}
                  onCheckedChange={() => handleSelectAll('costos')}
                />
                <span className="text-sm font-medium">
                  {(selectedRows.costos?.length || 0) > 0 ? `${selectedRows.costos.length} seleccionadas` : "Seleccionar todo"}
                </span>
              </div>
              {(selectedRows.costos?.length || 0) > 0 && (
                <Button variant="destructive" size="sm" onClick={() => handleDeleteRows('costos')}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Seleccionadas
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleAddRow('costos')} size="sm">
                <RowsIcon className="w-4 h-4 mr-2" />
                Agregar Fila
              </Button>
              {hasChanges && (
                <Button onClick={() => { setHasChanges(false); toast.success("Cambios guardados"); }} size="sm" variant="default">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800">Total Costos</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(kpiFinancieros.totalCostos)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Costo Promedio Ponderado</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(kpiFinancieros.costo_promedio_ponderado, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Margen Bruto</p>
                    <p className="text-2xl font-bold text-green-600">{kpiFinancieros.margenBruto}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registro de Costos</CardTitle>
              <CardDescription>Gestión detallada de costos de la empresa</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Sel.</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Subcategoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(managementData.costos || []).map((costo) => {
                    const isSelected = selectedRows.costos?.includes(costo.id)
                    return (
                      <TableRow key={costo.id} className={isSelected ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectRow(costo.id, 'costos')}
                          />
                        </TableCell>
                        <TableCell>{renderEditableCell(costo, 'fecha', 'costos')}</TableCell>
                        <TableCell>{renderEditableCell(costo, 'categoria', 'costos')}</TableCell>
                        <TableCell>{renderEditableCell(costo, 'subcategoria', 'costos')}</TableCell>
                        <TableCell>{renderEditableCell(costo, 'descripcion', 'costos')}</TableCell>
                        <TableCell>{renderEditableCell(costo, 'monto', 'costos')}</TableCell>
                        <TableCell>{renderEditableCell(costo, 'proveedor', 'costos')}</TableCell>
                        <TableCell>{renderEditableCell(costo, 'documento', 'costos')}</TableCell>
                        <TableCell>{renderEditableCell(costo, 'estado', 'costos')}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gastos" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Buscar gastos..." className="pl-10" />
              </div>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de Gasto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrativos">Gastos Administrativos</SelectItem>
                  <SelectItem value="ventas">Gastos de Ventas</SelectItem>
                  <SelectItem value="generales">Gastos Generales</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowExpensesImport(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Gastos
              </Button>
              <ExportButton
                exportEndpoint="/accounting/expenses/export"
                filename="gastos"
                variant="outline"
                showLabel={false}
              />
              <Button onClick={() => handleAddRow('gastos')}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Gasto
              </Button>
            </div>
          </div>

          {/* Controles de Edicion - Gastos */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={(selectedRows.gastos?.length || 0) === (managementData.gastos?.length || 0) && (managementData.gastos?.length || 0) > 0}
                  onCheckedChange={() => handleSelectAll('gastos')}
                />
                <span className="text-sm font-medium">
                  {(selectedRows.gastos?.length || 0) > 0 ? `${selectedRows.gastos.length} seleccionadas` : "Seleccionar todo"}
                </span>
              </div>
              {(selectedRows.gastos?.length || 0) > 0 && (
                <Button variant="destructive" size="sm" onClick={() => handleDeleteRows('gastos')}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Seleccionadas
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleAddRow('gastos')} size="sm">
                <RowsIcon className="w-4 h-4 mr-2" />
                Agregar Fila
              </Button>
              {hasChanges && (
                <Button onClick={() => { setHasChanges(false); toast.success("Cambios guardados"); }} size="sm" variant="default">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registro de Gastos</CardTitle>
              <CardDescription>Control de gastos operativos, administrativos y de ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Sel.</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Subcategoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(managementData.gastos || []).map((gasto) => {
                    const isSelected = selectedRows.gastos?.includes(gasto.id)
                    return (
                      <TableRow key={gasto.id} className={isSelected ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectRow(gasto.id, 'gastos')}
                          />
                        </TableCell>
                        <TableCell>{renderEditableCell(gasto, 'fecha', 'gastos')}</TableCell>
                        <TableCell>{renderEditableCell(gasto, 'categoria', 'gastos')}</TableCell>
                        <TableCell>{renderEditableCell(gasto, 'subcategoria', 'gastos')}</TableCell>
                        <TableCell>{renderEditableCell(gasto, 'descripcion', 'gastos')}</TableCell>
                        <TableCell>{renderEditableCell(gasto, 'monto', 'gastos')}</TableCell>
                        <TableCell>{renderEditableCell(gasto, 'proveedor', 'gastos')}</TableCell>
                        <TableCell>{renderEditableCell(gasto, 'estado', 'gastos')}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capital" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h3 className="text-lg font-semibold">Control de Capital y Financiamiento</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCapitalImport(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Capital
              </Button>
              <ExportButton
                exportEndpoint="/accounting/capital/export"
                filename="capital"
                variant="outline"
                showLabel={false}
              />
              <Button onClick={() => handleAddRow('capital')}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Movimiento
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Capital</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Capital Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(kpiFinancieros.totalCapital)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Aportes de Socios</span>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(kpiFinancieros.aporteSocios)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium">Préstamos Activos</span>
                  <span className="text-xl font-bold text-orange-600">{formatCurrency(kpiFinancieros.prestamosActivos)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impacto en Balance General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Activos Totales</span>
                    <span className="font-bold">{formatCurrency(kpiFinancieros.activosTotales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pasivos Totales</span>
                    <span className="font-bold">{formatCurrency(kpiFinancieros.pasivosTotales)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-bold">Patrimonio</span>
                    <span className="font-bold text-green-600">{formatCurrency(kpiFinancieros.patrimonio)}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">Ratio de Endeudamiento: {formatNumber(kpiFinancieros.ratioEndeudamiento, {minimumFractionDigits: 1, maximumFractionDigits: 1})}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Controles de Edicion - Capital */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={(selectedRows.capital?.length || 0) === (managementData.capital?.length || 0) && (managementData.capital?.length || 0) > 0}
                  onCheckedChange={() => handleSelectAll('capital')}
                />
                <span className="text-sm font-medium">
                  {(selectedRows.capital?.length || 0) > 0 ? `${selectedRows.capital.length} seleccionadas` : "Seleccionar todo"}
                </span>
              </div>
              {(selectedRows.capital?.length || 0) > 0 && (
                <Button variant="destructive" size="sm" onClick={() => handleDeleteRows('capital')}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Seleccionadas
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleAddRow('capital')} size="sm">
                <RowsIcon className="w-4 h-4 mr-2" />
                Agregar Fila
              </Button>
              {hasChanges && (
                <Button onClick={() => { setHasChanges(false); toast.success("Cambios guardados"); }} size="sm" variant="default">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Movimientos de Capital</CardTitle>
              <CardDescription>Registro de aportes, préstamos y financiamiento</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Sel.</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(managementData.capital || []).map((capital) => {
                    const isSelected = selectedRows.capital?.includes(capital.id)
                    return (
                      <TableRow key={capital.id} className={isSelected ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectRow(capital.id, 'capital')}
                          />
                        </TableCell>
                        <TableCell>{renderEditableCell(capital, 'fecha', 'capital')}</TableCell>
                        <TableCell>{renderEditableCell(capital, 'tipo', 'capital')}</TableCell>
                        <TableCell>{renderEditableCell(capital, 'descripcion', 'capital')}</TableCell>
                        <TableCell>{renderEditableCell(capital, 'monto', 'capital')}</TableCell>
                        <TableCell>{renderEditableCell(capital, 'origen', 'capital')}</TableCell>
                        <TableCell>{renderEditableCell(capital, 'documento', 'capital')}</TableCell>
                        <TableCell>{renderEditableCell(capital, 'estado', 'capital')}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Utilidad Bruta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatCurrency(kpiFinancieros.utilidadBruta)}
                </div>
                <p className="text-sm text-muted-foreground">Ventas - Costo de Ventas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Margen Bruto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">{kpiFinancieros.margenBruto}%</div>
                <p className="text-sm text-muted-foreground">Utilidad Bruta / Ventas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-purple-600" />
                  Rotación Inventario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-2">{kpiFinancieros.rotacionInventario}x</div>
                <p className="text-sm text-muted-foreground">Veces por año</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Resultados Simplificado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Ventas Totales</span>
                  <span className="font-bold text-green-600">{formatCurrency(kpiFinancieros.ventasTotales)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="font-medium">Costo de Ventas</span>
                  <span className="font-bold text-red-600">-{formatCurrency(kpiFinancieros.totalCostos)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Utilidad Bruta</span>
                  <span className="font-bold text-blue-600">{formatCurrency(kpiFinancieros.utilidadBruta)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium">Gastos Operativos</span>
                  <span className="font-bold text-orange-600">-{formatCurrency(kpiFinancieros.totalGastos)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <span className="font-bold">Utilidad Neta</span>
                  <span className="font-bold text-purple-600 text-xl">{formatCurrency(kpiFinancieros.utilidadBruta - kpiFinancieros.totalGastos)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análisis de Costos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">Costo de Ventas</span>
                    <span className="font-bold text-red-600">{formatPercentage(kpiFinancieros.porc_costos_ventas)}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">Gastos Administrativos</span>
                    <span className="font-bold text-orange-600">{formatPercentage(kpiFinancieros.porc_gastos_admin)}%</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Utilidad Neta</span>
                    <span className="font-bold text-green-600">{formatPercentage(kpiFinancieros.porc_utilidad_neta)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <BulkFinancialImportModal 
        type="costos"
        isOpen={showCostImportModal} 
        onClose={() => setShowCostImportModal(false)} 
      />
      
      <BulkFinancialImportModal 
        type="gastos"
        isOpen={showExpenseImportModal} 
        onClose={() => setShowExpenseImportModal(false)} 
      />
      
      <BulkFinancialImportModal
        type="capital"
        isOpen={showCapitalImportModal}
        onClose={() => setShowCapitalImportModal(false)}
      />

      <CostModal
        isOpen={showCostModal}
        onClose={() => setShowCostModal(false)}
        onSave={handleSaveCost}
        editingCost={editingItem}
      />

      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSave={handleSaveExpense}
        editingExpense={editingItem}
      />

      <CapitalModal
        isOpen={showCapitalModal}
        onClose={() => setShowCapitalModal(false)}
        onSave={handleSaveCapital}
        editingCapital={editingItem}
      />

      {/* Universal Import Wizards */}
      
      {/* Import Costos */}
      <Dialog open={showCostsImport} onOpenChange={setShowCostsImport}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Costos</DialogTitle>
            <DialogDescription>
              Importe costos de producción y operaciones con validación automática
            </DialogDescription>
          </DialogHeader>
          <UniversalImportWizard
            validateEndpoint="/accounting/costs/import/validate"
            importEndpoint="/accounting/costs/import/import"
            importType="costs"
            moduleName="Costos"
            onSuccess={() => {
              setShowCostsImport(false)
              fetchManagementData()
              toast.success("Costos importados exitosamente")
            }}
            onCancel={() => setShowCostsImport(false)}
            allowUpdate={true}
          />
        </DialogContent>
      </Dialog>

      {/* Import Gastos */}
      <Dialog open={showExpensesImport} onOpenChange={setShowExpensesImport}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Gastos</DialogTitle>
            <DialogDescription>
              Importe gastos operativos y administrativos con validación automática
            </DialogDescription>
          </DialogHeader>
          <UniversalImportWizard
            validateEndpoint="/accounting/expenses/import/validate"
            importEndpoint="/accounting/expenses/import/import"
            importType="expenses"
            moduleName="Gastos"
            onSuccess={() => {
              setShowExpensesImport(false)
              fetchManagementData()
              toast.success("Gastos importados exitosamente")
            }}
            onCancel={() => setShowExpensesImport(false)}
            allowUpdate={true}
          />
        </DialogContent>
      </Dialog>

      {/* Import Capital */}
      <Dialog open={showCapitalImport} onOpenChange={setShowCapitalImport}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Movimientos de Capital</DialogTitle>
            <DialogDescription>
              Importe inversiones y movimientos de capital con validación automática
            </DialogDescription>
          </DialogHeader>
          <UniversalImportWizard
            validateEndpoint="/accounting/capital/import/validate"
            importEndpoint="/accounting/capital/import/import"
            importType="capital"
            moduleName="Capital"
            onSuccess={() => {
              setShowCapitalImport(false)
              fetchManagementData()
              toast.success("Movimientos de capital importados exitosamente")
            }}
            onCancel={() => setShowCapitalImport(false)}
            allowUpdate={false}
          />
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  )
}
