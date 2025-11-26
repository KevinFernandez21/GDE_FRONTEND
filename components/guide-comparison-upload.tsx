"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUp, Upload } from "lucide-react"
import { toast } from "sonner"
import BulkGuideImportModal from "@/components/bulk-guide-import-modal"

interface GuideComparisonUploadProps {
  onOpenImport?: () => void
  onImportSuccess?: () => void
}

export default function GuideComparisonUpload({ onOpenImport, onImportSuccess }: GuideComparisonUploadProps) {
  const [showImportModal, setShowImportModal] = useState(false)

  const handleImportSuccess = () => {
    setShowImportModal(false)
    toast.success("Guías importadas correctamente")
    onImportSuccess?.()
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

      {/* Import Modal */}
      <BulkGuideImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  )
}
