"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, Filter, Download, Plus, Eye, Edit, Trash2, Package, AlertTriangle, Upload, History, RotateCcw, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Import state
  const [isImporting, setIsImporting] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
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

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.request<Product[]>("/inventory/products", {
        method: "GET"
      })

      if (response.data) {
        setProducts(Array.isArray(response.data) ? response.data : [])
      } else {
        setProducts([])
        if (response.error) {
          toast.error(response.error || "Error loading products")
        }
      }
    } catch (error) {
      toast.error("Error connecting to server")
      console.error("Load products error:", error)
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
        const items = response.data.items || response.data || []
        setImportHistory(Array.isArray(items) ? items : [])
      } else {
        setImportHistory([])
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
        const items = response.data.items || response.data || []
        setAuditActivity(Array.isArray(items) ? items : [])
      } else {
        setAuditActivity([])
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

  // Handle file import
  const handleFileImport = async () => {
    if (!importFile) {
      toast.error("Please select a file")
      return
    }

    try {
      setIsImporting(true)

      const formData = new FormData()
      formData.append("file", importFile)

      const response = await fetch("/api/v1/inventory/import", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('gde_token')}`
        },
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || "File imported successfully")
        setShowImportDialog(false)
        setImportFile(null)
        loadProducts()
        loadImportHistory()
        loadAuditActivity()
      } else {
        toast.error(result.detail || "Import failed")
      }
    } catch (error) {
      toast.error("Error importing file")
      console.error("Import error:", error)
    } finally {
      setIsImporting(false)
    }
  }

  // Handle rollback import
  const handleRollbackImport = async (importId: string) => {
    if (!confirm("Are you sure you want to rollback this import? This action cannot be undone.")) {
      return
    }

    try {
      const response = await apiClient.request(`/inventory/rollback-import/${importId}`, {
        method: "POST"
      })

      if (response.data) {
        toast.success(response.message || "Import rolled back successfully")
        loadProducts()
        loadImportHistory()
        loadAuditActivity()
      } else {
        toast.error(response.error || "Rollback failed")
      }
    } catch (error) {
      toast.error("Error rolling back import")
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
        toast.success(isEditing ? "Product updated successfully" : "Product created successfully")
        setShowProductDialog(false)
        setEditingProduct(null)
        resetProductForm()
        loadProducts()
        loadAuditActivity()
      } else {
        toast.error(response.error || "Error saving product")
      }
    } catch (error) {
      toast.error("Error saving product")
      console.error("Save product error:", error)
    }
  }

  // Handle delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return
    }

    try {
      const response = await apiClient.request(`/inventory/products/${productId}`, {
        method: "DELETE"
      })

      if (response.data || response.message) {
        toast.success("Product deleted successfully")
        loadProducts()
        loadAuditActivity()
      } else {
        toast.error(response.error || "Error deleting product")
      }
    } catch (error) {
      toast.error("Error deleting product")
      console.error("Delete product error:", error)
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
    if (!products || !Array.isArray(products)) {
      return []
    }

    return products.filter(product => {
      if (!product) return false

      const matchesSearch = searchQuery === "" ||
        (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.code && product.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = categoryFilter === "" || product.category === categoryFilter
      const matchesStatus = statusFilter === "" || product.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, searchQuery, categoryFilter, statusFilter])

  // Get stock metrics
  const stockMetrics = useMemo(() => {
    const safeProducts = products || []
    const totalProducts = safeProducts.length
    const totalStock = safeProducts.reduce((sum, product) => sum + product.current_stock, 0)
    const lowStock = safeProducts.filter(product => product.current_stock <= product.min_stock).length
    const outOfStock = safeProducts.filter(product => product.current_stock === 0).length
    const categories = [...new Set(safeProducts.map(product => product.category).filter(Boolean))].length

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
    return [...new Set(products.map(product => product.category).filter(Boolean))]
  }, [products])

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-slate-600">Total Products</p>
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
                <p className="text-sm font-medium text-slate-600">Total Stock</p>
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
                <p className="text-sm font-medium text-slate-600">Low Stock</p>
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
                <p className="text-sm font-medium text-slate-600">Out of Stock</p>
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
                <p className="text-sm font-medium text-slate-600">Categories</p>
                <p className="text-2xl font-bold text-slate-900">{stockMetrics.categories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Product Inventory</CardTitle>
                  <CardDescription>Manage your product catalog and stock levels</CardDescription>
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
                    Add Product
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex space-x-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Products Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min Stock</TableHead>
                      <TableHead>Sale Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading products...
                        </TableCell>
                      </TableRow>
                    ) : (filteredProducts || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      (filteredProducts || []).map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.code}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.category || "-"}</TableCell>
                          <TableCell>
                            <span className={`font-semibold ${
                              product.current_stock === 0 ? "text-red-600" :
                              product.current_stock <= product.min_stock ? "text-yellow-600" :
                              "text-green-600"
                            }`}>
                              {product.current_stock}
                            </span>
                          </TableCell>
                          <TableCell>{product.min_stock}</TableCell>
                          <TableCell>${product.sale_price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={product.status === "active" ? "default" : "secondary"}>
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditProduct(product)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {user?.role === "admin" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
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

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Inventory Data</CardTitle>
              <CardDescription>
                Upload Excel or CSV files to bulk import/update product data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Upload Inventory File</p>
                    <p className="text-sm text-slate-600">
                      Supports Excel (.xlsx, .xls) and CSV files
                    </p>
                    <Button onClick={() => setShowImportDialog(true)}>
                      Select File
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Expected File Format:</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Required columns:</strong> code, name</p>
                    <p><strong>Optional columns:</strong> description, category, brand, model, unit_of_measure, purchase_price, sale_price, current_stock, min_stock, max_stock, location, barcode, weight, dimensions</p>
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
              <CardTitle>Import History</CardTitle>
              <CardDescription>View past inventory imports and their results</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Imported By</TableHead>
                    <TableHead>Total Rows</TableHead>
                    <TableHead>Successful</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(importHistory || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No import history found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (importHistory || []).map((import_) => (
                      <TableRow key={import_.id}>
                        <TableCell className="font-medium">{import_.original_filename}</TableCell>
                        <TableCell>{import_.full_name || import_.username}</TableCell>
                        <TableCell>{import_.total_rows}</TableCell>
                        <TableCell className="text-green-600">{import_.successful_rows}</TableCell>
                        <TableCell className="text-red-600">{import_.failed_rows}</TableCell>
                        <TableCell>
                          <Badge variant={
                            import_.status === "completed" ? "default" :
                            import_.status === "failed" ? "destructive" :
                            import_.status === "rolled_back" ? "secondary" :
                            "outline"
                          }>
                            {import_.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(import_.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {user?.role === "admin" && import_.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRollbackImport(import_.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Rollback
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Activity</CardTitle>
              <CardDescription>Track all inventory changes and who made them</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(auditActivity || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No audit activity found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (auditActivity || []).map((activity) => (
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

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Inventory File</DialogTitle>
            <DialogDescription>
              Select an Excel or CSV file to import product data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleFileImport}
                disabled={!importFile || isImporting}
              >
                {isImporting ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update product information" : "Add a new product to inventory"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Product Code *</Label>
              <Input
                id="code"
                value={productForm.code}
                onChange={(e) => setProductForm(prev => ({ ...prev, code: e.target.value }))}
                placeholder="SKU-001"
              />
            </div>
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={productForm.name}
                onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Product name"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Product description"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={productForm.category}
                onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Electronics"
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={productForm.brand}
                onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="Brand name"
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={productForm.model}
                onChange={(e) => setProductForm(prev => ({ ...prev, model: e.target.value }))}
                placeholder="Model number"
              />
            </div>
            <div>
              <Label htmlFor="unit_of_measure">Unit of Measure</Label>
              <Select value={productForm.unit_of_measure} onValueChange={(value) => setProductForm(prev => ({ ...prev, unit_of_measure: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">Unit</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                  <SelectItem value="lb">Pound</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="purchase_price">Purchase Price</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                value={productForm.purchase_price}
                onChange={(e) => setProductForm(prev => ({ ...prev, purchase_price: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="sale_price">Sale Price</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                value={productForm.sale_price}
                onChange={(e) => setProductForm(prev => ({ ...prev, sale_price: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="current_stock">Current Stock</Label>
              <Input
                id="current_stock"
                type="number"
                value={productForm.current_stock}
                onChange={(e) => setProductForm(prev => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="min_stock">Min Stock</Label>
              <Input
                id="min_stock"
                type="number"
                value={productForm.min_stock}
                onChange={(e) => setProductForm(prev => ({ ...prev, min_stock: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="max_stock">Max Stock</Label>
              <Input
                id="max_stock"
                type="number"
                value={productForm.max_stock}
                onChange={(e) => setProductForm(prev => ({ ...prev, max_stock: parseInt(e.target.value) || 1000 }))}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={productForm.location}
                onChange={(e) => setProductForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Warehouse A-1"
              />
            </div>
            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={productForm.barcode}
                onChange={(e) => setProductForm(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder="1234567890123"
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={productForm.weight}
                onChange={(e) => setProductForm(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="dimensions">Dimensions</Label>
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
              Cancel
            </Button>
            <Button onClick={handleSaveProduct}>
              {editingProduct ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}