"use client"

import { ArrowLeft, Calendar, User, FileText, AlertCircle, CheckCircle2, Clock, Package, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import EventTimeline from "./event-timeline"

interface GuideDetailProps {
  guideId: string
  onBack: () => void
  onRegisterEvent?: () => void
  onMarkInconsistency?: (eventId: string) => void
}

interface GuideStatus {
  guia_id: string
  codigo: string
  estado_actual: string
  estado_actual_display: string
  ultimo_evento: any
  total_eventos: number
  tiene_inconsistencias: boolean
  fecha_ultima_actualizacion: string
  estatus?: string
  transportadora?: string
}

interface GuideHistory {
  guia_id: string
  codigo: string
  estado_actual: string
  eventos: any[]
  total_eventos: number
  total_inconsistencias: number
}

export default function GuideDetail({ guideId, onBack, onRegisterEvent, onMarkInconsistency }: GuideDetailProps) {
  const [status, setStatus] = useState<GuideStatus | null>(null)
  const [history, setHistory] = useState<GuideHistory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGuideData()
  }, [guideId])

  const fetchGuideData = async () => {
    try {
      setLoading(true)
      
      // Fetch status and history in parallel
      const [statusResponse, historyResponse] = await Promise.all([
        apiClient.request(`/traceability/guides/${guideId}/status`),
        apiClient.request(`/traceability/guides/${guideId}/history`)
      ])

      if (statusResponse.data) {
        setStatus(statusResponse.data)
      }

      if (historyResponse.data) {
        setHistory(historyResponse.data)
      }
    } catch (error) {
      console.error("Error fetching guide data:", error)
      toast.error("Error al cargar detalles de la guía")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      no_registrado: { variant: "secondary" as const, label: "No Registrado", color: "text-gray-600" },
      en_transito: { variant: "default" as const, label: "En Tránsito", color: "text-yellow-600" },
      entregado: { variant: "default" as const, label: "Entregado", color: "text-green-600" },
      devuelto: { variant: "outline" as const, label: "Devuelto", color: "text-purple-600" }
    }
    
    const config = statusConfig[estado as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: estado,
      color: "text-gray-600"
    }
    
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p>Cargando detalles de la guía...</p>
      </div>
    )
  }

  if (!status || !history) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontró la guía</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Guía {status.codigo}</h2>
            <p className="text-muted-foreground">Detalles y historial completo</p>
          </div>
        </div>
        {onRegisterEvent && (
          <Button onClick={onRegisterEvent}>
            Registrar Evento
          </Button>
        )}
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Estado Actual</CardTitle>
          <CardDescription>Información del estado actual de la guía</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Estado</p>
              <div className="text-lg">
                {getStatusBadge(status.estado_actual)}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total de Eventos</p>
              <div className="text-lg font-semibold">{status.total_eventos}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Última Actualización</p>
              <div className="text-lg">
                {status.fecha_ultima_actualizacion 
                  ? new Date(status.fecha_ultima_actualizacion).toLocaleString()
                  : "N/A"}
              </div>
            </div>
          </div>
          
          {status.tiene_inconsistencias && (
            <Alert className="mt-4 border-red-500">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertTitle className="text-red-600">Inconsistencias Detectadas</AlertTitle>
              <AlertDescription>
                Esta guía tiene eventos marcados como inconsistentes. Revisa el historial para más detalles.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Event Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Eventos</CardTitle>
          <CardDescription>
            Línea de tiempo completa de todos los eventos registrados para esta guía
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventTimeline 
            events={history.eventos} 
            onMarkInconsistency={(eventId) => {
              if (onMarkInconsistency) {
                onMarkInconsistency(eventId)
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Guide Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Guía</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Código</p>
                <p className="font-mono font-semibold">{status.codigo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Última Actualización</p>
                <p>
                  {status.fecha_ultima_actualizacion 
                    ? new Date(status.fecha_ultima_actualizacion).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
            {status.estatus && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Estatus</p>
                  <p className="font-semibold">{status.estatus}</p>
                </div>
              </div>
            )}
            {status.transportadora && (
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Transportadora</p>
                  <p className="font-semibold">{status.transportadora}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

