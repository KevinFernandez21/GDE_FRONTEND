"use client"

import { useState } from "react"
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface UploadResult {
  batch_id: string
  imported: number
  skipped: number
  errors: string[]
  total_processed: number
}

interface GuideMasterUploadProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (result: UploadResult) => void
}

export default function GuideMasterUpload({ isOpen, onClose, onSuccess }: GuideMasterUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [batchName, setBatchName] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error("Solo se permiten archivos CSV")
        return
      }
      setFile(selectedFile)
      // Generate default batch name from filename and date
      const date = new Date().toLocaleDateString('es-ES')
      setBatchName(`${selectedFile.name.replace('.csv', '')} - ${date}`)
    }
  }

  const handleUpload = async () => {
    if (!file || !batchName.trim()) {
      toast.error("Selecciona un archivo y proporciona un nombre para el lote")
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      const token = localStorage.getItem('gde_token')
      if (!token) {
        toast.error('No se encontró token de autenticación')
        return
      }

      setUploadProgress(30)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(
        `http://localhost:8000/api/v1/guide-master/import-csv?batch_name=${encodeURIComponent(batchName)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData
        }
      )

      setUploadProgress(70)

      if (response.ok) {
        const result = await response.json()
        setUploadProgress(100)
        setUploadResult(result.data)

        toast.success(`Importación completada: ${result.data.imported} guías importadas`)

        if (onSuccess) {
          onSuccess(result.data)
        }

        // Auto-close after 3 seconds if successful and no errors
        if (result.data.errors.length === 0) {
          setTimeout(() => {
            handleClose()
          }, 3000)
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.detail || 'Error al importar CSV')
        setUploadProgress(0)
      }
    } catch (error) {
      console.error('Error uploading CSV:', error)
      toast.error('Error de conexión con el servidor')
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setBatchName("")
    setUploadProgress(0)
    setUploadResult(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Guías Madre (CSV Droppi)</DialogTitle>
          <DialogDescription>
            Carga el archivo CSV exportado desde Droppi con la lista completa de guías de despacho
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!uploadResult ? (
            <>
              {/* File Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">1. Seleccionar Archivo CSV</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="flex-1"
                      />
                      {file && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{file.name}</span>
                        </div>
                      )}
                    </div>

                    {file && (
                      <div className="text-xs text-muted-foreground">
                        Tamaño: {(file.size / 1024).toFixed(2)} KB
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Batch Name Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">2. Nombre del Lote</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Ej: Guías Droppi - Semana 15"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    disabled={isUploading}
                  />
                </CardContent>
              </Card>

              {/* CSV Format Info */}
              <Alert>
                <FileText className="w-4 h-4" />
                <AlertTitle>Formato Esperado del CSV</AlertTitle>
                <AlertDescription className="text-xs mt-2">
                  <div className="space-y-1">
                    <p><strong>Columnas requeridas:</strong></p>
                    <ul className="list-disc list-inside pl-2">
                      <li><code>codigo</code> (obligatorio) - Código único de la guía</li>
                      <li><code>fecha</code> - Fecha de emisión</li>
                      <li><code>cliente</code> - Nombre del cliente</li>
                      <li><code>productos</code> - Cantidad de productos</li>
                      <li><code>estado_droppi</code> - Estado en Droppi</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importando...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file || !batchName.trim() || isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Importando...' : 'Importar Guías'}
                </Button>
              </div>
            </>
          ) : (
            /* Upload Result */
            <div className="space-y-4">
              <Alert className={uploadResult.errors.length > 0 ? "border-yellow-500" : "border-green-500"}>
                {uploadResult.errors.length === 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <AlertTitle className="text-green-600">¡Importación Exitosa!</AlertTitle>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-600">Importación Completada con Advertencias</AlertTitle>
                  </>
                )}
                <AlertDescription className="mt-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span><strong>{uploadResult.imported}</strong> guías importadas</span>
                    </div>
                    {uploadResult.skipped > 0 && (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span><strong>{uploadResult.skipped}</strong> omitidas</span>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {uploadResult.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-yellow-600">Errores y Advertencias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {uploadResult.errors.map((error, idx) => (
                        <div key={idx} className="text-xs text-red-600 flex items-start gap-2">
                          <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 justify-end">
                <Button onClick={handleClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
