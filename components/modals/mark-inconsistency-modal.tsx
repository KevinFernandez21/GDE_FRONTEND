"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface MarkInconsistencyModalProps {
  isOpen: boolean
  onClose: () => void
  guideId: string
  eventId: string
  onSuccess?: () => void
}

export default function MarkInconsistencyModal({
  isOpen,
  onClose,
  guideId,
  eventId,
  onSuccess
}: MarkInconsistencyModalProps) {
  const [description, setDescription] = useState<string>("")
  const [resolution, setResolution] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("La descripción es requerida")
      return
    }

    try {
      setLoading(true)
      
      const response = await apiClient.request(`/traceability/guides/${guideId}/mark-inconsistency`, {
        method: "POST",
        body: JSON.stringify({
          event_id: eventId,
          description: description,
          resolution: resolution || undefined
        })
      })

      if (response.status === "success") {
        toast.success("Inconsistencia marcada exitosamente")
        onSuccess?.()
        handleClose()
      } else {
        toast.error("Error al marcar inconsistencia")
      }
    } catch (error: any) {
      console.error("Error marking inconsistency:", error)
      const errorMessage = error.response?.data?.detail || "Error al marcar inconsistencia"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setDescription("")
    setResolution("")
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar Inconsistencia</DialogTitle>
          <DialogDescription>
            Marca este evento como inconsistente y proporciona una descripción del problema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Una inconsistencia ocurre cuando una transición de estado no sigue el flujo esperado.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción de la Inconsistencia *</Label>
            <Textarea
              id="description"
              placeholder="Describe el problema detectado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution">Resolución (Opcional)</Label>
            <Textarea
              id="resolution"
              placeholder="Describe cómo se resolvió o se resolverá el problema..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !description.trim()}>
            {loading ? "Marcando..." : "Marcar Inconsistencia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

