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
import { toast } from "sonner"
import BulkFinancialImportModal from "@/components/bulk-financial-import-modal"
import CostModal from "@/components/modals/cost-modal"
import ExpenseModal from "@/components/modals/expense-modal"
import CapitalModal from "@/components/modals/capital-modal"

export default function ManagementModule() {
  const [showCostImportModal, setShowCostImportModal] = useState(false)
  const [showExpenseImportModal, setShowExpenseImportModal] = useState(false)
  const [showCapitalImportModal, setShowCapitalImportModal] = useState(false)

  // Modals state
  const [showCostModal, setShowCostModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showCapitalModal, setShowCapitalModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  // Datos financieros de ejemplo
  const initialFinancialData = {
    costos: [
      {
        id: 1,
        fecha: "2024-01-05",
        categoria: "Costo de Ventas",
        subcategoria: "Mercadería",
        descripcion: "Compra productos electrónicos",
        monto: 15000,
        proveedor: "Dell Inc",
        documento: "FC-001",
        estado: "Aprobado",
      },
      {
        id: 2,
        fecha: "2024-01-04",
        categoria: "Gastos Operativos",
        subcategoria: "Transporte",
        descripcion: "Flete mercadería importada",
        monto: 2500,
        proveedor: "Transportes ABC",
        documento: "FC-002",
        estado: "Pendiente",
      },
    ],
    gastos: [
      {
        id: 1,
        fecha: "2024-01-05",
        categoria: "Gastos Administrativos",
        subcategoria: "Servicios Básicos",
        descripcion: "Electricidad oficina principal",
        monto: 450,
        proveedor: "Empresa Eléctrica",
        documento: "FC-003",
        estado: "Pagado",
      },
      {
        id: 2,
        fecha: "2024-01-04",
        categoria: "Gastos de Ventas",
        subcategoria: "Marketing",
        descripcion: "Publicidad digital",
        monto: 1200,
        proveedor: "Agencia Digital",
        documento: "FC-004",
        estado: "Aprobado",
      },
    ],
    capital: [
      {
        id: 1,
        fecha: "2024-01-01",
        tipo: "Aporte de Capital",
        descripcion: "Aporte inicial socio A",
        monto: 50000,
        origen: "Socio A",
        documento: "AC-001",
        estado: "Registrado",
      },
      {
        id: 2,
        fecha: "2024-01-15",
        tipo: "Préstamo Bancario",
        descripcion: "Préstamo para capital de trabajo",
        monto: 25000,
        origen: "Banco Nacional",
        documento: "PB-001",
        estado: "Activo",
      },
    ],
  }

  const [editingCell, setEditingCell] = useState<{rowId: number, field: string, tab: string} | null>(null)
  const [editValue, setEditValue] = useState("")
  const [selectedRows, setSelectedRows] = useState<{[key: string]: number[]}>({costos: [], gastos: [], capital: []})
  const [hasChanges, setHasChanges] = useState(false)
  const [managementData, setManagementData] = useState({costos: [], gastos: [], capital: []})
  const [loading, setLoading] = useState(true)

  const fetchCosts = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('http://localhost:8000/api/v1/accounting/costs?page=1&size=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        return result.items || []
      }
    } catch (error) {
      console.error('Error fetching costs:', error)
    }
    return []
  }

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('http://localhost:8000/api/v1/accounting/expenses?page=1&size=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        return result.items || []
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    }
    return []
  }

  const fetchCapital = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch('http://localhost:8000/api/v1/accounting/capital?page=1&size=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        return result.items || []
      }
    } catch (error) {
      console.error('Error fetching capital:', error)
    }
    return []
  }

  const fetchManagementData = async () => {
    setLoading(true)
    try {
      const [costos, gastos, capital] = await Promise.all([
        fetchCosts(),
        fetchExpenses(),
        fetchCapital()
      ])

      setManagementData({
        costos,
        gastos,
        capital
      })
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
      const token = localStorage.getItem('auth_token')
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
      const token = localStorage.getItem('auth_token')
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
      const token = localStorage.getItem('auth_token')
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
          <span className="font-bold">${value.toLocaleString()}</span>
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

  const kpiFinancieros = {
    totalCostos: 17500,
    totalGastos: 1650,
    totalCapital: 75000,
    utilidadBruta: 45000,
    margenBruto: 72.0,
    rotacionInventario: 4.2,
  }

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
              <Button variant="outline" onClick={() => setShowCostImportModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Excel
              </Button>
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
                  checked={selectedRows.costos.length === managementData.costos.length && managementData.costos.length > 0}
                  onCheckedChange={() => handleSelectAll('costos')}
                />
                <span className="text-sm font-medium">
                  {selectedRows.costos.length > 0 ? `${selectedRows.costos.length} seleccionadas` : "Seleccionar todo"}
                </span>
              </div>
              {selectedRows.costos.length > 0 && (
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
                    <p className="text-2xl font-bold text-red-600">${kpiFinancieros.totalCostos.toLocaleString()}</p>
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
                    <p className="text-2xl font-bold text-blue-600">$14.50</p>
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
                  {managementData.costos.map((costo) => {
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
              <Button variant="outline" onClick={() => setShowExpenseImportModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Excel
              </Button>
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
                  checked={selectedRows.gastos.length === managementData.gastos.length && managementData.gastos.length > 0}
                  onCheckedChange={() => handleSelectAll('gastos')}
                />
                <span className="text-sm font-medium">
                  {selectedRows.gastos.length > 0 ? `${selectedRows.gastos.length} seleccionadas` : "Seleccionar todo"}
                </span>
              </div>
              {selectedRows.gastos.length > 0 && (
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
                  {managementData.gastos.map((gasto) => {
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
              <Button variant="outline" onClick={() => setShowCapitalImportModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Excel
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar Balance
              </Button>
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
                    ${kpiFinancieros.totalCapital.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Aportes de Socios</span>
                  <span className="text-xl font-bold text-blue-600">$50,000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium">Préstamos Activos</span>
                  <span className="text-xl font-bold text-orange-600">$25,000</span>
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
                    <span className="font-bold">$125,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pasivos Totales</span>
                    <span className="font-bold">$50,000</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-bold">Patrimonio</span>
                    <span className="font-bold text-green-600">$75,000</span>
                  </div>
                </div>
                <Progress value={60} className="mt-4" />
                <p className="text-sm text-muted-foreground">Ratio de Endeudamiento: 40%</p>
              </CardContent>
            </Card>
          </div>

          {/* Controles de Edicion - Capital */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={selectedRows.capital.length === managementData.capital.length && managementData.capital.length > 0}
                  onCheckedChange={() => handleSelectAll('capital')}
                />
                <span className="text-sm font-medium">
                  {selectedRows.capital.length > 0 ? `${selectedRows.capital.length} seleccionadas` : "Seleccionar todo"}
                </span>
              </div>
              {selectedRows.capital.length > 0 && (
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
                  {managementData.capital.map((capital) => {
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
                  ${kpiFinancieros.utilidadBruta.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Ventas - Costo de Ventas</p>
                <Progress value={75} className="mt-2" />
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
                <Progress value={kpiFinancieros.margenBruto} className="mt-2" />
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
                <Progress value={42} className="mt-2" />
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
                  <span className="font-bold text-green-600">$62,500</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="font-medium">Costo de Ventas</span>
                  <span className="font-bold text-red-600">-$17,500</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium">Utilidad Bruta</span>
                  <span className="font-bold text-blue-600">$45,000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium">Gastos Operativos</span>
                  <span className="font-bold text-orange-600">-$1,650</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <span className="font-bold">Utilidad Neta</span>
                  <span className="font-bold text-purple-600 text-xl">$43,350</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análisis de Costos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Costo de Ventas</span>
                    <span>28%</span>
                  </div>
                  <Progress value={28} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Gastos Administrativos</span>
                    <span>2.6%</span>
                  </div>
                  <Progress value={2.6} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Utilidad Neta</span>
                    <span>69.4%</span>
                  </div>
                  <Progress value={69.4} />
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
        </>
      )}
    </div>
  )
}
