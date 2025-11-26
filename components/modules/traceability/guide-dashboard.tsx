"use client"

import { Package, CheckCircle2, Clock, AlertCircle, Truck, ArrowRight, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

interface TraceabilitySummary {
  total_guias: number
  no_registrado: number
  en_transito: number
  entregado: number
  devuelto: number
  desconocidas: number
  total_inconsistencias: number
  total_eventos: number
}

interface GuideDashboardProps {
  batchId?: string | null
}

export default function GuideDashboard({ batchId }: GuideDashboardProps) {
  const [summary, setSummary] = useState<TraceabilitySummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const params = batchId ? `?batch_id=${batchId}` : ""
      const response = await apiClient.request(`/traceability/summary${params}`)
      
      if (response.data) {
        setSummary(response.data)
      }
    } catch (error) {
      console.error("Error fetching summary:", error)
      toast.error("Error al cargar resumen de trazabilidad")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchSummary, 120000)
    return () => clearInterval(interval)
  }, [batchId])

  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Cargando métricas...</p>
      </div>
    )
  }

  if (!summary) {
    return null
  }

  const totalProcessed = summary.en_transito + summary.entregado + summary.devuelto
  const completionPercentage = summary.total_guias > 0 
    ? (totalProcessed / summary.total_guias) * 100 
    : 0

  return (
    <div className="space-y-4">
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Total Guías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.total_guias}</div>
            <p className="text-xs text-muted-foreground mt-1">Guías en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Truck className="w-4 h-4 text-yellow-600" />
              En Tránsito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{summary.en_transito}</div>
            <p className="text-xs text-muted-foreground mt-1">Guías en camino</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Entregadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{summary.entregado}</div>
            <p className="text-xs text-muted-foreground mt-1">Guías entregadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 text-purple-600" />
              Devueltas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{summary.devuelto}</div>
            <p className="text-xs text-muted-foreground mt-1">Guías devueltas</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{summary.no_registrado}</div>
            <p className="text-xs text-muted-foreground mt-1">No registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Desconocidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{summary.desconocidas}</div>
            <p className="text-xs text-muted-foreground mt-1">No están en lista madre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Inconsistencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{summary.total_inconsistencias}</div>
            <p className="text-xs text-muted-foreground mt-1">Eventos inconsistentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Progreso General</CardTitle>
          <CardDescription>
            {totalProcessed} de {summary.total_guias} guías procesadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {completionPercentage.toFixed(1)}% completado
          </p>
        </CardContent>
      </Card>

      {/* Alerts */}
      {summary.total_inconsistencias > 0 && (
        <Alert className="border-red-500">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertTitle className="text-red-600">Inconsistencias Detectadas</AlertTitle>
          <AlertDescription>
            Se han detectado {summary.total_inconsistencias} inconsistencia(s) en el sistema.
            Revisa la sección de auditoría para más detalles.
          </AlertDescription>
        </Alert>
      )}

      {summary.desconocidas > 0 && (
        <Alert className="border-orange-500">
          <AlertCircle className="w-4 h-4 text-orange-600" />
          <AlertTitle className="text-orange-600">Guías Desconocidas</AlertTitle>
          <AlertDescription>
            Se han escaneado {summary.desconocidas} guía(s) que no están en la lista maestra.
            Verifica estas guías para asegurar su correcto registro.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

