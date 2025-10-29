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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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

  // Search states
  const [searchCosts, setSearchCosts] = useState("")
  const [searchExpenses, setSearchExpenses] = useState("")
  const [searchCapital, setSearchCapital] = useState("")

  // Filter functions
  const filterCosts = (costs: any[]) => {
    if (!searchCosts) return costs
    return costs.filter(costo => 
      (costo.descripcion || costo.description || "").toLowerCase().includes(searchCosts.toLowerCase()) ||
      (costo.name || "").toLowerCase().includes(searchCosts.toLowerCase()) ||
      (costo.category || "").toLowerCase().includes(searchCosts.toLowerCase())
    )
  }

  const filterExpenses = (expenses: any[]) => {
    if (!searchExpenses) return expenses
    return expenses.filter(gasto => 
      (gasto.descripcion || gasto.description || "").toLowerCase().includes(searchExpenses.toLowerCase()) ||
      (gasto.name || "").toLowerCase().includes(searchExpenses.toLowerCase()) ||
      (gasto.category || "").toLowerCase().includes(searchExpenses.toLowerCase())
    )
  }

  const filterCapital = (capital: any[]) => {
    if (!searchCapital) return capital
    return capital.filter(cap => 
      (cap.descripcion || cap.description || "").toLowerCase().includes(searchCapital.toLowerCase()) ||
      (cap.name || cap.socio || "").toLowerCase().includes(searchCapital.toLowerCase()) ||
      (cap.capital_type || cap.tipo || "").toLowerCase().includes(searchCapital.toLowerCase())
    )
  }

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

  // Helper function to calculate totals safely
  const calculateTotal = (items: any[], amountField: string = 'amount', fallbackField: string = 'monto') => {
    if (!items || !Array.isArray(items)) return 0
    return items.reduce((sum, item) => {
      const amount = Number(item[amountField] || item[fallbackField] || 0)
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
  }

  // Helper function to calculate monthly totals
  const calculateMonthlyTotal = (items: any[], amountField: string = 'amount', fallbackField: string = 'monto', dateField: string = 'fecha') => {
    if (!items || !Array.isArray(items)) return 0
    const now = new Date()
    return items.filter(item => {
      const itemDate = new Date(item[dateField])
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
    }).reduce((sum, item) => {
      const amount = Number(item[amountField] || item[fallbackField] || 0)
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
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

  // Delete confirmation for costos
  const [deleteCostTarget, setDeleteCostTarget] = useState<any | null>(null)
  const [isDeletingCost, setIsDeletingCost] = useState(false)

  // Delete confirmation for gastos
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<any | null>(null)
  const [isDeletingExpense, setIsDeletingExpense] = useState(false)

  // Delete confirmation for capital
  const [deleteCapitalTarget, setDeleteCapitalTarget] = useState<any | null>(null)
  const [isDeletingCapital, setIsDeletingCapital] = useState(false)

  const [loading, setLoading] = useState(true)

  const handleConfirmDeleteCost = async () => {
    if (!deleteCostTarget) return
    try {
      setIsDeletingCost(true)
      console.log("Deleting cost with ID:", deleteCostTarget.id)
      
      const response = await apiClient.request(`/accounting/costs/${deleteCostTarget.id}`, {
        method: "DELETE"
      })
      
      console.log("Delete cost response:", response)
      
      if (response.data || response.message) {
        toast.success("Costo eliminado exitosamente")
        setDeleteCostTarget(null)
        fetchManagementData()
      } else {
        toast.error(response.error || "Error al eliminar el costo")
      }
    } catch (error: any) {
      console.error("Delete cost error:", error)
      toast.error(`Error al eliminar el costo: ${error.message || error}`)
    } finally {
      setIsDeletingCost(false)
    }
  }

  const handleConfirmDeleteExpense = async () => {
    if (!deleteExpenseTarget) return
    try {
      setIsDeletingExpense(true)
      console.log("Deleting expense with ID:", deleteExpenseTarget.id)
      
      const response = await apiClient.request(`/accounting/expenses/${deleteExpenseTarget.id}`, {
        method: "DELETE"
      })
      
      console.log("Delete response:", response)
      
      if (response.data || response.message) {
        toast.success("Gasto eliminado exitosamente")
        fetchManagementData()
        setDeleteExpenseTarget(null) // Close dialog
      } else {
        toast.error(response.error || "Error al eliminar el gasto")
      }
    } catch (error: any) {
      console.error("Delete expense error:", error)
      toast.error(`Error al eliminar el gasto: ${error.message || error}`)
    } finally {
      setIsDeletingExpense(false)
    }
  }

  const handleConfirmDeleteCapital = async () => {
    if (!deleteCapitalTarget) return
    try {
      setIsDeletingCapital(true)
      console.log("Deleting capital with ID:", deleteCapitalTarget.id)
      
      const response = await apiClient.request(`/accounting/capital/${deleteCapitalTarget.id}`, {
        method: "DELETE"
      })
      
      console.log("Delete capital response:", response)
      
      if (response.data || response.message) {
        toast.success("Movimiento de capital eliminado exitosamente")
        fetchManagementData()
        setDeleteCapitalTarget(null) // Close dialog
      } else {
        toast.error(response.error || "Error al eliminar el movimiento de capital")
      }
    } catch (error: any) {
      console.error("Delete capital error:", error)
      toast.error(`Error al eliminar el movimiento de capital: ${error.message || error}`)
    } finally {
      setIsDeletingCapital(false)
    }
  }

  // Calculate total costs from current data
  const calculateTotalCosts = useCallback(() => {
    if (!managementData.costos || managementData.costos.length === 0) return 0
    
    return managementData.costos.reduce((total, cost) => {
      const amount = parseFloat(cost.amount || cost.monto || 0)
      return total + (isNaN(amount) ? 0 : amount)
    }, 0)
  }, [managementData.costos])

  // Calculate weighted average cost
  const calculateWeightedAverageCost = useCallback(() => {
    if (!managementData.costos || managementData.costos.length === 0) return 0
    
    const totalAmount = calculateTotalCosts()
    const totalItems = managementData.costos.length
    
    return totalItems > 0 ? totalAmount / totalItems : 0
  }, [managementData.costos, calculateTotalCosts])

  // Clear all costs
  const handleClearCosts = useCallback(async () => {
    if (managementData.costos.length === 0) {
      toast.info("No hay costos para limpiar")
      return
    }

    if (!window.confirm(`¿Estás seguro de que quieres limpiar todos los ${managementData.costos.length} costos? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = await apiClient.request('/accounting/costs/clear', {
        method: 'DELETE'
      })

      if (response.success) {
        setManagementData(prev => ({
          ...prev,
          costos: []
        }))
        setSelectedRows(prev => ({
          ...prev,
          costos: []
        }))
        toast.success(`Se limpiaron ${response.deleted_count || managementData.costos.length} costos`)
      } else {
        toast.error("Error al limpiar los costos")
      }
    } catch (error) {
      console.error('Error clearing costs:', error)
      toast.error("Error al conectar con el servidor")
    }
  }, [managementData.costos.length])

  // Load management data
  const loadManagementData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load financial summary
      const summaryResponse = await apiClient.request('/accounting/financial-summary')
      if (summaryResponse.data) {
        const summary = summaryResponse.data
        setKpiFinancieros(prev => ({
          ...prev,
          totalCostos: summary.costs?.total || 0,
          totalGastos: summary.expenses?.total || 0,
          totalCapital: summary.capital?.total || 0
        }))
      }
      
      // Load costs
      const costsResponse = await apiClient.request('/accounting/costs')
      if (costsResponse.data) {
        setManagementData(prev => ({
          ...prev,
          costos: costsResponse.data.items || []
        }))
      }
      
      // Load expenses
      const expensesResponse = await apiClient.request('/accounting/expenses')
      if (expensesResponse.data) {
        setManagementData(prev => ({
          ...prev,
          gastos: expensesResponse.data.items || []
        }))
      }
      
      // Load capital
      const capitalResponse = await apiClient.request('/accounting/capital')
      if (capitalResponse.data) {
        setManagementData(prev => ({
          ...prev,
          capital: capitalResponse.data.items || []
        }))
      }
      
    } catch (error) {
      console.error('Error loading management data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load data on component mount
  useEffect(() => {
    loadManagementData()
  }, [loadManagementData])

  const fetchCosts = async () => {
    try {
      const response = await apiClient.request('/accounting/costs?page=1&size=50', {
        method: 'GET'
      })

      console.log('Costs response:', response)

      if (response.data) {
        const costs = response.data.items || response.data || []
        console.log('Costs data:', costs)
        console.log('Costs count:', costs.length)
        if (costs.length > 0) {
          console.log('First cost item:', costs[0])
          console.log('Cost amount field:', costs[0].amount || costs[0].monto)
          console.log('All cost fields:', Object.keys(costs[0]))
          
          // Test calculation
          const testTotal = costs.reduce((sum, costo) => {
            const amount = Number(costo.amount || costo.monto || 0)
            console.log(`Costo ${costo.id}: amount=${costo.amount}, monto=${costo.monto}, parsed=${amount}`)
            return sum + (isNaN(amount) ? 0 : amount)
          }, 0)
          console.log('Test total calculation:', testTotal)
        }
        return costs
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

      console.log('Expenses response:', response)

      if (response.data) {
        const expenses = response.data.items || response.data || []
        console.log('Expenses data:', expenses)
        console.log('Expenses count:', expenses.length)
        if (expenses.length > 0) {
          console.log('First expense item:', expenses[0])
          console.log('Expense amount field:', expenses[0].amount || expenses[0].monto)
          console.log('All expense fields:', Object.keys(expenses[0]))
          
          // Test calculation
          const testTotal = expenses.reduce((sum, gasto) => {
            const amount = Number(gasto.amount || gasto.monto || 0)
            console.log(`Gasto ${gasto.id}: amount=${gasto.amount}, monto=${gasto.monto}, parsed=${amount}`)
            return sum + (isNaN(amount) ? 0 : amount)
          }, 0)
          console.log('Test total expenses calculation:', testTotal)
        }
        return expenses
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

      console.log('Fetched data:', { costos, gastos, capital, kpis })
      console.log('Costos details:', costos)
      console.log('Gastos details:', gastos)
      console.log('Capital details:', capital)
      
      // Debug capital calculation
      if (capital && capital.length > 0) {
        console.log('First capital record:', capital[0])
        const totalCapital = capital.reduce((sum, cap) => {
          const amount = cap.monto || cap.amount || 0
          console.log('Capital amount:', amount, 'Type:', typeof amount)
          return sum + Number(amount)
        }, 0)
        console.log('Total capital calculated:', totalCapital)
      }

      // Debug costos calculation
      if (costos && costos.length > 0) {
        console.log('First costo:', costos[0])
        const totalCostos = costos.reduce((sum, costo) => {
          const amount = costo.amount || costo.monto || 0
          console.log('Costo amount:', amount, 'Type:', typeof amount)
          return sum + Number(amount)
        }, 0)
        console.log('Total costos calculated:', totalCostos)
        
        // Test with helper functions
        const helperTotal = calculateTotal(costos)
        const helperMonthly = calculateMonthlyTotal(costos)
        console.log('Helper total:', helperTotal)
        console.log('Helper monthly:', helperMonthly)
      }

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
    
    // Validation for cost entries
    if (editingCell.tab === 'costos') {
      // Validate amount field
      if (editingCell.field === 'monto' || editingCell.field === 'amount') {
        const amount = parseFloat(editValue)
        if (isNaN(amount) || amount < 0) {
          toast.error("El monto debe ser un número válido mayor o igual a 0")
          return
        }
      }
      
      // Validate required fields
      if (editingCell.field === 'name' || editingCell.field === 'categoria') {
        if (!editValue.trim()) {
          toast.error("El nombre/categoría es requerido")
          return
        }
      }
      
      // Check for duplicates in name field
      if (editingCell.field === 'name') {
        const currentData = managementData[editingCell.tab]
        const duplicateExists = currentData.some(item => 
          item.id !== editingCell.rowId && 
          item.name?.toLowerCase().trim() === editValue.toLowerCase().trim()
        )
        if (duplicateExists) {
          toast.error("Ya existe un costo con este nombre")
          return
        }
      }
    }
    
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

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'
      const response = await fetch(`${API_BASE_URL}/accounting/costs`, {
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

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'
      const response = await fetch(`${API_BASE_URL}/accounting/expenses`, {
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

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'
      const response = await fetch(`${API_BASE_URL}/accounting/capital`, {
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="costos">Costos</TabsTrigger>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
          <TabsTrigger value="capital">Capital</TabsTrigger>
        </TabsList>

        <TabsContent value="costos" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Buscar costos..." 
                  className="pl-10" 
                  value={searchCosts}
                  onChange={(e) => setSearchCosts(e.target.value)}
                />
              </div>
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

           {/* Resumen de Costos */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
             <Card>
               <CardContent className="p-4">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-slate-600">Total Costos</p>
                     <p className="text-2xl font-bold text-slate-900">
                       {formatCurrency(calculateTotal(managementData.costos))}
                     </p>
                   </div>
                   <DollarSign className="w-8 h-8 text-red-600" />
                 </div>
               </CardContent>
             </Card>

             <Card>
               <CardContent className="p-4">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-slate-600">Este Mes</p>
                     <p className="text-2xl font-bold text-slate-900">
                       {formatCurrency(calculateMonthlyTotal(managementData.costos))}
                     </p>
                   </div>
                   <TrendingUp className="w-8 h-8 text-orange-600" />
                 </div>
               </CardContent>
             </Card>

             <Card>
               <CardContent className="p-4">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-slate-600">Promedio Diario</p>
                     <p className="text-2xl font-bold text-slate-900">
                       {formatCurrency(managementData.costos?.length > 0 
                         ? (calculateTotal(managementData.costos) / 30) 
                         : 0)}
                     </p>
                   </div>
                   <BarChart3 className="w-8 h-8 text-blue-600" />
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
                       <TableHead>Fecha</TableHead>
                       <TableHead>Categoría</TableHead>
                       <TableHead>Subcategoría</TableHead>
                       <TableHead>Descripción</TableHead>
                       <TableHead>Monto</TableHead>
                       <TableHead>Proveedor</TableHead>
                       <TableHead>Documento</TableHead>
                       <TableHead>Estado</TableHead>
                       <TableHead className="text-right">Acciones</TableHead>
                     </TableRow>
                   </TableHeader>
                <TableBody>
                  {filterCosts(managementData.costos || []).map((costo) => {
                    return (
                      <TableRow key={costo.id}>
                        <TableCell>{renderEditableCell(costo, 'fecha', 'costos')}</TableCell>
                        <TableCell>{renderEditableCell(costo, 'categoria', 'costos')}</TableCell>
                        <TableCell>{renderEditableCell(costo, 'subcategoria', 'costos')}</TableCell>
                        <TableCell>{renderEditableCell(costo, 'descripcion', 'costos')}</TableCell>
                        <TableCell>{renderEditableCell(costo, 'monto', 'costos')}</TableCell>
                        <TableCell>{renderEditableCell(costo, 'proveedor', 'costos')}</TableCell>
                         <TableCell>{renderEditableCell(costo, 'documento', 'costos')}</TableCell>
                         <TableCell>{renderEditableCell(costo, 'estado', 'costos')}</TableCell>
                         <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 console.log("Cost object to delete:", costo)
                                 setDeleteCostTarget(costo)
                               }}
                               className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                               title="Eliminar costo"
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

        <TabsContent value="gastos" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Buscar gastos..." 
                  className="pl-10" 
                  value={searchExpenses}
                  onChange={(e) => setSearchExpenses(e.target.value)}
                />
              </div>
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

          {/* Resumen de Gastos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Gastos</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(calculateTotal(managementData.gastos))}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Este Mes</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(calculateMonthlyTotal(managementData.gastos))}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Promedio Diario</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(managementData.gastos?.length > 0 
                        ? (calculateTotal(managementData.gastos) / 30) 
                        : 0)}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
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
                       <TableHead>Fecha</TableHead>
                       <TableHead>Categoría</TableHead>
                       <TableHead>Subcategoría</TableHead>
                       <TableHead>Descripción</TableHead>
                       <TableHead>Monto</TableHead>
                       <TableHead>Proveedor</TableHead>
                       <TableHead>Estado</TableHead>
                       <TableHead className="text-right">Acciones</TableHead>
                     </TableRow>
                   </TableHeader>
                <TableBody>
                  {filterExpenses(managementData.gastos || []).map((gasto) => {
                    return (
                      <TableRow key={gasto.id}>
                        <TableCell>{renderEditableCell(gasto, 'fecha', 'gastos')}</TableCell>
                        <TableCell>{renderEditableCell(gasto, 'categoria', 'gastos')}</TableCell>
                        <TableCell>{renderEditableCell(gasto, 'subcategoria', 'gastos')}</TableCell>
                        <TableCell>{renderEditableCell(gasto, 'descripcion', 'gastos')}</TableCell>
                        <TableCell>{renderEditableCell(gasto, 'monto', 'gastos')}</TableCell>
                         <TableCell>{renderEditableCell(gasto, 'proveedor', 'gastos')}</TableCell>
                         <TableCell>{renderEditableCell(gasto, 'estado', 'gastos')}</TableCell>
                         <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setDeleteExpenseTarget(gasto)}
                               className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                               title="Eliminar gasto"
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

        <TabsContent value="capital" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <h3 className="text-lg font-semibold">Control de Capital y Financiamiento</h3>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Buscar movimientos de capital..." 
                  className="pl-10" 
                  value={searchCapital}
                  onChange={(e) => setSearchCapital(e.target.value)}
                />
              </div>
            </div>
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

          {/* Resumen de Capital */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Capital Total</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(managementData.capital?.reduce((sum, cap) => {
                        const amount = Number(cap.monto || cap.amount || 0)
                        return sum + (isNaN(amount) ? 0 : amount)
                      }, 0) || 0)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
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
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Nombre/Origen</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterCapital(managementData.capital || []).map((capital) => {
                    return (
                      <TableRow key={capital.id}>
                        <TableCell>{capital.date || capital.fecha || '-'}</TableCell>
                        <TableCell>
                          {capital.capital_type === 'aporte_socio' ? 'Aporte de Socio' :
                           capital.capital_type === 'prestamo' ? 'Préstamo' :
                           capital.capital_type === 'inversion' ? 'Inversión' :
                           capital.capital_type || capital.tipo || '-'}
                        </TableCell>
                        <TableCell>{capital.description || capital.descripcion || '-'}</TableCell>
                        <TableCell>{formatCurrency(capital.monto || capital.amount || 0)}</TableCell>
                        <TableCell>{capital.name || capital.origen || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteCapitalTarget(capital)}
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar movimiento de capital"
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
      </Tabs>
      
      {/* Universal Import Wizards */}
      <Dialog open={showCostsImport} onOpenChange={setShowCostsImport}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">Importar Costos</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Importe costos de producción y operaciones con validación automática
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
            <UniversalImportWizard
              validateEndpoint="/accounting/costs/import/validate"
              importEndpoint="/accounting/costs/import/import"
              importType="costs"
              moduleName="Costos"
              onSuccess={() => {
                setShowCostsImport(false)
                loadManagementData()
                toast.success("Costos importados exitosamente")
              }}
              onCancel={() => setShowCostsImport(false)}
              allowUpdate={true}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showExpensesImport} onOpenChange={setShowExpensesImport}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">Importar Gastos</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Importe gastos operativos y administrativos con validación automática
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
            <UniversalImportWizard
              validateEndpoint="/accounting/expenses/import/validate"
              importEndpoint="/accounting/expenses/import/import"
              importType="expenses"
              moduleName="Gastos"
              onSuccess={() => {
                setShowExpensesImport(false)
                loadManagementData()
                toast.success("Gastos importados exitosamente")
              }}
              onCancel={() => setShowExpensesImport(false)}
              allowUpdate={true}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCapitalImport} onOpenChange={setShowCapitalImport}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">Importar Movimientos de Capital</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Importe inversiones y movimientos de capital con validación automática
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
            <UniversalImportWizard
              validateEndpoint="/accounting/capital/import/validate"
              importEndpoint="/accounting/capital/import/import"
              importType="capital"
              moduleName="Capital"
              onSuccess={() => {
                setShowCapitalImport(false)
                loadManagementData()
                toast.success("Movimientos de capital importados exitosamente")
              }}
              onCancel={() => setShowCapitalImport(false)}
              allowUpdate={false}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Modals */}
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

      {/* Delete confirmation dialog - Costos */}
      <AlertDialog open={!!deleteCostTarget} onOpenChange={(open) => { if (!open) setDeleteCostTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar costo?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Esta acción eliminará el costo${deleteCostTarget && (deleteCostTarget.descripcion || deleteCostTarget.description) ? ` "${deleteCostTarget.descripcion || deleteCostTarget.description}"` : ""} y no se puede deshacer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancelar</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleConfirmDeleteCost} disabled={isDeletingCost}>
                {isDeletingCost ? "Eliminando..." : "Eliminar"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog - Gastos */}
      <AlertDialog open={!!deleteExpenseTarget} onOpenChange={(open) => { if (!open) setDeleteExpenseTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Esta acción eliminará el gasto${deleteExpenseTarget && (deleteExpenseTarget.descripcion || deleteExpenseTarget.description) ? ` "${deleteExpenseTarget.descripcion || deleteExpenseTarget.description}"` : ""} y no se puede deshacer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancelar</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleConfirmDeleteExpense} disabled={isDeletingExpense}>
                {isDeletingExpense ? "Eliminando..." : "Eliminar"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog - Capital */}
      <AlertDialog open={!!deleteCapitalTarget} onOpenChange={(open) => { if (!open) setDeleteCapitalTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento de capital?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Esta acción eliminará el movimiento de capital${deleteCapitalTarget && (deleteCapitalTarget.descripcion || deleteCapitalTarget.description) ? ` "${deleteCapitalTarget.descripcion || deleteCapitalTarget.description}"` : ""} y no se puede deshacer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancelar</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleConfirmDeleteCapital}
                disabled={isDeletingCapital}
              >
                {isDeletingCapital ? "Eliminando..." : "Eliminar"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </>
      )}
    </div>
  )
}
