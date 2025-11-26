"use client"

import { Search, Upload, ChevronLeft, ChevronRight, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import UniversalImportWizard from "@/components/shared/universal-import-wizard"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface DeliveryGuideProduct {
  id?: string
  producto_id?: string
  sku?: string
  producto?: string
  cantidad?: number
}

interface DeliveryGuide {
  id: string
  numero_guia: string
  estatus?: string
  transportadora?: string
  productos?: DeliveryGuideProduct[]
  created_at?: string
  updated_at?: string
}

interface DeliveryGuidesListProps {
  onImportSuccess?: () => void
}

export default function DeliveryGuidesList({ onImportSuccess }: DeliveryGuidesListProps) {
  const [guides, setGuides] = useState<DeliveryGuide[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [expandedGuides, setExpandedGuides] = useState<Set<string>>(new Set())
  const [showImportModal, setShowImportModal] = useState(false)
  const pageSize = 50

  const fetchGuides = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString()
      })

      if (search) {
        params.append("search", search)
      }

      const response = await apiClient.request(`/delivery-guides?${params.toString()}`)
      
      if (response.data?.items) {
        // Transformar los datos para incluir productos si están disponibles
        const transformedGuides = response.data.items.map((guide: any) => {
          let productos: DeliveryGuideProduct[] = []
          
          // Intentar parsear productos_detalle si existe
          if (guide.productos_detalle) {
            try {
              productos = typeof guide.productos_detalle === 'string' 
                ? JSON.parse(guide.productos_detalle) 
                : guide.productos_detalle
            } catch (e) {
              console.warn("Error parsing productos_detalle:", e)
            }
          }
          
          // Si no hay productos_detalle pero hay productos como número, crear un array vacío
          if (productos.length === 0 && typeof guide.productos === 'number' && guide.productos > 0) {
            productos = []
          }
          
          return {
            id: guide.id,
            numero_guia: guide.codigo || guide.numero_guia || "",
            estatus: guide.estatus || "",
            transportadora: guide.transportadora || "",
            productos: productos,
            created_at: guide.created_at,
            updated_at: guide.updated_at
          }
        })
        setGuides(transformedGuides)
        setTotal(response.data.total || 0)
        setTotalPages(response.data.pages || 1)
      }
    } catch (error) {
      console.error("Error fetching guides:", error)
      toast.error("Error al cargar guías")
    } finally {
      setLoading(false)
    }
  }, [currentPage, search, statusFilter])

  useEffect(() => {
    fetchGuides()
  }, [fetchGuides])

  const getStatusBadge = (estatus: string) => {
    if (!estatus) return <span className="text-muted-foreground">-</span>
    
    const statusConfig: Record<string, { variant: "default" | "secondary" | "outline" | "destructive", label: string }> = {
      activo: { variant: "default", label: "Activo" },
      inactivo: { variant: "secondary", label: "Inactivo" },
      pendiente: { variant: "outline", label: "Pendiente" },
      entregado: { variant: "default", label: "Entregado" },
      en_transito: { variant: "outline", label: "En Tránsito" }
    }
    
    const config = statusConfig[estatus.toLowerCase()] || { variant: "outline" as const, label: estatus }
    
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // Agrupar productos por guía para mostrar en la tabla
  const getTotalQuantity = (productos: DeliveryGuideProduct[] | undefined) => {
    if (!productos || productos.length === 0) return 0
    return productos.reduce((sum, p) => sum + (p.cantidad || 0), 0)
  }

  const getProductCount = (productos: DeliveryGuideProduct[] | undefined) => {
    if (!productos || productos.length === 0) return 0
    return productos.length
  }

  const toggleExpand = (guideId: string) => {
    setExpandedGuides(prev => {
      const newSet = new Set(prev)
      if (newSet.has(guideId)) {
        newSet.delete(guideId)
      } else {
        newSet.add(guideId)
      }
      return newSet
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <CardTitle>Guías de Despacho</CardTitle>
            <CardDescription>
              Lista completa de guías con información de productos
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar Guías
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por número de guía, transportadora..."
              className="pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por estatus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estatus</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="entregado">Entregado</SelectItem>
              <SelectItem value="en_transito">En Tránsito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <p>Cargando guías...</p>
          </div>
        ) : guides.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron guías</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Número Guía</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Cantidad Total</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guides.map((guide) => {
                  const isExpanded = expandedGuides.has(guide.id)
                  const productos = Array.isArray(guide.productos) ? guide.productos : []
                  const hasProducts = productos.length > 0
                  
                  return (
                    <>
                      <TableRow key={guide.id} className={isExpanded ? "bg-gray-50" : ""}>
                        <TableCell>
                          {hasProducts && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(guide.id)}
                              className="h-8 w-8 p-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold">
                          {guide.numero_guia || "-"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(guide.estatus || "")}
                        </TableCell>
                        <TableCell>
                          {guide.transportadora || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {getProductCount(guide.productos) > 0 ? (
                            <Badge variant="outline">{getProductCount(guide.productos)} producto(s)</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getTotalQuantity(guide.productos) > 0 ? (
                            <span className="font-semibold">{getTotalQuantity(guide.productos)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {guide.created_at 
                            ? new Date(guide.created_at).toLocaleDateString('es-ES')
                            : "-"}
                        </TableCell>
                      </TableRow>
                      {isExpanded && hasProducts && (
                        <TableRow key={`${guide.id}-details`}>
                          <TableCell colSpan={7} className="bg-gray-50 p-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm mb-2">Detalle de Productos:</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-32">Producto ID</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-right">Cantidad</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {productos.map((producto, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell className="font-mono text-xs">
                                        {producto.producto_id || "-"}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs">
                                        {producto.sku || "-"}
                                      </TableCell>
                                      <TableCell>
                                        {producto.producto || "-"}
                                      </TableCell>
                                      <TableCell className="text-right font-semibold">
                                        {producto.cantidad || 0}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, total)} de {total} guías
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <div className="text-sm">
                    Página {currentPage} de {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">Importar Guías de Despacho</DialogTitle>
            <DialogDescription className="text-sm">
              Importe guías de despacho desde CSV o Excel. Las columnas requeridas son: Numero Guia, estatus, TRANSPORTADORA, PRODUCTO ID, SKU, PRODUCTO, CANTIDAD
            </DialogDescription>
          </DialogHeader>
          <UniversalImportWizard
            validateEndpoint="/delivery-guides/import/validate"
            importEndpoint="/delivery-guides/import/import"
            importType="delivery_guides"
            moduleName="Guías de Despacho"
            onSuccess={() => {
              setShowImportModal(false)
              fetchGuides()
              onImportSuccess?.()
              toast.success("Guías de despacho importadas exitosamente")
            }}
            onCancel={() => setShowImportModal(false)}
            allowUpdate={true}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}

