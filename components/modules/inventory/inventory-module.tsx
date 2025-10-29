"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, Filter, Download, Plus, Eye, Edit, Trash2, Package, AlertTriangle, Upload, History, RotateCcw, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  name: string
  description?: string
  category?: string
  brand?: string
  model?: string
  unit_of_measure: string
  purchase_price: number
  sale_price: number
  current_stock: number
  min_stock: number
  max_stock: number
  location?: string
  barcode?: string
  weight?: number
  dimensions?: string
  status: string
  created_by: string
  created_at: string
  updated_at: string
}

interface ImportHistory {
  id: string
  original_filename: string
  total_rows: number
  successful_rows: number
  failed_rows: number
  status: string
  created_at: string
  username: string
  full_name: string
}

interface AuditActivity {
  id: string
  action: string
  action_description: string
  username: string
  full_name: string
  product_name?: string
  product_code?: string
  created_at: string
}

export default function InventoryModule() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("products")

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
  const [statusFilter, setStatusFilter] = useState("")

  // Import state
  const [showImportWizard, setShowImportWizard] = useState(false)
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([])

  // Audit state
  const [auditActivity, setAuditActivity] = useState<AuditActivity[]>([])

  // Product form state
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    code: "",
    name: "",
    description: "",
    category: "",
    brand: "",
    model: "",
    unit_of_measure: "unit",
    purchase_price: 0,
    sale_price: 0,
    current_stock: 0,
    min_stock: 0,
    max_stock: 1000,
    location: "",
    barcode: "",
    weight: 0,
    dimensions: ""
  })

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.request<{items: Product[], total: number, page: number, size: number}>("/inventory/products", {
        method: "GET"
      })

      if (response.data) {
        // La API devuelve un objeto con items, extraer el array de productos
        setProducts(response.data.items || [])
      } else {
        toast.error(response.error || "Error loading products")
        setProducts([]) // Asegurar que products sea un array
      }
    } catch (error) {
      toast.error("Error connecting to server")
      console.error("Load products error:", error)
      setProducts([]) // Asegurar que products sea un array
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load import history
  const loadImportHistory = useCallback(async () => {
    try {
      const response = await apiClient.request<{items: ImportHistory[]}>("/inventory/import-history", {
        method: "GET"
      })

      if (response.data) {
        setImportHistory(response.data.items || [])
      }
    } catch (error) {
      console.error("Load import history error:", error)
    }
  }, [])

  // Load audit activity
  const loadAuditActivity = useCallback(async () => {
    try {
      const response = await apiClient.request<{items: AuditActivity[]}>("/inventory/audit-activity", {
        method: "GET"
      })

      if (response.data) {
        setAuditActivity(response.data.items || [])
      }
    } catch (error) {
      console.error("Load audit activity error:", error)
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    loadProducts()
    loadImportHistory()
    loadAuditActivity()
  }, [loadProducts, loadImportHistory, loadAuditActivity])


  // Handle rollback import
  const handleRollbackImport = async (importId: string) => {
    if (!confirm("¿Estás seguro de que deseas revertir esta importación? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      const response = await apiClient.request(`/inventory/rollback-import/${importId}`, {
        method: "POST"
      })

      if (response.data) {
        toast.success(response.message || "Importación revertida exitosamente")
        loadProducts()
        loadImportHistory()
        loadAuditActivity()
      } else {
        toast.error(response.error || "Error al revertir la importación")
      }
    } catch (error) {
      toast.error("Error al revertir la importación")
      console.error("Rollback error:", error)
    }
  }

  // Handle create/update product
  const handleSaveProduct = async () => {
    try {
      const isEditing = !!editingProduct

      const response = await apiClient.request(
        isEditing ? `/inventory/products/${editingProduct.id}` : "/inventory/products",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(productForm)
        }
      )

      if (response.data || response.message) {
        toast.success(isEditing ? "Producto actualizado exitosamente" : "Producto creado exitosamente")
        setShowProductDialog(false)
        setEditingProduct(null)
        resetProductForm()
        loadProducts()
        loadAuditActivity()
      } else {
        toast.error(response.error || "Error al guardar el producto")
      }
    } catch (error) {
      toast.error("Error al guardar el producto")
      console.error("Save product error:", error)
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
        loadProducts()
        loadAuditActivity()
        setDeleteTarget(null)
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

  // Reset product form
  const resetProductForm = () => {
    setProductForm({
      code: "",
      name: "",
      description: "",
      category: "",
      brand: "",
      model: "",
      unit_of_measure: "unit",
      purchase_price: 0,
      sale_price: 0,
      current_stock: 0,
      min_stock: 0,
      max_stock: 1000,
      location: "",
      barcode: "",
      weight: 0,
      dimensions: ""
    })
  }

  // Start editing product
  const startEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      code: product.code,
      name: product.name,
      description: product.description || "",
      category: product.category || "",
      brand: product.brand || "",
      model: product.model || "",
      unit_of_measure: product.unit_of_measure,
      purchase_price: product.purchase_price,
      sale_price: product.sale_price,
      current_stock: product.current_stock,
      min_stock: product.min_stock,
      max_stock: product.max_stock,
      location: product.location || "",
      barcode: product.barcode || "",
      weight: product.weight || 0,
      dimensions: product.dimensions || ""
    })
    setShowProductDialog(true)
  }

  // Filter products
  const filteredProducts = useMemo(() => {
    // Asegurar que products sea un array
    if (!Array.isArray(products)) {
      console.warn("Products is not an array:", products)
      return []
    }
    
    return products.filter(product => {
      const matchesSearch = searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.code && product.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = categoryFilter === "" || product.category === categoryFilter
      const matchesStatus = statusFilter === "" || product.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, searchQuery, categoryFilter, statusFilter])

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
    <div className="p-6 space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total Productos</p>
                <p className="text-2xl font-bold text-slate-900">{stockMetrics.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">Stock Total</p>
                <p className="text-2xl font-bold text-slate-900">{stockMetrics.totalStock.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-slate-900">{stockMetrics.lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">Sin Stock</p>
                <p className="text-2xl font-bold text-slate-900">{stockMetrics.outOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Filter className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">Categorías</p>
                <p className="text-2xl font-bold text-slate-900">{stockMetrics.categories}</p>
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
          <TabsTrigger value="history">Historial de Importaciones</TabsTrigger>
          <TabsTrigger value="audit">Registro de Auditoría</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Inventario de Productos</CardTitle>
                  <CardDescription>Gestiona tu catálogo de productos y niveles de stock</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      resetProductForm()
                      setEditingProduct(null)
                      setShowProductDialog(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Producto
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex space-x-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todas las Categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las Categorías</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Todos los Estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Estados</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="discontinued">Descontinuado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Products Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-6 py-4">Código</TableHead>
                        <TableHead className="px-6 py-4">Nombre</TableHead>
                        <TableHead className="px-6 py-4">Categoría</TableHead>
                        <TableHead className="px-6 py-4">Stock Actual</TableHead>
                        <TableHead className="px-6 py-4">Stock Mínimo</TableHead>
                        <TableHead className="px-6 py-4">Precio de Venta</TableHead>
                        <TableHead className="px-6 py-4">Estado</TableHead>
                        <TableHead className="px-6 py-4">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 px-6">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-gray-500">Cargando productos...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 px-6">
                          <div className="flex flex-col items-center space-y-2">
                            <Package className="w-8 h-8 text-gray-400" />
                            <p className="text-gray-500">No se encontraron productos</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id} className="hover:bg-gray-50">
                          <TableCell className="px-6 py-4 font-medium">{product.code}</TableCell>
                          <TableCell className="px-6 py-4">{product.name}</TableCell>
                          <TableCell className="px-6 py-4">{product.category || "-"}</TableCell>
                          <TableCell className="px-6 py-4">
                            <span className={`font-semibold ${
                              formatNumber(product.current_stock) === 0 ? "text-red-600" :
                              formatNumber(product.current_stock) <= formatNumber(product.min_stock) ? "text-yellow-600" :
                              "text-green-600"
                            }`}>
                              {formatNumber(product.current_stock)}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">{formatNumber(product.min_stock)}</TableCell>
                          <TableCell className="px-6 py-4 font-medium">${formatPrice(product.sale_price)}</TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge variant={product.status === "active" ? "default" : "secondary"}>
                              {product.status === "active" ? "Activo" : 
                               product.status === "inactive" ? "Inactivo" :
                               product.status === "discontinued" ? "Descontinuado" : product.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4">
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
                    <p><strong>Columnas requeridas:</strong> code, name</p>
                    <p><strong>Columnas opcionales:</strong> description, category, brand, model, unit_of_measure, purchase_price, sale_price, current_stock, min_stock, max_stock, location, barcode, weight, dimensions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Importaciones</CardTitle>
              <CardDescription>Ver importaciones de inventario anteriores y sus resultados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-6 py-4">Nombre de Archivo</TableHead>
                      <TableHead className="px-6 py-4">Importado Por</TableHead>
                      <TableHead className="px-6 py-4">Total de Filas</TableHead>
                      <TableHead className="px-6 py-4">Exitosas</TableHead>
                      <TableHead className="px-6 py-4">Fallidas</TableHead>
                      <TableHead className="px-6 py-4">Estado</TableHead>
                      <TableHead className="px-6 py-4">Fecha</TableHead>
                      <TableHead className="px-6 py-4">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {importHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 px-6">
                        <div className="flex flex-col items-center space-y-2">
                          <History className="w-8 h-8 text-gray-400" />
                          <p className="text-gray-500">No se encontró historial de importaciones</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    importHistory.map((import_) => (
                      <TableRow key={import_.id} className="hover:bg-gray-50">
                        <TableCell className="px-6 py-4 font-medium">{import_.original_filename}</TableCell>
                        <TableCell className="px-6 py-4">{import_.full_name || import_.username}</TableCell>
                        <TableCell className="px-6 py-4">{import_.total_rows}</TableCell>
                        <TableCell className="px-6 py-4 text-green-600 font-medium">{import_.successful_rows}</TableCell>
                        <TableCell className="px-6 py-4 text-red-600 font-medium">{import_.failed_rows}</TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant={
                            import_.status === "completed" ? "default" :
                            import_.status === "failed" ? "destructive" :
                            import_.status === "rolled_back" ? "secondary" :
                            "outline"
                          }>
                            {import_.status === "completed" ? "Completado" :
                             import_.status === "failed" ? "Fallido" :
                             import_.status === "rolled_back" ? "Revertido" : import_.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-gray-600">{new Date(import_.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="px-6 py-4">
                          {user?.role === "admin" && import_.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRollbackImport(import_.id)}
                              className="text-red-600 hover:text-red-700 h-8"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Revertir
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad de Auditoría</CardTitle>
              <CardDescription>Rastrea todos los cambios de inventario y quién los realizó</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Acción</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditActivity.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No se encontró actividad de auditoría
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditActivity.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>{activity.action_description}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span>{activity.full_name || activity.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {activity.product_name ? (
                            <div>
                              <div className="font-medium">{activity.product_name}</div>
                              <div className="text-sm text-slate-500">{activity.product_code}</div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{new Date(activity.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
                loadProducts()
                loadImportHistory()
                loadAuditActivity()
              }}
              onCancel={() => setShowImportWizard(false)}
            />
          </div>
        </div>
      )}

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Producto" : "Agregar Producto"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Actualizar información del producto" : "Agregar un nuevo producto al inventario"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Código de Producto *</Label>
              <Input
                id="code"
                value={productForm.code}
                onChange={(e) => setProductForm(prev => ({ ...prev, code: e.target.value }))}
                placeholder="SKU-001"
              />
            </div>
            <div>
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del producto"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del producto"
              />
            </div>
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                value={productForm.category}
                onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Electrónica"
              />
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
              <Select value={productForm.unit_of_measure} onValueChange={(value) => setProductForm(prev => ({ ...prev, unit_of_measure: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">Unidad</SelectItem>
                  <SelectItem value="kg">Kilogramo</SelectItem>
                  <SelectItem value="lb">Libra</SelectItem>
                  <SelectItem value="box">Caja</SelectItem>
                  <SelectItem value="pack">Paquete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="purchase_price">Precio de Compra</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                value={productForm.purchase_price}
                onChange={(e) => setProductForm(prev => ({ ...prev, purchase_price: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="sale_price">Precio de Venta</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                value={productForm.sale_price}
                onChange={(e) => setProductForm(prev => ({ ...prev, sale_price: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="current_stock">Stock Actual</Label>
              <Input
                id="current_stock"
                type="number"
                value={productForm.current_stock}
                onChange={(e) => setProductForm(prev => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="min_stock">Stock Mínimo</Label>
              <Input
                id="min_stock"
                type="number"
                value={productForm.min_stock}
                onChange={(e) => setProductForm(prev => ({ ...prev, min_stock: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="max_stock">Stock Máximo</Label>
              <Input
                id="max_stock"
                type="number"
                value={productForm.max_stock}
                onChange={(e) => setProductForm(prev => ({ ...prev, max_stock: parseInt(e.target.value) || 1000 }))}
              />
            </div>
            <div>
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={productForm.location}
                onChange={(e) => setProductForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Almacén A-1"
              />
            </div>
            <div>
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                value={productForm.barcode}
                onChange={(e) => setProductForm(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder="1234567890123"
              />
            </div>
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={productForm.weight}
                onChange={(e) => setProductForm(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="dimensions">Dimensiones</Label>
              <Input
                id="dimensions"
                value={productForm.dimensions}
                onChange={(e) => setProductForm(prev => ({ ...prev, dimensions: e.target.value }))}
                placeholder="10x5x3 cm"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct}>
              {editingProduct ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
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
    </div>
  )
}