"use client"

import { CheckCircle2, XCircle, Clock, Truck, ArrowRight, ArrowLeft, Scan, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface Event {
  id: string
  tipo_evento: string
  timestamp: string
  estado_anterior: string
  estado_nuevo: string
  es_inconsistencia: boolean
  usuario_nombre: string
  location?: string
  notes?: string
  archivo_origen?: string
  metadata?: any
}

interface EventTimelineProps {
  events: Event[]
  onMarkInconsistency?: (eventId: string) => void
}

export default function EventTimeline({ events, onMarkInconsistency }: EventTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay eventos registrados para esta guía</p>
      </div>
    )
  }

  const getEventIcon = (tipo: string, esInconsistencia: boolean) => {
    if (esInconsistencia) {
      return <XCircle className="w-5 h-5 text-red-600" />
    }

    switch (tipo) {
      case "salida":
        return <Truck className="w-5 h-5 text-yellow-600" />
      case "entrega":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case "devuelto":
        return <ArrowLeft className="w-5 h-5 text-purple-600" />
      case "escaneo":
        return <Scan className="w-5 h-5 text-blue-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getEventLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      salida: "Salida",
      entrega: "Entrega",
      devuelto: "Devuelto",
      escaneo: "Escaneo"
    }
    return labels[tipo] || tipo
  }

  const getStateLabel = (estado: string) => {
    const labels: Record<string, string> = {
      no_registrado: "No Registrado",
      en_transito: "En Tránsito",
      entregado: "Entregado",
      devuelto: "Devuelto"
    }
    return labels[estado] || estado
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
      
      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={event.id} className="relative flex gap-4">
            {/* Icon */}
            <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-border">
              {getEventIcon(event.tipo_evento, event.es_inconsistencia)}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <Card className={event.es_inconsistencia ? "border-red-500" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={event.es_inconsistencia ? "destructive" : "default"}>
                          {getEventLabel(event.tipo_evento)}
                        </Badge>
                        {event.es_inconsistencia && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Inconsistencia
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* State transition */}
                  {event.estado_anterior !== event.estado_nuevo && (
                    <div className="flex items-center gap-2 my-2 text-sm">
                      <Badge variant="outline">{getStateLabel(event.estado_anterior)}</Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="default">{getStateLabel(event.estado_nuevo)}</Badge>
                    </div>
                  )}

                  {/* Event details */}
                  <div className="mt-3 space-y-1 text-sm">
                    {event.usuario_nombre && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Usuario:</span> {event.usuario_nombre}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Ubicación:</span> {event.location}
                      </p>
                    )}
                    {event.notes && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Notas:</span> {event.notes}
                      </p>
                    )}
                    {event.archivo_origen && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Archivo origen:</span> {event.archivo_origen}
                      </p>
                    )}
                  </div>

                  {/* Inconsistency details */}
                  {event.es_inconsistencia && event.metadata?.inconsistency_description && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm font-medium text-red-900 mb-1">
                        Descripción de la inconsistencia:
                      </p>
                      <p className="text-sm text-red-800">
                        {event.metadata.inconsistency_description}
                      </p>
                      {event.metadata.resolution && (
                        <p className="text-sm text-red-700 mt-2">
                          <span className="font-medium">Resolución:</span> {event.metadata.resolution}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mark as inconsistency button (if not already marked) */}
                  {!event.es_inconsistencia && onMarkInconsistency && (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onMarkInconsistency(event.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Marcar como Inconsistencia
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

