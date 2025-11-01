"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileUp, Upload, ChevronLeft, ChevronRight, Package } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import BulkGuideImportModal from "@/components/bulk-guide-import-modal"

interface GuideComparisonUploadProps {
  onOpenImport?: () => void
}

interface DeliveryGuide {
  id: string
  codigo: string
  fecha: string
  cliente: string
  productos: number
  dropshipper?: string
  created_at: string
  updated_at: string
}

export default function GuideComparisonUpload({ onOpenImport }: GuideComparisonUploadProps) {
  const [guides, setGuides] = useState<DeliveryGuide[]>([])
  const [loading, setLoading] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(100)
  const [totalGuides, setTotalGuides] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchGuides = async () => {
    setLoading(true)
    try {
      const response = await apiClient.request(
        `/delivery-guides?page=${currentPage}&page_size=${pageSize}`,
        { method: "GET" }
      )

      if (response.data) {
        setGuides(response.data.items || [])
        setTotalGuides(response.data.total || 0)
        setTotalPages(response.data.total_pages || 0)
      }
    } catch (error: any) {
      console.error("Error fetching guides:", error)
      toast.error("Error al cargar las guías")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGuides()
  }, [currentPage])

  const handleImportSuccess = () => {
    fetchGuides()
    toast.success("Guías importadas correctamente")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Escaneo de Guías</h2>
          <p className="text-muted-foreground">
            Importa y visualiza guías de despacho desde archivos CSV o Excel
          </p>
        </div>
        <Button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Importar Guías
        </Button>
      </div>

      {/* Import Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Importar Guías de Despacho
          </CardTitle>
          <CardDescription>
            Importa guías desde archivos CSV o Excel. Columnas requeridas: <strong>codigo</strong>, <strong>fecha</strong>, <strong>cliente</strong>, <strong>productos</strong>.
            Columnas opcionales: <strong>usuario</strong>, <strong>dropshipper</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nota: La comparación con Guías Madre se realiza automáticamente al importar. Los estados se actualizan según el tipo de movimiento (entrada/salida).
          </p>
        </CardContent>
      </Card>

      {/* Guides Table */}
      <Card>
        <CardHeader>
          <CardTitle>Guías de Despacho Cargadas</CardTitle>
          <CardDescription>Lista de guías importadas en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Cargando guías...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código Guía</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Dropshipper</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guides.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-2">
                          <Package className="w-8 h-8 text-gray-400" />
                          <p className="text-gray-500">No se encontraron guías</p>
                          <p className="text-sm text-gray-400">Importa guías usando el botón "Importar Guías"</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    guides.map((guide) => (
                      <TableRow key={guide.id}>
                        <TableCell className="font-mono text-sm">{guide.codigo || "-"}</TableCell>
                        <TableCell>
                          {guide.fecha ? new Date(guide.fecha).toLocaleDateString('es-ES') : "-"}
                        </TableCell>
                        <TableCell>{guide.cliente || "-"}</TableCell>
                        <TableCell>{guide.productos || 0}</TableCell>
                        <TableCell>{guide.dropshipper || "-"}</TableCell>
                        <TableCell>
                          {guide.created_at 
                            ? new Date(guide.created_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t mt-4">
                  <div className="text-sm text-gray-600">
                    Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalGuides)} de {totalGuides} guías
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
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

      {/* Import Modal */}
      <BulkGuideImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  )
}
