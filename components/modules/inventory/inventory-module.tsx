"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, Filter, Download, Plus, Eye, Edit, Trash2, Package, AlertTriangle, Upload, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import InventoryImportWizard from "./inventory-import-wizard"

interface Product {
  id: string
  code: string
  sku?: string // Campo opcional para compatibilidad con backend
  name: string
  description?: string
  category?: string
  brand?: string
  proveedor?: string
  model?: string
  unit_of_measure: string
  cost_price?: number // Precio de costo (backend)
  purchase_price?: number // Alias para compatibilidad
  sale_price: number
  current_stock: number
  min_stock: number
  max_stock: number
  location?: string
  barcode?: string
  weight?: number
  dimensions?: string
  status?: string
  is_active?: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
}


export default function InventoryModule() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("products")
  
  // Selection state for bulk operations
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [isSelectAll, setIsSelectAll] = useState(false)

  // Helper function to safely format numbers
  const formatPrice = (price: any): string => {
    if (price === null || price === undefined || price === '') {
      return '0.00'
    }
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numPrice)) {
      return '0.00'
    }
    return numPrice.toFixed(2)
  }

  // Helper function to safely format numbers for display
  const formatNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') {
      return 0
    }
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(numValue) ? 0 : numValue
  }

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  
  // Pagination state - Server-side pagination for performance
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50) // 50 products per page
  const [totalProducts, setTotalProducts] = useState(0)
  const totalPages = Math.ceil(totalProducts / pageSize)

  // Import state
  const [showImportWizard, setShowImportWizard] = useState(false)

  // Product form state
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    code: "",
    sku: "",
    name: "",
    description: "",
    category: "",
    brand: "",
    proveedor: "",
    model: "",
    unit_of_measure: "unit",
    cost_price: 0,
    sale_price: 0,
    current_stock: 0,
    min_stock: 0,
    max_stock: 0
  })
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [showDeletingDialog, setShowDeletingDialog] = useState(false)
  const [deletingCount, setDeletingCount] = useState(0)

  // Load products with server-side pagination (optimized for performance)
  const loadProducts = useCallback(async (page: number) => {
    try {
      setIsLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString(),
        active_only: "true" // Only show active products (exclude deleted)
      })
      
      // Add search filter if present
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim())
      }
      
      // Add category filter if present
      if (categoryFilter && categoryFilter !== "all") {
        params.append("category", categoryFilter)
      }
      
      // Load products for current page
      const response = await apiClient.request<{items: Product[], total: number, page: number, size: number}>(
        `/inventory/products?${params.toString()}`,
        {
          method: "GET"
        }
      )

      console.log("[InventoryModule] API Response:", response)
      console.log("[InventoryModule] Response data:", response.data)
      
      if (response.data) {
        // Map products for compatibility
        const products = (response.data.items || []).map((product: any) => ({
          ...product,
          code: product.code || product.sku || "",
          sku: product.sku || product.code || ""
        }))
        console.log("[InventoryModule] Mapped products:", products)
        console.log("[InventoryModule] Total products:", response.data.total || 0)
        setProducts(products)
        setTotalProducts(response.data.total || 0)
      } else if (response.error) {
        // Handle error response - error can be string or array
        const errorMessage = Array.isArray(response.error) 
          ? response.error.map((err: any) => typeof err === 'string' ? err : err.msg || JSON.stringify(err)).join(', ')
          : response.error || "Error loading products";
        
        console.error("[InventoryModule] Error response:", response.error)
        toast.error(errorMessage)
        setProducts([])
        setTotalProducts(0)
      } else {
        // No data and no error - unexpected response
        console.warn("[InventoryModule] Unexpected response format:", response)
        toast.error("Error loading products: Unexpected response format")
        setProducts([])
        setTotalProducts(0)
      }
    } catch (error) {
      toast.error("Error connecting to server")
      console.error("Load products error:", error)
      setProducts([])
      setTotalProducts(0)
    } finally {
      setIsLoading(false)
    }
  }, [pageSize, searchQuery, categoryFilter])

  // Load data on mount
  useEffect(() => {
    loadProducts(1) // Initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount
  
  // Reload products when search or filters change (reset to page 1)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    } else {
      // If already on page 1, reload
      loadProducts(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, categoryFilter])
  
  // Load products when page changes
  useEffect(() => {
    loadProducts(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])



  // Handle create/update product
  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!productForm.name.trim()) {
      errors.name = "El nombre es requerido"
    }
    
    if (!productForm.code?.trim() && !productForm.sku?.trim()) {
      errors.code = "El código o SKU es requerido"
    }
    
    if (productForm.cost_price < 0) {
      errors.cost_price = "El precio de costo no puede ser negativo"
    }
    
    if (productForm.sale_price < 0) {
      errors.sale_price = "El precio de venta no puede ser negativo"
    }
    
    if (productForm.current_stock < 0) {
      errors.current_stock = "El stock no puede ser negativo"
    }
    
    if (productForm.min_stock < 0) {
      errors.min_stock = "El stock mínimo no puede ser negativo"
    }
    
    if (productForm.max_stock > 0 && productForm.max_stock < productForm.min_stock) {
      errors.max_stock = "El stock máximo debe ser mayor o igual al mínimo"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveProduct = async () => {
    // Validate form
    if (!validateForm()) {
      toast.error("Por favor corrige los errores en el formulario")
      return
    }
    
    try {
      setIsSaving(true)
      const isEditing = !!editingProduct

      // Prepare data - send DB field names directly
      const productData: any = {
        name: productForm.name.trim(),
        description: productForm.description?.trim() || null,
        category: productForm.category?.trim() || null,
        brand: productForm.brand?.trim() || null,
        proveedor: productForm.proveedor?.trim() || null,
        model: productForm.model?.trim() || null,
        unit_of_measure: productForm.unit_of_measure,
        // Use DB column names directly
        sale_price: productForm.sale_price || 0,
        cost_price: productForm.cost_price || 0,
        current_stock: productForm.current_stock || 0,
        min_stock: productForm.min_stock || 0,
        max_stock: productForm.max_stock || 0,
      }
      
      // Use code or sku (prefer code, fallback to sku)
      if (productForm.code?.trim()) {
        productData.code = productForm.code.trim()
        productData.sku = productForm.code.trim() // Ensure both are set
      } else if (productForm.sku?.trim()) {
        productData.sku = productForm.sku.trim()
        productData.code = productForm.sku.trim()
      }
      
      // For new products, set initial_stock
      if (!isEditing) {
        productData.initial_stock = productForm.current_stock || 0
      }

      const response = await apiClient.request(
        isEditing ? `/inventory/products/${editingProduct.id}` : "/inventory/products",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(productData)
        }
      )

      if (response.data || response.message) {
        toast.success(isEditing ? "Producto actualizado exitosamente" : "Producto creado exitosamente")
        setShowProductDialog(false)
        setEditingProduct(null)
        resetProductForm()
        setFormErrors({})
        // Reload current page instead of page 1
        loadProducts(currentPage)
      } else {
        toast.error(response.error || "Error al guardar el producto")
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Error al guardar el producto"
      toast.error(errorMessage)
      console.error("Save product error:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Confirm delete action from custom dialog
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      const response = await apiClient.request(`/inventory/products/${deleteTarget.id}`, {
        method: "DELETE"
      })

      if (response.data || response.message) {
        toast.success("Producto eliminado exitosamente")
        setDeleteTarget(null)
        
        // Notify dashboard to refresh
        window.dispatchEvent(new CustomEvent('productsDeleted', { detail: { count: 1 } }))
        
        // Reload products (force refresh)
        if (currentPage === 1) {
          await loadProducts(1)
        } else {
          setCurrentPage(1)
          await loadProducts(1)
        }
      } else {
        toast.error(response.error || "Error al eliminar el producto")
      }
    } catch (error) {
      toast.error("Error al eliminar el producto")
      console.error("Delete product error:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle individual product selection
  const handleToggleSelect = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
    setIsSelectAll(newSelected.size === filteredProducts.length && filteredProducts.length > 0)
  }

  // Handle select all
  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedProducts(new Set())
    } else {
      const allIds = new Set(filteredProducts.map(p => p.id))
      setSelectedProducts(allIds)
    }
    setIsSelectAll(!isSelectAll)
  }

  // Handle bulk delete confirmation dialog
  const handleBulkDeleteClick = () => {
    if (selectedProducts.size === 0) {
      toast.info("Selecciona al menos un producto para eliminar")
      return
    }
    setShowBulkDeleteDialog(true)
  }

  // Handle bulk delete with progress feedback
  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      toast.info("Selecciona al menos un producto para eliminar")
      return
    }

    setShowBulkDeleteDialog(false)
    const productIdsArray = Array.from(selectedProducts)
    const count = productIdsArray.length
    
    // Show deleting dialog
    setDeletingCount(count)
    setShowDeletingDialog(true)

    try {
      setIsDeleting(true)
      
      const startTime = Date.now()
      const response = await apiClient.request("/inventory/products/bulk-delete", {
        method: "POST",
        body: JSON.stringify(productIdsArray),
        headers: {
          "Content-Type": "application/json"
        }
      })

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

      // Close deleting dialog
      setShowDeletingDialog(false)

      if (response.data || response.message) {
        toast.success(`${count} producto(s) eliminado(s) exitosamente`, {
          description: `Operación completada en ${elapsed}s`
        })
        setSelectedProducts(new Set())
        setIsSelectAll(false)
        
        // Notify dashboard to refresh
        window.dispatchEvent(new CustomEvent('productsDeleted', { detail: { count } }))
        
        // Invalidate cache and reload products
        // Force reload by resetting to page 1 if needed
        if (currentPage === 1) {
          // If on page 1, reload same page
          await loadProducts(1)
        } else {
          // If on other page, go to page 1 to see updated list
          setCurrentPage(1)
          await loadProducts(1)
        }
      } else {
        toast.error(response.error || "Error al eliminar los productos")
      }
    } catch (error) {
      // Close deleting dialog on error
      setShowDeletingDialog(false)
      toast.error("Error al eliminar los productos", {
        description: error instanceof Error ? error.message : "Error desconocido"
      })
      console.error("Bulk delete error:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Reset product form
  const resetProductForm = () => {
    setProductForm({
      code: "",
      sku: "",
      name: "",
      description: "",
      category: "",
      brand: "",
      proveedor: "",
      model: "",
      unit_of_measure: "unit",
      cost_price: 0,
      sale_price: 0,
      current_stock: 0,
      min_stock: 0,
      max_stock: 0
    })
    setFormErrors({})
  }

  // Start editing product
  const startEditProduct = (product: Product) => {
    setEditingProduct(product)
    // Map product data to form, handling both cost_price and purchase_price
    const productAny = product as any
    setProductForm({
      code: product.code || product.sku || "",
      sku: product.sku || product.code || "",
      name: product.name,
      description: product.description || "",
      category: product.category || "",
      brand: product.brand || "",
      proveedor: product.proveedor || "",
      model: product.model || "",
      unit_of_measure: product.unit_of_measure || "unit",
      cost_price: productAny.cost_price || productAny.purchase_price || 0,
      sale_price: product.sale_price || 0,
      current_stock: product.current_stock || 0,
      min_stock: product.min_stock || 0,
      max_stock: product.max_stock || 0
    })
    setFormErrors({})
    setShowProductDialog(true)
  }

  // Filter products
  // Server-side filtering is handled in loadProducts
  // Products are already filtered by search and category on the server
  const filteredProducts = useMemo(() => {
    // Asegurar que products sea un array
    if (!Array.isArray(products)) {
      console.warn("Products is not an array:", products)
      return []
    }
    
    // Return products as-is since filtering is done server-side
    return products
  }, [products])

  // Sync select all state when filtered products change
  useEffect(() => {
    if (filteredProducts.length === 0) {
      setIsSelectAll(false)
      setSelectedProducts(new Set())
      return
    }
    
    // Clean up selection: remove products that are no longer in filtered list
    const filteredIds = new Set(filteredProducts.map(p => p.id))
    setSelectedProducts(prev => {
      const cleaned = new Set(
        Array.from(prev).filter(id => filteredIds.has(id))
      )
      const allSelected = filteredProducts.length > 0 && filteredProducts.every(p => cleaned.has(p.id))
      setIsSelectAll(allSelected)
      return cleaned
    })
  }, [filteredProducts])

  // Get stock metrics
  const stockMetrics = useMemo(() => {
    // Asegurar que products sea un array
    if (!Array.isArray(products)) {
      return {
        totalProducts: 0,
        totalStock: 0,
        lowStock: 0,
        outOfStock: 0,
        categories: 0
      }
    }
    
    const totalProducts = products.length
    const totalStock = products.reduce((sum, product) => sum + formatNumber(product.current_stock), 0)
    const lowStock = products.filter(product => formatNumber(product.current_stock) <= formatNumber(product.min_stock)).length
    const outOfStock = products.filter(product => formatNumber(product.current_stock) === 0).length
    const categories = [...new Set(products.map(product => product.category).filter(Boolean))].length

    return {
      totalProducts,
      totalStock,
      lowStock,
      outOfStock,
      categories
    }
  }, [products])

  // Get categories for filter
  const categories = useMemo(() => {
    if (!Array.isArray(products)) {
      return []
    }
    return [...new Set(products.map(product => product.category).filter(Boolean))]
  }, [products])

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center space-x-2">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Total Productos</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">{stockMetrics.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center space-x-2">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Stock Total</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">{stockMetrics.totalStock.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Stock Bajo</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">{stockMetrics.lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Sin Stock</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">{stockMetrics.outOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center space-x-2">
              <Filter className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Categorías</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">{stockMetrics.categories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="import">Importar Datos</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-lg sm:text-xl">Inventario de Productos</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Gestiona tu catálogo de productos y niveles de stock</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                  {selectedProducts.size > 0 && (
                    <Button
                      onClick={handleBulkDeleteClick}
                      disabled={isDeleting}
                      variant="destructive"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Eliminar {selectedProducts.size} Seleccionado{selectedProducts.size !== 1 ? 's' : ''}</span>
                      <span className="sm:hidden">Eliminar {selectedProducts.size}</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      resetProductForm()
                      setEditingProduct(null)
                      setShowProductDialog(true)
                    }}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Agregar Producto</span>
                    <span className="sm:hidden">Agregar</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 mb-4 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <Input
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Todas las Categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las Categorías</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Products Table - Desktop */}
              <div className="hidden lg:block border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-4 lg:px-6 py-3 lg:py-4 w-12">
                          <Checkbox
                            checked={isSelectAll}
                            onCheckedChange={handleSelectAll}
                            aria-label="Seleccionar todos"
                          />
                        </TableHead>
                        <TableHead className="px-4 lg:px-6 py-3 lg:py-4">Código</TableHead>
                        <TableHead className="px-4 lg:px-6 py-3 lg:py-4">Nombre</TableHead>
                        <TableHead className="px-4 lg:px-6 py-3 lg:py-4">Categoría</TableHead>
                        <TableHead className="px-4 lg:px-6 py-3 lg:py-4">Proveedor</TableHead>
                        <TableHead className="px-4 lg:px-6 py-3 lg:py-4">Stock Actual</TableHead>
                        <TableHead className="px-4 lg:px-6 py-3 lg:py-4">Stock Mínimo</TableHead>
                        <TableHead className="px-4 lg:px-6 py-3 lg:py-4">Precio de Venta</TableHead>
                        <TableHead className="px-4 lg:px-6 py-3 lg:py-4">Estado</TableHead>
                        <TableHead className="px-4 lg:px-6 py-3 lg:py-4">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12 px-4 lg:px-6">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-gray-500">Cargando productos...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12 px-4 lg:px-6">
                          <div className="flex flex-col items-center space-y-2">
                            <Package className="w-8 h-8 text-gray-400" />
                            <p className="text-gray-500">No se encontraron productos</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id} className="hover:bg-gray-50">
                          <TableCell className="px-4 lg:px-6 py-3 lg:py-4 w-12">
                            <Checkbox
                              checked={selectedProducts.has(product.id)}
                              onCheckedChange={() => handleToggleSelect(product.id)}
                              aria-label={`Seleccionar ${product.name}`}
                            />
                          </TableCell>
                          <TableCell className="px-4 lg:px-6 py-3 lg:py-4 font-medium font-mono text-xs lg:text-sm">
                            {product.code || product.sku || "-"}
                          </TableCell>
                          <TableCell className="px-4 lg:px-6 py-3 lg:py-4">{product.name}</TableCell>
                          <TableCell className="px-4 lg:px-6 py-3 lg:py-4">{product.category || "-"}</TableCell>
                          <TableCell className="px-4 lg:px-6 py-3 lg:py-4">{product.proveedor || "-"}</TableCell>
                          <TableCell className="px-4 lg:px-6 py-3 lg:py-4">
                            <span className={`font-semibold ${
                              formatNumber(product.current_stock) === 0 ? "text-red-600" :
                              formatNumber(product.current_stock) <= formatNumber(product.min_stock) ? "text-yellow-600" :
                              "text-green-600"
                            }`}>
                              {formatNumber(product.current_stock)}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 lg:px-6 py-3 lg:py-4">{formatNumber(product.min_stock)}</TableCell>
                          <TableCell className="px-4 lg:px-6 py-3 lg:py-4 font-medium">${formatPrice(product.sale_price)}</TableCell>
                          <TableCell className="px-4 lg:px-6 py-3 lg:py-4">
                            <Badge variant={product.status === "active" ? "default" : "secondary"} className="text-xs">
                              {product.status === "active" ? "Activo" : 
                               product.status === "inactive" ? "Inactivo" :
                               product.status === "discontinued" ? "Descontinuado" : product.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 lg:px-6 py-3 lg:py-4">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditProduct(product)}
                                className="h-8"
                                title="Editar producto"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteTarget(product)}
                                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>

              {/* Products Cards - Mobile/Tablet */}
              <div className="lg:hidden space-y-3">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-gray-500">Cargando productos...</p>
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center space-y-2">
                      <Package className="w-8 h-8 text-gray-400" />
                      <p className="text-gray-500">No se encontraron productos</p>
                    </div>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <Card key={product.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Checkbox
                              checked={selectedProducts.has(product.id)}
                              onCheckedChange={() => handleToggleSelect(product.id)}
                              aria-label={`Seleccionar ${product.name}`}
                              className="mt-1 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base mb-1 truncate">{product.name}</h3>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                <span className="font-mono">{product.code || product.sku || "-"}</span>
                                {product.category && (
                                  <>
                                    <span>•</span>
                                    <span>{product.category}</span>
                                  </>
                                )}
                                {product.proveedor && (
                                  <>
                                    <span>•</span>
                                    <span>{product.proveedor}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditProduct(product)}
                              className="h-8 w-8 p-0"
                              title="Editar producto"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteTarget(product)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Stock Actual</p>
                            <p className={`font-semibold text-sm ${
                              formatNumber(product.current_stock) === 0 ? "text-red-600" :
                              formatNumber(product.current_stock) <= formatNumber(product.min_stock) ? "text-yellow-600" :
                              "text-green-600"
                            }`}>
                              {formatNumber(product.current_stock)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Stock Mínimo</p>
                            <p className="font-semibold text-sm">{formatNumber(product.min_stock)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Precio Venta</p>
                            <p className="font-semibold text-sm">${formatPrice(product.sale_price)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Estado</p>
                            <Badge variant={product.status === "active" ? "default" : "secondary"} className="text-xs">
                              {product.status === "active" ? "Activo" : 
                               product.status === "inactive" ? "Inactivo" :
                               product.status === "discontinued" ? "Descontinuado" : product.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t">
                  <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                    Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalProducts)} de {totalProducts} productos
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || isLoading}
                      className="h-8 px-2 sm:px-3"
                    >
                      <ChevronLeft className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Anterior</span>
                    </Button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={isLoading}
                            className={`h-8 w-8 p-0 text-xs sm:text-sm ${currentPage === pageNum ? "bg-blue-600 text-white" : ""}`}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || isLoading}
                      className="h-8 px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline">Siguiente</span>
                      <ChevronRight className="w-4 h-4 sm:ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar Datos de Inventario</CardTitle>
              <CardDescription>
                Sube archivos Excel o CSV para importar/actualizar datos de productos en masa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Subir Archivo de Inventario</p>
                    <p className="text-sm text-slate-600">
                      Soporta archivos Excel (.xlsx, .xls) y CSV
                    </p>
                    <Button onClick={() => setShowImportWizard(true)}>
                      Seleccionar Archivo
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Formato de Archivo Esperado:</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Columnas requeridas:</strong> sku/code, name/nombre, cost_price/precio_costo, current_stock/stock</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 El sistema mapea automáticamente variaciones comunes (code→sku, cantidad→current_stock, etc.)
                    </p>
                    <p className="mt-2"><strong>Columnas opcionales:</strong> description, category, brand, model, unit_of_measure, sale_price, min_stock, max_stock, location, barcode, weight, dimensions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Inventory Import Wizard */}
      {showImportWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <InventoryImportWizard
              isOpen={showImportWizard}
              onClose={() => setShowImportWizard(false)}
              onImportComplete={() => {
                setShowImportWizard(false)
                loadProducts(1) // Reset to page 1 after import
              }}
              onCancel={() => setShowImportWizard(false)}
            />
          </div>
        </div>
      )}

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={(open) => {
        setShowProductDialog(open)
        if (!open) {
          resetProductForm()
          setEditingProduct(null)
        }
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{editingProduct ? "Editar Producto" : "Agregar Producto"}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {editingProduct ? "Actualizar información del producto" : "Agregar un nuevo producto al inventario"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Información Básica */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b pb-2">Información Básica</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="code">Código/SKU *</Label>
                  <Input
                    id="code"
                    value={productForm.code || productForm.sku}
                    onChange={(e) => {
                      const value = e.target.value
                      setProductForm(prev => ({ ...prev, code: value, sku: value }))
                    }}
                    placeholder="SKU-001"
                    disabled={!!editingProduct} // Bloquear SKU al editar
                    className={formErrors.code ? "border-red-500" : ""}
                  />
                  {editingProduct && (
                    <p className="text-xs text-gray-500 mt-1">El SKU no se puede modificar</p>
                  )}
                  {formErrors.code && <p className="text-sm text-red-500 mt-1">{formErrors.code}</p>}
                </div>
                <div>
                  <Label htmlFor="name">Nombre del Producto *</Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre del producto"
                    className={formErrors.name ? "border-red-500" : ""}
                  />
                  {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción del producto"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select 
                    value={productForm.category || undefined} 
                    onValueChange={(value) => {
                      // Handle special "_none_" value to clear category
                      setProductForm(prev => ({ ...prev, category: value === "_none_" ? "" : value }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none_">Sin categoría</SelectItem>
                      {categories.filter(cat => cat).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      {productForm.category && !categories.includes(productForm.category) && (
                        <SelectItem value={productForm.category}>{productForm.category}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    value={productForm.brand}
                    onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="Nombre de la marca"
                  />
                </div>
                <div>
                  <Label htmlFor="proveedor">Proveedor</Label>
                  <Input
                    id="proveedor"
                    value={productForm.proveedor}
                    onChange={(e) => setProductForm(prev => ({ ...prev, proveedor: e.target.value }))}
                    placeholder="Nombre del proveedor"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={productForm.model}
                    onChange={(e) => setProductForm(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="Número de modelo"
                  />
                </div>
                <div>
                  <Label htmlFor="unit_of_measure">Unidad de Medida</Label>
                  <Select 
                    value={productForm.unit_of_measure} 
                    onValueChange={(value) => setProductForm(prev => ({ ...prev, unit_of_measure: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit">Unidad</SelectItem>
                      <SelectItem value="kg">Kilogramo</SelectItem>
                      <SelectItem value="gram">Gramo</SelectItem>
                      <SelectItem value="lb">Libra</SelectItem>
                      <SelectItem value="liter">Litro</SelectItem>
                      <SelectItem value="ml">Mililitro</SelectItem>
                      <SelectItem value="meter">Metro</SelectItem>
                      <SelectItem value="cm">Centímetro</SelectItem>
                      <SelectItem value="box">Caja</SelectItem>
                      <SelectItem value="pack">Paquete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Precios y Stock */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b pb-2">Precios y Stock</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="cost_price">Precio de Costo *</Label>
                  <Input
                    id="cost_price"
                    type="text"
                    value={productForm.cost_price || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '')
                      const numValue = value === "" ? 0 : parseFloat(value) || 0
                      setProductForm(prev => ({ ...prev, cost_price: numValue }))
                    }}
                    placeholder="0.00"
                    className={formErrors.cost_price ? "border-red-500" : ""}
                  />
                  {formErrors.cost_price && <p className="text-sm text-red-500 mt-1">{formErrors.cost_price}</p>}
                </div>
                <div>
                  <Label htmlFor="sale_price">Precio de Venta *</Label>
                  <Input
                    id="sale_price"
                    type="text"
                    value={productForm.sale_price || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '')
                      const numValue = value === "" ? 0 : parseFloat(value) || 0
                      setProductForm(prev => ({ ...prev, sale_price: numValue }))
                    }}
                    placeholder="0.00"
                    className={formErrors.sale_price ? "border-red-500" : ""}
                  />
                  {formErrors.sale_price && <p className="text-sm text-red-500 mt-1">{formErrors.sale_price}</p>}
                </div>
                <div>
                  <Label htmlFor="current_stock">Stock Actual *</Label>
                  <Input
                    id="current_stock"
                    type="text"
                    value={productForm.current_stock || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      const numValue = value === "" ? 0 : parseInt(value) || 0
                      setProductForm(prev => ({ ...prev, current_stock: numValue }))
                    }}
                    placeholder="0"
                    className={formErrors.current_stock ? "border-red-500" : ""}
                  />
                  {formErrors.current_stock && <p className="text-sm text-red-500 mt-1">{formErrors.current_stock}</p>}
                </div>
                <div>
                  <Label htmlFor="min_stock">Stock Mínimo</Label>
                  <Input
                    id="min_stock"
                    type="text"
                    value={productForm.min_stock || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      const numValue = value === "" ? 0 : parseInt(value) || 0
                      setProductForm(prev => ({ ...prev, min_stock: numValue }))
                    }}
                    placeholder="0"
                    className={formErrors.min_stock ? "border-red-500" : ""}
                  />
                  {formErrors.min_stock && <p className="text-sm text-red-500 mt-1">{formErrors.min_stock}</p>}
                </div>
                <div>
                  <Label htmlFor="max_stock">Stock Máximo</Label>
                  <Input
                    id="max_stock"
                    type="text"
                    value={productForm.max_stock || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      const numValue = value === "" ? 0 : parseInt(value) || 0
                      setProductForm(prev => ({ ...prev, max_stock: numValue }))
                    }}
                    placeholder="Opcional"
                    className={formErrors.max_stock ? "border-red-500" : ""}
                  />
                  {formErrors.max_stock && <p className="text-sm text-red-500 mt-1">{formErrors.max_stock}</p>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowProductDialog(false)
                resetProductForm()
                setEditingProduct(null)
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveProduct}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? "Guardando..." : editingProduct ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog for single product */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Esta acción eliminará el producto${deleteTarget ? ` "${deleteTarget.name}"` : ""} y no se puede deshacer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancelar</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete} 
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              ¿Eliminar productos seleccionados?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="pt-2 space-y-2">
                <div className="font-medium text-base">
                  ¿Estás seguro de que deseas eliminar {selectedProducts.size} producto{selectedProducts.size !== 1 ? 's' : ''}?
                </div>
                <div className="text-sm text-muted-foreground">
                  Esta acción no se puede deshacer. Los productos seleccionados serán eliminados permanentemente del sistema.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
                Cancelar
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete} 
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar {selectedProducts.size} producto{selectedProducts.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deleting progress dialog */}
      <Dialog open={showDeletingDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md [&_button:last-child]:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 animate-spin text-blue-600" />
              Eliminando productos
            </DialogTitle>
            <DialogDescription asChild>
              <div className="pt-4 text-center space-y-2">
                <p className="text-base font-medium">
                  Se están eliminando {deletingCount} producto{deletingCount !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  Por favor espere, esto puede tomar unos momentos...
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}