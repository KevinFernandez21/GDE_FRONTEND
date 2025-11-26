"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface RegisterEventModalProps {
  isOpen: boolean
  onClose: () => void
  guideId: string
  currentState?: string
  onSuccess?: () => void
}

export default function RegisterEventModal({
  isOpen,
  onClose,
  guideId,
  currentState,
  onSuccess
}: RegisterEventModalProps) {
  const [tipoEvento, setTipoEvento] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [allowedEvents, setAllowedEvents] = useState<string[]>([])
  const [guideCurrentState, setGuideCurrentState] = useState<string | undefined>(currentState)

  useEffect(() => {
    // Fetch current state if not provided
    const fetchCurrentState = async () => {
      if (isOpen && guideId && !guideCurrentState) {
        try {
          const response = await apiClient.request(`/traceability/guides/${guideId}/status`)
          if (response.data?.estado_actual) {
            setGuideCurrentState(response.data.estado_actual)
          }
        } catch (error) {
          console.error("Error fetching guide status:", error)
        }
      }
    }
    fetchCurrentState()
  }, [isOpen, guideId, guideCurrentState])

  useEffect(() => {
    if (isOpen && guideCurrentState) {
      // Determine allowed events based on current state
      const stateEvents: Record<string, string[]> = {
        no_registrado: ["salida", "escaneo"],
        en_transito: ["entrega", "escaneo"],
        entregado: ["devuelto", "escaneo"],
        devuelto: ["escaneo"]
      }
      setAllowedEvents(stateEvents[guideCurrentState] || ["escaneo"])
    }
  }, [isOpen, guideCurrentState])

  const handleSubmit = async () => {
    if (!tipoEvento) {
      toast.error("Selecciona un tipo de evento")
      return
    }

    try {
      setLoading(true)
      
      const response = await apiClient.request(`/traceability/guides/${guideId}/register-event`, {
        method: "POST",
        body: JSON.stringify({
          tipo_evento: tipoEvento,
          location: location || undefined,
          notes: notes || undefined
        })
      })

      if (response.id) {
        toast.success("Evento registrado exitosamente")
        onSuccess?.()
        handleClose()
      } else {
        toast.error("Error al registrar evento")
      }
    } catch (error: any) {
      console.error("Error registering event:", error)
      const errorMessage = error.response?.data?.detail || "Error al registrar evento"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTipoEvento("")
    setLocation("")
    setNotes("")
    setLoading(false)
    setGuideCurrentState(currentState) // Reset to initial state
    onClose()
  }

  const getEventLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      salida: "Salida (No Registrado → En Tránsito)",
      entrega: "Entrega (En Tránsito → Entregado)",
      devuelto: "Devuelto (Entregado → Devuelto)",
      escaneo: "Escaneo (No cambia estado)"
    }
    return labels[tipo] || tipo
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Evento</DialogTitle>
          <DialogDescription>
            Registra un nuevo evento para esta guía. El sistema validará la transición de estado automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {guideCurrentState && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Estado actual: <strong>{guideCurrentState}</strong>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="tipo_evento">Tipo de Evento *</Label>
            <Select value={tipoEvento} onValueChange={setTipoEvento}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                {allowedEvents.map((event) => (
                  <SelectItem key={event} value={event}>
                    {getEventLabel(event)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {allowedEvents.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No hay eventos disponibles para el estado actual
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              placeholder="Ej: Bodega Central, Almacén 1"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre el evento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !tipoEvento}>
            {loading ? "Registrando..." : "Registrar Evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

