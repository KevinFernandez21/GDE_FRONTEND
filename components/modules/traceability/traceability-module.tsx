"use client"

import { Search, Plus, Eye, Edit, Download, Upload, Check, X, Save, Trash2, RowsIcon, QrCode, Scan, FileUp, BarChart3, AlertCircle, CheckCircle2, Clock, Package, ChevronLeft, ChevronRight } from "lucide-react"
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
import GuideComparisonUpload from "@/components/guide-comparison-upload"
import GuideModal from "@/components/modals/guide-modal"
import KardexModal from "@/components/modals/kardex-modal"
import RegisterEventModal from "@/components/modals/register-event-modal"
import MarkInconsistencyModal from "@/components/modals/mark-inconsistency-modal"
import UniversalImportWizard from "@/components/shared/universal-import-wizard"
import ExportButton from "@/components/shared/export-button"
import GuideDashboard from "./guide-dashboard"
import GuideList from "./guide-list"
import GuideDetail from "./guide-detail"
import DeliveryGuidesList from "./delivery-guides-list"
import { useState, useCallback, useEffect, useRef, useMemo } from "react"
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
  const [showRegisterEventModal, setShowRegisterEventModal] = useState(false)
  const [showMarkInconsistencyModal, setShowMarkInconsistencyModal] = useState(false)
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [viewingGuideDetail, setViewingGuideDetail] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState(null)
  const [editingCell, setEditingCell] = useState<{rowId: number, field: string, tab: string} | null>(null)
  const [editValue, setEditValue] = useState("")
  const [selectedRows, setSelectedRows] = useState<{[key: string]: number[]}>({guias: [], kardex: []})
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Search and pagination states
  const [searchGuides, setSearchGuides] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Pagination state - Server-side pagination for performance
  const [currentPageGuides, setCurrentPageGuides] = useState(1)
  const [pageSizeGuides] = useState(100) // 100 guías por página
  const [totalGuides, setTotalGuides] = useState(0)
  const totalPagesGuides = Math.ceil(totalGuides / pageSizeGuides)
  
  // Guías de despacho state - declared early to avoid initialization errors
  const [guiasDespacho, setGuiasDespacho] = useState([])
  const [kardexData, setKardexData] = useState([])
  
  // Bulk selection state
  const [selectedGuides, setSelectedGuides] = useState<Set<string | number>>(new Set())
  
  // Calculate isSelectAllGuides based on current state (derived value)
  const isSelectAllGuides = useMemo(() => {
    if (guiasDespacho.length === 0) return false
    return guiasDespacho.length > 0 && guiasDespacho.every(g => selectedGuides.has(g.id))
  }, [guiasDespacho, selectedGuides])
  
  // Ref to prevent loop when resetting page from search
  const isSearchResetRef = useRef(false)

  // Server-side filtering is handled in fetchGuiasDespacho
  // No client-side filtering needed

  // Delete guide function
  const handleDeleteGuide = async (guideId: string | number) => {
    setIsDeleting(true)
    try {
      // Call API to delete from database
      const response = await apiClient.request(`/delivery-guides/${guideId}`, {
        method: "DELETE"
      })
      
      if (response.data || response.message) {
        toast.success("Guía eliminada exitosamente")
        setDeleteTarget(null)
        // Reload current page
        fetchGuiasDespacho(currentPageGuides)
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
  
  // Handle individual guide selection
  const handleToggleSelectGuide = (guideId: string | number) => {
    const newSelected = new Set(selectedGuides)
    if (newSelected.has(guideId)) {
      newSelected.delete(guideId)
    } else {
      newSelected.add(guideId)
    }
    setSelectedGuides(newSelected)
    // isSelectAllGuides is now calculated automatically via useMemo
  }

  // Handle select all guides
  const handleSelectAllGuides = () => {
    if (isSelectAllGuides) {
      setSelectedGuides(new Set())
    } else {
      const allIds = new Set(guiasDespacho.map(g => g.id))
      setSelectedGuides(allIds)
    }
    // isSelectAllGuides is now calculated automatically via useMemo
  }
  
  // Handle bulk delete guides
  const handleBulkDeleteGuides = async () => {
    if (selectedGuides.size === 0) {
      toast.info("Selecciona al menos una guía para eliminar")
      return
    }

    const startTime = Date.now()
    const loadingToast = toast.loading(`Eliminando ${selectedGuides.size} guía(s)...`)

    try {
      // Convert Set to Array and ensure integers
      const guideIds = Array.from(selectedGuides).map(id => {
        // Ensure ID is integer (delivery guides use integer IDs)
        return typeof id === 'string' ? parseInt(id, 10) : id
      })

      const response = await apiClient.request("/delivery-guides/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ guide_ids: guideIds })
      })

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

      if (response.data || response.message) {
        toast.dismiss(loadingToast)
        toast.success(`${selectedGuides.size} guía(s) eliminada(s) exitosamente`, {
          description: `Operación completada en ${elapsed}s`
        })
        setSelectedGuides(new Set())
        // isSelectAllGuides is now calculated automatically via useMemo
        // Reload current page
        await fetchGuiasDespacho(currentPageGuides, searchGuides)
      } else {
        toast.dismiss(loadingToast)
        toast.error(response.error || "Error al eliminar las guías")
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error("Error al eliminar las guías")
      console.error("Bulk delete guides error:", error)
    }
  }

  // Guide Master state
  const [trackingSummary, setTrackingSummary] = useState<TrackingSummary | null>(null)
  const [importBatches, setImportBatches] = useState<any[]>([])
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)
  const [pendingGuides, setPendingGuides] = useState<any[]>([])
  const [unknownGuides, setUnknownGuides] = useState<any[]>([])


  const fetchGuiasDespacho = useCallback(async (page: number, search: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('gde_token')
      if (!token) {
        toast.error('No se encontró token de autenticación')
        return
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSizeGuides.toString()
      })
      
      // Add search filter if present
      if (search && search.trim()) {
        params.append("search", search.trim())
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
      
      // Create abort controller with timeout
      const abortController = new AbortController()
      const timeoutId = setTimeout(() => abortController.abort(), 15000) // 15 second timeout
      
      try {
        const response = await fetch(`${baseUrl}/delivery-guides/?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: abortController.signal
        })
        
        clearTimeout(timeoutId)

        if (response.ok) {
          const result = await response.json()
          setGuiasDespacho(result.items || [])
          setTotalGuides(result.total || 0)
          // Update currentPageGuides to match the page we requested
          setCurrentPageGuides(result.page || page)
        } else {
          try {
            const errorData = await response.json()
            toast.error(errorData.detail || 'Error al cargar guías de despacho')
          } catch {
            toast.error(`Error ${response.status}: ${response.statusText}`)
          }
          setGuiasDespacho([])
          setTotalGuides(0)
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        throw fetchError
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Request timeout fetching delivery guides')
        toast.error('Tiempo de espera agotado. Intenta nuevamente.')
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.warn('Network error fetching delivery guides - backend may be unavailable')
        toast.error('Error de conexión con el servidor')
      } else {
        console.error('Error fetching delivery guides:', error)
        toast.error('Error al cargar guías de despacho')
      }
      setGuiasDespacho([])
      setTotalGuides(0)
    } finally {
      setLoading(false)
    }
  }, [pageSizeGuides])

  const fetchKardexData = async () => {
    try {
      const token = localStorage.getItem('gde_token')
      if (!token) {
        console.warn('No token found for fetchKardexData')
        return
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
      
      // Create abort controller with timeout
      const abortController = new AbortController()
      const timeoutId = setTimeout(() => abortController.abort(), 15000) // 15 second timeout
      
      try {
        const response = await fetch(`${baseUrl}/kardex/?page=1&size=50`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: abortController.signal
        })
        
        clearTimeout(timeoutId)

        if (response.ok) {
          const result = await response.json()
          setKardexData(result.items || [])
        } else {
          try {
            const errorData = await response.json()
            console.warn('Error fetching kardex:', errorData.detail || response.statusText)
          } catch {
            console.warn(`Error ${response.status} fetching kardex`)
          }
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        throw fetchError
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Request timeout fetching kardex data')
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.warn('Network error fetching kardex data - backend may be unavailable')
      } else {
        console.error('Error fetching kardex data:', error)
      }
      // Don't show toast for background fetches
    }
  }

  const fetchGuideMasterData = async () => {
    try {
      const token = localStorage.getItem('gde_token')
      if (!token) {
        console.warn('No token found, skipping fetchGuideMasterData')
        return
      }

      // Get API base URL - ensure it's properly formatted
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL

      // Helper function to safely fetch with error handling
      const safeFetch = async (endpoint: string, errorLabel: string) => {
        const abortController = new AbortController()
        const timeoutId = setTimeout(() => abortController.abort(), 10000) // 10 second timeout
        
        try {
          const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            signal: abortController.signal
          })
          
          // Clear timeout if request completed successfully
          clearTimeout(timeoutId)

          if (response.ok) {
            const result = await response.json()
            return result
          } else {
            console.warn(`Failed to fetch ${errorLabel}:`, response.status, response.statusText)
            return null
          }
        } catch (error: any) {
          // Clear timeout on error
          clearTimeout(timeoutId)
          
          // Don't log network errors in console.error to avoid spam
          if (error.name === 'AbortError') {
            console.warn(`Request timeout for ${errorLabel}`)
          } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            // Network error - backend might be down
            console.warn(`Network error fetching ${errorLabel} - backend may be unavailable`)
          } else {
            console.warn(`Error fetching ${errorLabel}:`, error.message)
          }
          return null
        }
      }

      // Fetch tracking summary
      const summaryResult = await safeFetch('/guide-master/tracking-summary', 'tracking summary')
      if (summaryResult?.data) {
        setTrackingSummary(summaryResult.data)
      }

      // Fetch import batches
      const batchesResult = await safeFetch('/guide-master/batches?limit=10', 'import batches')
      if (batchesResult?.data) {
        setImportBatches(batchesResult.data || [])
      }

      // Fetch pending guides
      const pendingResult = await safeFetch('/guide-master/pending-guides?limit=50', 'pending guides')
      if (pendingResult?.data) {
        setPendingGuides(pendingResult.data || [])
      }

      // Fetch unknown guides
      const unknownResult = await safeFetch('/guide-master/unknown-guides?limit=20', 'unknown guides')
      if (unknownResult?.data) {
        setUnknownGuides(unknownResult.data || [])
      }

    } catch (error: any) {
      // Only log unexpected errors
      if (error.name !== 'TypeError' || error.message !== 'Failed to fetch') {
        console.error('Unexpected error in fetchGuideMasterData:', error)
      }
    }
  }

  // fetchTraceabilityData removed - now each fetch is independent with pagination

  useEffect(() => {
    fetchGuiasDespacho(1, "") // Initial load
    fetchKardexData()
    fetchGuideMasterData()

    // OPTIMIZED: Auto-refresh tracking summary every 2 minutes (reduced from 30s to save quota)
    const interval = setInterval(() => {
      fetchGuideMasterData()
    }, 120000) // 2 minutes instead of 30 seconds

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount
  
  // Reload guides when search changes - reset to page 1
  useEffect(() => {
    isSearchResetRef.current = true
    if (currentPageGuides !== 1) {
      setCurrentPageGuides(1)
    } else {
      // If already on page 1, fetch directly
      fetchGuiasDespacho(1, searchGuides)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchGuides])
  
  // Load guides when page changes
  useEffect(() => {
    // Skip if this is from a search reset (will be handled by search effect)
    if (isSearchResetRef.current && currentPageGuides === 1) {
      isSearchResetRef.current = false
      return
    }
    fetchGuiasDespacho(currentPageGuides, searchGuides)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageGuides])
  
  // Clear selections when guides change (new page loads)
  useEffect(() => {
    if (guiasDespacho.length === 0) {
      setSelectedGuides(new Set())
      return
    }
    
    // Clean up selections: remove IDs that are no longer in the current page
    setSelectedGuides(prev => {
      const currentIds = new Set(guiasDespacho.map(g => g.id))
      const hasInvalidSelections = Array.from(prev).some(id => !currentIds.has(id))
      if (hasInvalidSelections) {
        return new Set(Array.from(prev).filter(id => currentIds.has(id)))
      }
      return prev
    })
  }, [guiasDespacho])

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
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
      
      const abortController = new AbortController()
      const timeoutId = setTimeout(() => abortController.abort(), 15000)
      
      try {
        const response = await fetch(`${baseUrl}/delivery-guides/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(guideData),
          signal: abortController.signal
        })
        
        clearTimeout(timeoutId)

        if (response.ok) {
          toast.success('Guía de despacho creada exitosamente')
          fetchGuiasDespacho(currentPageGuides, searchGuides)
          setShowGuideModal(false)
        } else {
          try {
            const errorData = await response.json()
            toast.error(errorData.detail || 'Error al crear guía de despacho')
          } catch {
            toast.error(`Error ${response.status}: ${response.statusText}`)
          }
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        throw fetchError
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error('Tiempo de espera agotado. Intenta nuevamente.')
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        toast.error('Error de conexión con el servidor')
      } else {
        console.error('Error creating guide:', error)
        toast.error('Error al crear guía de despacho')
      }
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
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
      
      const abortController = new AbortController()
      const timeoutId = setTimeout(() => abortController.abort(), 15000)
      
      try {
        const response = await fetch(`${baseUrl}/kardex/movement`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(kardexMovementData),
          signal: abortController.signal
        })
        
        clearTimeout(timeoutId)

        if (response.ok) {
          toast.success('Movimiento de kardex creado exitosamente')
          fetchKardexData()
          setShowKardexModal(false)
        } else {
          try {
            const errorData = await response.json()
            toast.error(errorData.detail || 'Error al crear movimiento de kardex')
          } catch {
            toast.error(`Error ${response.status}: ${response.statusText}`)
          }
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        throw fetchError
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error('Tiempo de espera agotado. Intenta nuevamente.')
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        toast.error('Error de conexión con el servidor')
      } else {
        console.error('Error creating kardex movement:', error)
        toast.error('Error al crear movimiento de kardex')
      }
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
        {/* TAB: GUÍAS MADRE (Ahora vacía - contenido movido a Escaneo de Guías) */}
        <TabsContent value="master" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guías Madre</CardTitle>
              <CardDescription>
                Esta sección ha sido movida a "Escaneo de Guías" para mejor organización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                El contenido de control de guías madre, lotes de importación y seguimiento ahora se encuentra en la pestaña "Escaneo de Guías".
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: GUÍAS DE DESPACHO */}
        <TabsContent value="guias" className="space-y-4">
          <DeliveryGuidesList 
            onImportSuccess={() => {
              // Refresh data after import
            }}
          />
        </TabsContent>


        {/* TAB: ESCANEO DE GUÍAS */}
        <TabsContent value="scanning" className="space-y-4">
          {/* Contenido vacío */}
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

      {/* Register Event Modal */}
      {selectedGuideId && (
        <RegisterEventModal
          isOpen={showRegisterEventModal}
          onClose={() => {
            setShowRegisterEventModal(false)
            setSelectedGuideId(null)
          }}
          guideId={selectedGuideId}
          onSuccess={() => {
            // Refresh data after event registration
            if (viewingGuideDetail) {
              // If viewing detail, the GuideDetail component will handle its own refresh
              // Force a refresh by updating the key or calling a refresh function
            }
            // GuideList component will handle its own refresh via useEffect
          }}
        />
      )}

      {/* Mark Inconsistency Modal */}
      {selectedGuideId && selectedEventId && (
        <MarkInconsistencyModal
          isOpen={showMarkInconsistencyModal}
          onClose={() => {
            setShowMarkInconsistencyModal(false)
            setSelectedGuideId(null)
            setSelectedEventId(null)
          }}
          guideId={selectedGuideId}
          eventId={selectedEventId}
          onSuccess={() => {
            // Refresh data after marking inconsistency
            if (viewingGuideDetail) {
              // GuideDetail component will handle its own refresh
            }
          }}
        />
      )}
        </>
      )}
    </div>
  )
}
