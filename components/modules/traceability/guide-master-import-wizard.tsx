"use client"

import { useState, useCallback } from "react"
import { 
  Upload, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info,
  FileSpreadsheet,
  Download,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface ValidationResult {
  success: boolean
  valid_for_import: boolean
  file_info: {
    rows: number
    columns: number
    file_type: string
  }
  column_validation: {
    valid: boolean
    file_columns: string[]
    required_columns: string[]
    missing_required: string[]
    unknown_columns: string[]
  }
  data_validation: {
    critical_errors: ValidationError[]
    warnings: ValidationError[]
    total_errors: number
  }
  preview_data: any[]
}

interface ValidationError {
  message: string
  affected_rows?: number[]
  total_affected?: number
}

interface ImportWizardProps {
  isOpen?: boolean
  onClose?: () => void
  onImportComplete?: () => void
  onCancel?: () => void
}

const REQUIRED_COLUMNS = ['codigo', 'fecha', 'cliente']
const OPTIONAL_COLUMNS = ['origen', 'destino', 'productos', 'peso_kg', 'valor_declarado', 'estado_droppi', 'tracking_number', 'courier']

export default function GuideMasterImportWizard({ isOpen, onClose, onImportComplete, onCancel }: ImportWizardProps) {
  const [step, setStep] = useState<"upload" | "validate" | "review" | "import" | "complete">("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [importResult, setImportResult] = useState<any>(null)

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error("Formato no soportado", {
        description: "Solo se permiten archivos CSV para guías madre"
      })
      return
    }

    setSelectedFile(file)
    setStep("validate")
    validateFile(file)
  }

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // Validate file - Basic client-side validation
  const validateFile = async (file: File) => {
    setIsValidating(true)
    
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim() !== '')
      
      if (lines.length < 2) {
        toast.error("Archivo vacío", {
          description: "El archivo debe contener al menos una fila de datos"
        })
        setStep("upload")
        setIsValidating(false)
        return
      }

      // Parse CSV manually
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const data: any[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        data.push(row)
      }

      const fileColumns = headers
      
      // Validate columns
      const missingRequired = REQUIRED_COLUMNS.filter(col => !fileColumns.includes(col))
      const unknownColumns = fileColumns.filter(col => 
        !REQUIRED_COLUMNS.includes(col) && !OPTIONAL_COLUMNS.includes(col)
      )

      // Validate data
      const errors: ValidationError[] = []
      const warnings: ValidationError[] = []

      data.forEach((row, index) => {
        const rowNum = index + 2 // +2 because header is row 1 and arrays are 0-indexed

        // Check required fields
        if (!row.codigo || String(row.codigo).trim() === '') {
          errors.push({
            message: `Fila ${rowNum}: Código de guía es requerido`,
            affected_rows: [rowNum]
          })
        }

        if (!row.fecha || String(row.fecha).trim() === '') {
          errors.push({
            message: `Fila ${rowNum}: Fecha es requerida`,
            affected_rows: [rowNum]
          })
        } else {
          // Validate date format
          const date = new Date(row.fecha)
          if (isNaN(date.getTime())) {
            warnings.push({
              message: `Fila ${rowNum}: Formato de fecha inválido: ${row.fecha}`,
              affected_rows: [rowNum]
            })
          }
        }

        if (!row.cliente || String(row.cliente).trim() === '') {
          errors.push({
            message: `Fila ${rowNum}: Cliente es requerido`,
            affected_rows: [rowNum]
          })
        }

        // Validate productos if present
        if (row.productos && isNaN(Number(row.productos))) {
          warnings.push({
            message: `Fila ${rowNum}: Productos debe ser un número`,
            affected_rows: [rowNum]
          })
        }
      })

      const validationData: ValidationResult = {
        success: missingRequired.length === 0 && errors.length === 0,
        valid_for_import: missingRequired.length === 0 && errors.length === 0,
        file_info: {
          rows: data.length,
          columns: fileColumns.length,
          file_type: 'csv'
        },
        column_validation: {
          valid: missingRequired.length === 0,
          file_columns: fileColumns,
          required_columns: REQUIRED_COLUMNS,
          missing_required: missingRequired,
          unknown_columns: unknownColumns
        },
        data_validation: {
          critical_errors: errors,
          warnings: warnings,
          total_errors: errors.length
        },
        preview_data: data.slice(0, 10) // First 10 rows for preview
      }

      setValidationResult(validationData)
      setStep("review")

      if (validationData.valid_for_import) {
        toast.success("Validación exitosa", {
          description: `${data.length} guías válidas listas para importar`
        })
      } else {
        toast.warning("Errores detectados", {
          description: `${errors.length} errores encontrados. Revisa los detalles antes de continuar`
        })
      }
    } catch (error: any) {
      console.error("Validation error:", error)
      toast.error("Error al validar el archivo", {
        description: error.message || "Error de conexión"
      })
      setStep("upload")
    } finally {
      setIsValidating(false)
    }
  }

  // Handle import
  const handleImport = async () => {
    if (!selectedFile || !validationResult) return
    
    setIsImporting(true)
    setStep("import")
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await apiClient.request('/traceability/guides/upload-master', {
        method: 'POST',
        body: formData
      })

      if (response.error) {
        toast.error("Error en la importación", {
          description: response.error.message || "Error desconocido"
        })
        setStep("review")
        return
      }

      if (response.data || response.success) {
        setImportResult(response.data || response)
        setStep("complete")
        
        toast.success("Importación exitosa", {
          description: `${response.data?.imported_count || response.imported_count || 0} guías importadas exitosamente`
        })
        
        if (onImportComplete) {
          onImportComplete()
        }
      }
    } catch (error: any) {
      console.error("Import error:", error)
      toast.error("Error al importar", {
        description: error.message || "Error desconocido"
      })
      setStep("review")
    } finally {
      setIsImporting(false)
    }
  }

  // Reset wizard
  const handleReset = () => {
    setStep("upload")
    setSelectedFile(null)
    setValidationResult(null)
    setImportResult(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col m-4">
        {/* Header with progress indicator */}
        <div className="flex-shrink-0 p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Importar Guías Madre</h2>
            <Button variant="ghost" size="sm" onClick={onCancel || onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              {["upload", "validate", "review", "import", "complete"].map((s, index) => (
                <div key={s} className="flex items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm ${
                    step === s ? "border-primary bg-primary text-primary-foreground" :
                    ["upload", "validate", "review", "import", "complete"].indexOf(step) > index ? "border-primary bg-primary/20" :
                    "border-muted"
                  }`}>
                    {index + 1}
                  </div>
                  {index < 4 && (
                    <div className={`h-0.5 w-12 ${
                      ["upload", "validate", "review", "import", "complete"].indexOf(step) > index ? "bg-primary" : "bg-muted"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Step: Upload */}
            {step === "upload" && (
              <Card>
                <CardHeader>
                  <CardTitle>Cargar Archivo CSV</CardTitle>
                  <CardDescription>
                    Sube un archivo CSV con las guías madre a importar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Drag and drop area */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 transition-colors ${
                      isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">
                      Arrastra tu archivo CSV aquí
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      o haz clic para seleccionar
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Badge variant="secondary">CSV</Badge>
                  </div>

                  {/* Requirements */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Requisitos del archivo</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>El archivo debe contener las siguientes columnas requeridas:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li><strong>codigo</strong>: Código único de la guía</li>
                        <li><strong>fecha</strong>: Fecha de la guía (formato: YYYY-MM-DD)</li>
                        <li><strong>cliente</strong>: Nombre del cliente</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">
                        Columnas opcionales: origen, destino, productos, peso_kg, valor_declarado, estado_droppi, tracking_number, courier
                      </p>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Step: Validating */}
            {step === "validate" && (
              <Card>
                <CardHeader>
                  <CardTitle>Validando Archivo</CardTitle>
                  <CardDescription>
                    Analizando estructura y datos...
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Por favor espera mientras validamos tu archivo
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Step: Review */}
            {step === "review" && validationResult && (
              <div className="space-y-4">
                {/* Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Resultado de Validación</span>
                      {validationResult.valid_for_import ? (
                        <Badge className="bg-green-500">✓ Listo para Importar</Badge>
                      ) : (
                        <Badge variant="destructive">❌ Corrija los Errores</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Archivo: {selectedFile?.name} ({validationResult.file_info?.rows || 0} filas, {validationResult.file_info?.columns || 0} columnas)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{validationResult.file_info?.rows || 0}</div>
                        <div className="text-sm text-muted-foreground">Guías Totales</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {validationResult.file_info?.rows - (validationResult.data_validation?.total_errors || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Válidas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-destructive">
                          {validationResult.data_validation?.total_errors || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Errores</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Column Validation */}
                {validationResult.column_validation.missing_required.length > 0 && (
                  <Card className="border-red-200 bg-red-50/50">
                    <CardHeader>
                      <CardTitle className="text-sm text-red-700">Columnas Faltantes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1">
                        {validationResult.column_validation.missing_required.map((col) => (
                          <li key={col} className="text-sm text-red-700">{col}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Errors */}
                {validationResult.data_validation.critical_errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Errores Críticos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px] border rounded-md">
                        <div className="space-y-3 p-4">
                          {validationResult.data_validation.critical_errors.map((error, index) => (
                            <Alert key={`error-${index}`} variant="destructive">
                              <XCircle className="h-4 w-4" />
                              <AlertTitle className="font-medium">{error.message}</AlertTitle>
                            </Alert>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vista Previa</CardTitle>
                    <CardDescription>Primeras 10 guías del archivo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {validationResult.column_validation.file_columns.map((col) => (
                              <TableHead key={col} className="min-w-[100px]">{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.preview_data.map((row, index) => (
                            <TableRow key={index}>
                              {validationResult.column_validation.file_columns.map((col) => (
                                <TableCell key={col} className="max-w-[200px] truncate">
                                  {row[col] !== null && row[col] !== undefined ? String(row[col]) : "-"}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step: Importing */}
            {step === "import" && (
              <Card>
                <CardHeader>
                  <CardTitle>Importando Guías</CardTitle>
                  <CardDescription>
                    Procesando datos...
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Esto puede tomar algunos momentos
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Step: Complete */}
            {step === "complete" && importResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    Importación Completada
                  </CardTitle>
                  <CardDescription>
                    Las guías han sido importadas exitosamente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold">{importResult.total_processed || importResult.imported_count || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Procesado</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-green-50">
                      <div className="text-3xl font-bold text-green-600">{importResult.imported_count || 0}</div>
                      <div className="text-sm text-muted-foreground">Importadas</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-yellow-50">
                      <div className="text-3xl font-bold text-yellow-600">{importResult.skipped_count || 0}</div>
                      <div className="text-sm text-muted-foreground">Omitidas</div>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Algunas guías fallaron</AlertTitle>
                      <AlertDescription>
                        {importResult.errors.length} guías no pudieron ser procesadas
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Fixed bottom navigation */}
        <div className="flex-shrink-0 border-t bg-white p-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {step === "review" && validationResult && (
                <Button
                  variant="outline"
                  onClick={() => setStep("upload")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Cargar
                </Button>
              )}
              {step === "complete" && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Importar Más
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel || onClose}
              >
                Cancelar
              </Button>
              
              {step === "review" && validationResult && validationResult.valid_for_import && (
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="flex items-center gap-2"
                >
                  {isImporting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {isImporting ? "Importando..." : "Importar Guías"}
                </Button>
              )}
              
              {step === "complete" && (
                <Button
                  onClick={onCancel || onClose}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Finalizar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

