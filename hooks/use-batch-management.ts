import { useState, useCallback } from "react"
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

interface BatchReprocessOptions {
  force?: boolean
  skip_duplicates?: boolean
}

export function useBatchManagement() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBatches = useCallback(async (
    limit: number = 50,
    tipo?: string
  ): Promise<Batch[]> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        limit: limit.toString()
      })

      if (tipo) {
        params.append("tipo", tipo)
      }

      const response = await apiClient.request(`/traceability/batches?${params.toString()}`)

      if (response.data?.batches) {
        return response.data.batches
      }

      return []
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Error al cargar lotes"
      setError(errorMessage)
      toast.error(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const reprocessBatch = useCallback(async (
    batchId: string,
    options: BatchReprocessOptions = {}
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.request(
        `/traceability/batches/${batchId}/reprocess`,
        {
          method: "POST",
          body: JSON.stringify({
            force: options.force || false,
            skip_duplicates: options.skip_duplicates !== false
          })
        }
      )

      if (response.status === "success") {
        toast.success("Reprocesamiento iniciado")
        return true
      }

      return false
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Error al reprocesar lote"
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const getBatchProgress = useCallback(async (
    batchId: string
  ): Promise<{ processed: number, total: number, percentage: number } | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.request(`/traceability/batches/${batchId}`)

      if (response.data) {
        const batch = response.data
        const total = batch.total_items || 0
        const processed = batch.processed_items || 0
        const percentage = total > 0 ? (processed / total) * 100 : 0

        return {
          processed,
          total,
          percentage
        }
      }

      return null
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Error al obtener progreso"
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    fetchBatches,
    reprocessBatch,
    getBatchProgress
  }
}

