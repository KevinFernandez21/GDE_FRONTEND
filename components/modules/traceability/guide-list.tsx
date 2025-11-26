"use client"

import { Search, Eye, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface Guide {
  id: string
  numero_guia?: string
  codigo?: string
  fecha?: string
  cliente?: string
  productos: number
  transportadora?: string
  fecha_match?: string  // Fecha cuando se hizo match entre delivery_guides y scanned_guides
  estado_verificado?: string  // Estado de movilización: no_registrado, en_transito, entregado, devuelto
  created_at?: string
  updated_at?: string
}

interface GuideListProps {
  onViewDetail?: (guideId: string) => void
  onRegisterEvent?: (guideId: string) => void
  onMarkInconsistency?: (guideId: string, eventId?: string) => void
  onImportSuccess?: () => void
}

export default function GuideList({
  onViewDetail,
  onRegisterEvent,
  onMarkInconsistency,
  onImportSuccess
}: GuideListProps) {
  const [guides, setGuides] = useState<Guide[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
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

      // Note: delivery-guides endpoint doesn't have status_filter, 
      // but we keep it for potential future use or if filtering is done client-side
      if (statusFilter !== "all") {
        // params.append("status_filter", statusFilter) // Disabled for now
      }

      // Use guide-master comparison endpoint to compare delivery guides with scanned guides
      const response = await apiClient.request(`/guide-master/comparison?${params.toString()}`)
      
      if (response.data?.items) {
        // Response structure: { items: [...], total: ..., page: ..., size: ..., pages: ... }
        setGuides(response.data.items)
        setTotal(response.data.total || 0)
        setTotalPages(response.data.pages || 1)
      } else if (response.data?.data?.items) {
        // Fallback for different response structure
        setGuides(response.data.data.items)
        setTotal(response.data.data.total || 0)
        setTotalPages(response.data.data.pages || 1)
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


  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      no_registrado: { variant: "secondary" as const, label: "No Registrado" },
      en_transito: { variant: "default" as const, label: "En Tránsito" },
      entregado: { variant: "default" as const, label: "Entregado" },
      devuelto: { variant: "outline" as const, label: "Devuelto" }
    }
    
    const config = statusConfig[estado as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: estado
    }
    
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <CardTitle>Guías de Despacho</CardTitle>
            <CardDescription>
              Lista completa de guías con filtros por estado
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por código, cliente..."
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
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="no_registrado">No Registrado</SelectItem>
              <SelectItem value="en_transito">En Tránsito</SelectItem>
              <SelectItem value="entregado">Entregado</SelectItem>
              <SelectItem value="devuelto">Devuelto</SelectItem>
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
                  <TableHead>Número de Guía</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Fecha de Match</TableHead>
                  <TableHead>Estado de Movilización</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guides.map((guide) => (
                  <TableRow key={guide.id}>
                    <TableCell className="font-mono text-sm font-semibold">
                      {guide.numero_guia || guide.codigo || "-"}
                    </TableCell>
                    <TableCell>
                      {guide.transportadora || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>{guide.productos || 0}</TableCell>
                    <TableCell>
                      {guide.fecha_match ? (
                        new Date(guide.fecha_match).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {guide.estado_verificado ? (
                        getStatusBadge(guide.estado_verificado)
                      ) : (
                        <Badge variant="secondary">No Registrado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetail?.(guide.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
    </Card>
  )
}

