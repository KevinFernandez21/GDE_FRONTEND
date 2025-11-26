import { useState, useCallback } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface Guide {
  id: string
  codigo: string
  estado_actual: string
  [key: string]: any
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
}

interface GuideHistory {
  guia_id: string
  codigo: string
  estado_actual: string
  eventos: any[]
  total_eventos: number
  total_inconsistencias: number
}

interface EventData {
  tipo_evento: string
  location?: string
  notes?: string
  archivo_origen?: string
  metadata?: any
}

export function useGuideTraceability() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGuides = useCallback(async (
    page: number = 1,
    size: number = 50,
    filters?: {
      search?: string
      status?: string
      batchId?: string
    }
  ): Promise<{ items: Guide[], total: number, pages: number } | null> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      })

      if (filters?.search) {
        params.append("search", filters.search)
      }

      if (filters?.status) {
        params.append("status_filter", filters.status)
      }

      if (filters?.batchId) {
        params.append("batch_id", filters.batchId)
      }

      const response = await apiClient.request(`/guide-master/master-guides?${params.toString()}`)

      if (response.data) {
        return {
          items: response.data.items || [],
          total: response.data.total || 0,
          pages: response.data.pages || 1
        }
      }

      return null
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Error al cargar guías"
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const registerEvent = useCallback(async (
    guideId: string,
    eventData: EventData
  ): Promise<any | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.request(
        `/traceability/guides/${guideId}/register-event`,
        {
          method: "POST",
          body: JSON.stringify(eventData)
        }
      )

      if (response.id) {
        toast.success("Evento registrado exitosamente")
        return response
      }

      return null
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Error al registrar evento"
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getGuideHistory = useCallback(async (
    guideId: string,
    limit?: number
  ): Promise<GuideHistory | null> => {
    try {
      setLoading(true)
      setError(null)

      const params = limit ? `?limit=${limit}` : ""
      const response = await apiClient.request(`/traceability/guides/${guideId}/history${params}`)

      if (response.data) {
        return response.data
      }

      return null
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Error al cargar historial"
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getGuideStatus = useCallback(async (
    guideId: string
  ): Promise<GuideStatus | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.request(`/traceability/guides/${guideId}/status`)

      if (response.data) {
        return response.data
      }

      return null
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Error al cargar estado"
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const markInconsistency = useCallback(async (
    guideId: string,
    eventId: string,
    description: string,
    resolution?: string
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.request(
        `/traceability/guides/${guideId}/mark-inconsistency`,
        {
          method: "POST",
          body: JSON.stringify({
            event_id: eventId,
            description,
            resolution
          })
        }
      )

      if (response.status === "success") {
        toast.success("Inconsistencia marcada exitosamente")
        return true
      }

      return false
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Error al marcar inconsistencia"
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    fetchGuides,
    registerEvent,
    getGuideHistory,
    getGuideStatus,
    markInconsistency
  }
}

