"use client"

import { Filter, Download, Calendar, User, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface AuditEvent {
  id: string
  action: string
  table_name: string
  record_id: string
  user_id: string
  username?: string
  full_name?: string
  created_at: string
  old_values: any
  new_values: any
  event_id?: string
  lote_id?: string
}

export default function AuditView() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [userFilter, setUserFilter] = useState<string>("")
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all")
  const [loteFilter, setLoteFilter] = useState<string>("")
  const [fechaDesde, setFechaDesde] = useState<string>("")
  const [fechaHasta, setFechaHasta] = useState<string>("")

  useEffect(() => {
    fetchAuditEvents()
  }, [eventTypeFilter, loteFilter, fechaDesde, fechaHasta])

  const fetchAuditEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (userFilter) {
        params.append("user_id", userFilter)
      }
      
      if (eventTypeFilter !== "all") {
        // Extract event type from action
        params.append("action", `GUIDE_EVENT_${eventTypeFilter.toUpperCase()}`)
      }
      
      if (loteFilter) {
        params.append("lote_id", loteFilter)
      }
      
      if (fechaDesde) {
        params.append("fecha_desde", fechaDesde)
      }
      
      if (fechaHasta) {
        params.append("fecha_hasta", fechaHasta)
      }
      
      params.append("limit", "100")
      
      const response = await apiClient.request(`/audit/guide-events?${params.toString()}`)
      
      if (response.data) {
        setEvents(response.data)
      }
    } catch (error) {
      console.error("Error fetching audit events:", error)
      toast.error("Error al cargar eventos de auditoría")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      // TODO: Implement export functionality
      toast.info("Exportación en desarrollo")
    } catch (error) {
      console.error("Error exporting:", error)
      toast.error("Error al exportar")
    }
  }

  const getEventTypeLabel = (action: string) => {
    if (action.includes("GUIDE_EVENT_")) {
      return action.replace("GUIDE_EVENT_", "").toLowerCase()
    }
    return action
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <CardTitle>Vista de Auditoría</CardTitle>
            <CardDescription>
              Historial completo de eventos de guías con filtros avanzados
            </CardDescription>
          </div>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Usuario</label>
            <Input
              placeholder="ID de usuario"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Evento</label>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
                <SelectItem value="entrega">Entrega</SelectItem>
                <SelectItem value="devuelto">Devuelto</SelectItem>
                <SelectItem value="escaneo">Escaneo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Lote ID</label>
            <Input
              placeholder="ID del lote"
              value={loteFilter}
              onChange={(e) => setLoteFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Fecha Desde</label>
            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Fecha Hasta</label>
            <Input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <p>Cargando eventos...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron eventos</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Tipo de Evento</TableHead>
                <TableHead>Guía ID</TableHead>
                <TableHead>Estado Anterior</TableHead>
                <TableHead>Estado Nuevo</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    {new Date(event.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {event.full_name || event.username || event.user_id}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getEventTypeLabel(event.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {event.new_values?.guia_id || event.old_values?.guia_id || "-"}
                  </TableCell>
                  <TableCell>
                    {event.old_values?.estado ? (
                      <Badge variant="outline">{event.old_values.estado}</Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {event.new_values?.estado ? (
                      <Badge variant="default">{event.new_values.estado}</Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {event.lote_id ? (
                      <span className="font-mono text-xs">{event.lote_id.substring(0, 8)}...</span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <FileText className="w-4 h-4" />
                    </Button>
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

