"use client"

import { Eye, RefreshCw, Download, Filter, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface Batch {
  id: string
  batch_name: string
  source: string
  tipo: string
  imported_by: string
  import_date: string
  total_items: number
  processed_items: number
  status: string
  errors: string[]
  metadata: any
  created_at: string
}

export default function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [tipoFilter, setTipoFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchBatches()
  }, [tipoFilter, statusFilter])

  const fetchBatches = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (tipoFilter !== "all") {
        params.append("tipo", tipoFilter)
      }
      
      const response = await apiClient.request(`/traceability/batches?${params.toString()}`)
      
      if (response.data?.batches) {
        let filtered = response.data.batches
        
        if (statusFilter !== "all") {
          filtered = filtered.filter((b: Batch) => b.status === statusFilter)
        }
        
        setBatches(filtered)
      }
    } catch (error) {
      console.error("Error fetching batches:", error)
      toast.error("Error al cargar lotes")
    } finally {
      setLoading(false)
    }
  }

  const handleReprocess = async (batchId: string) => {
    try {
      const response = await apiClient.request(`/traceability/batches/${batchId}/reprocess`, {
        method: "POST",
        body: JSON.stringify({ force: false, skip_duplicates: true })
      })
      
      if (response.status === "success") {
        toast.success("Reprocesamiento iniciado")
        fetchBatches()
      }
    } catch (error) {
      console.error("Error reprocessing batch:", error)
      toast.error("Error al reprocesar lote")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pendiente: { variant: "secondary", label: "Pendiente" },
      procesando: { variant: "default", label: "Procesando" },
      completado: { variant: "default", label: "Completado" },
      error: { variant: "destructive", label: "Error" }
    }
    
    const config = statusConfig[status] || { variant: "secondary" as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getProgress = (batch: Batch) => {
    if (batch.total_items === 0) return 0
    return (batch.processed_items / batch.total_items) * 100
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <CardTitle>Gestión de Lotes</CardTitle>
            <CardDescription>
              Lista de lotes importados con opciones de reprocesamiento
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="guia_madre">Guías Madre</SelectItem>
                <SelectItem value="guias_escaneadas">Guías Escaneadas</SelectItem>
                <SelectItem value="costos">Costos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="procesando">Procesando</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12">
            <p>Cargando lotes...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron lotes</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Lote</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total Items</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.batch_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{batch.tipo || batch.source}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(batch.import_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{batch.total_items}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={getProgress(batch)} className="w-24" />
                      <span className="text-xs text-muted-foreground">
                        {batch.processed_items}/{batch.total_items}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(batch.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {batch.status === "completado" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReprocess(batch.id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

