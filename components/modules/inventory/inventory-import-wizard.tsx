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
  Trash2,
  Eye,
  ArrowRight,
  ArrowLeft,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
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
    optional_columns: string[]
    missing_required: string[]
    unknown_columns: string[]
    column_mapping: ColumnMapping[]
  }
  data_validation: {
    critical_errors: ValidationError[]
    warnings: ValidationError[]
    info: ValidationError[]
    total_errors: number
    total_warnings: number
  }
  duplicate_check: {
    has_duplicates: boolean
    duplicate_skus: any[]
    total_duplicates: number
  }
  preview_data: any[]
  statistics: {
    total_rows: number
    empty_cells: number
    fill_rate: number
  }
  recommendations: Recommendation[]
  schema: SchemaDefinition
}

interface ColumnMapping {
  column_name: string
  status: "required" | "optional" | "unknown" | "missing"
  message: string
  can_remove: boolean
  definition?: ColumnDefinition
}

interface ColumnDefinition {
  type: string
  validation: string
  description: string
  example: string
  max_length?: number
  default?: any
}

interface ValidationError {
  type: string
  column?: string
  message: string
  affected_rows?: number[]
  total_affected?: number
}

interface Recommendation {
  severity: "critical" | "warning" | "info" | "success"
  type: string
  message: string
  action: string
}

interface SchemaDefinition {
  required_columns: string[]
  optional_columns: string[]
  column_definitions: Record<string, ColumnDefinition>
}

interface ImportWizardProps {
  onImportComplete?: () => void
  onCancel?: () => void
}

export default function InventoryImportWizard({ onImportComplete, onCancel }: ImportWizardProps) {
  const [step, setStep] = useState<"upload" | "validate" | "review" | "import" | "complete">("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [columnsToRemove, setColumnsToRemove] = useState<string[]>([])

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      toast.error("Formato no soportado", {
        description: "Solo se permiten archivos CSV y XLSX"
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
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

  // Validate file
  const validateFile = async (file: File) => {
    setIsValidating(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const token = localStorage.getItem('gde_token')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${API_BASE_URL}/inventory/import/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setValidationResult(data.data)
        setStep("review")
        
        if (data.data.valid_for_import) {
          toast.success("Validación exitosa", {
            description: "El archivo está listo para importar"
          })
        } else {
          toast.warning("Errores detectados", {
            description: "Revise los errores antes de continuar"
          })
        }
      } else {
        toast.error("Error de validación", {
          description: data.message || data.detail || "Error desconocido"
        })
      }
    } catch (error: any) {
      console.error("Validation error:", error)
      toast.error("Error al validar el archivo", {
        description: error.message || "Error de conexión"
      })
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
      formData.append('update_existing', 'true')
      
      const token = localStorage.getItem('gde_token')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${API_BASE_URL}/inventory/import/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setImportResult(data.data)
        setStep("complete")
        
        toast.success("Importación exitosa", {
          description: data.message
        })
        
        if (onImportComplete) {
          onImportComplete()
        }
      } else {
        toast.error("Error en la importación", {
          description: response.data.message
        })
        setStep("review")
      }
    } catch (error: any) {
      console.error("Import error:", error)
      toast.error("Error al importar", {
        description: error.response?.data?.detail || error.message
      })
      setStep("review")
    } finally {
      setIsImporting(false)
    }
  }

  // Download template
  const handleDownloadTemplate = async (format: 'xlsx' | 'csv') => {
    try {
      const response = await apiClient.get(`/api/v1/inventory/import/template/download?format=${format}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `plantilla_importacion_productos.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success("Plantilla descargada", {
        description: `La plantilla ${format.toUpperCase()} ha sido descargada`
      })
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Error al descargar la plantilla")
    }
  }

  // Reset wizard
  const handleReset = () => {
    setStep("upload")
    setSelectedFile(null)
    setValidationResult(null)
    setImportResult(null)
    setColumnsToRemove([])
  }

  // Render severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-5 w-5 text-destructive" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  // Render status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      required: { variant: "destructive", label: "Requerida" },
      optional: { variant: "secondary", label: "Opcional" },
      unknown: { variant: "outline", label: "Desconocida" },
      missing: { variant: "destructive", label: "Faltante" }
    }
    
    const config = variants[status] || { variant: "outline", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {["upload", "validate", "review", "import", "complete"].map((s, index) => (
            <div key={s} className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
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

      {/* Step: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Cargar Archivo de Inventario</CardTitle>
            <CardDescription>
              Sube un archivo CSV o XLSX con los productos a importar
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
                Arrastra tu archivo aquí
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                o haz clic para seleccionar
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Badge variant="secondary">CSV o XLSX</Badge>
            </div>

            {/* Download templates */}
            <div className="space-y-2">
              <p className="text-sm font-medium">¿No tienes una plantilla?</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownloadTemplate('xlsx')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Plantilla XLSX
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownloadTemplate('csv')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Plantilla CSV
                </Button>
              </div>
            </div>

            {/* Requirements */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Requisitos del archivo</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>El archivo debe contener las siguientes columnas requeridas:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li><strong>sku</strong>: Código único del producto</li>
                  <li><strong>name</strong>: Nombre del producto</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Columnas opcionales: description, category, brand, unit, cost_price, sale_price, current_stock, min_stock, max_stock, location, barcode
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
                Archivo: {selectedFile?.name} ({validationResult.file_info.rows} filas, {validationResult.file_info.columns} columnas)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{validationResult.file_info.rows}</div>
                  <div className="text-sm text-muted-foreground">Filas Totales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {validationResult.column_validation.valid_columns}
                  </div>
                  <div className="text-sm text-muted-foreground">Columnas Válidas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">
                    {validationResult.data_validation.total_errors}
                  </div>
                  <div className="text-sm text-muted-foreground">Errores Críticos</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {validationResult.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recomendaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {validationResult.recommendations.map((rec, index) => (
                    <Alert key={index} variant={rec.severity === "critical" ? "destructive" : "default"}>
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(rec.severity)}
                        <div className="flex-1">
                          <AlertDescription>{rec.message}</AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs for detailed view */}
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="columns" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="columns">
                    Columnas ({validationResult.column_validation.file_columns.length})
                  </TabsTrigger>
                  <TabsTrigger value="errors">
                    Errores ({validationResult.data_validation.total_errors})
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    Vista Previa
                  </TabsTrigger>
                  <TabsTrigger value="stats">
                    Estadísticas
                  </TabsTrigger>
                </TabsList>

                {/* Columns Tab */}
                <TabsContent value="columns" className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]"></TableHead>
                          <TableHead>Columna</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Mensaje</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResult.column_validation.column_mapping.map((col, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {col.status === "required" && <XCircle className="h-4 w-4 text-destructive" />}
                              {col.status === "optional" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              {col.status === "unknown" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                              {col.status === "missing" && <XCircle className="h-4 w-4 text-destructive" />}
                            </TableCell>
                            <TableCell className="font-medium">{col.column_name}</TableCell>
                            <TableCell>{getStatusBadge(col.status)}</TableCell>
                            <TableCell className="text-sm">{col.message}</TableCell>
                            <TableCell className="text-right">
                              {col.can_remove && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    toast.info("Función no disponible", {
                                      description: "La eliminación de columnas se implementará próximamente"
                                    })
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Errors Tab */}
                <TabsContent value="errors" className="space-y-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {validationResult.data_validation.critical_errors.map((error, index) => (
                        <Alert key={`error-${index}`} variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertTitle className="font-medium">{error.message}</AlertTitle>
                          <AlertDescription className="text-sm">
                            {error.affected_rows && (
                              <p>Filas afectadas: {error.affected_rows.join(", ")}</p>
                            )}
                            {error.total_affected && error.total_affected > 10 && (
                              <p className="text-xs mt-1">...y {error.total_affected - 10} más</p>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                      
                      {validationResult.data_validation.warnings.map((warning, index) => (
                        <Alert key={`warning-${index}`}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle className="font-medium">{warning.message}</AlertTitle>
                          <AlertDescription className="text-sm">
                            {warning.affected_rows && (
                              <p>Filas afectadas: {warning.affected_rows.join(", ")}</p>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                      
                      {validationResult.data_validation.critical_errors.length === 0 &&
                       validationResult.data_validation.warnings.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                          <p>No se encontraron errores</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Preview Tab */}
                <TabsContent value="preview">
                  <ScrollArea className="h-[400px]">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {validationResult.column_validation.file_columns.map((col) => (
                              <TableHead key={col}>{col}</TableHead>
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
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Statistics Tab */}
                <TabsContent value="stats" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Completitud de Datos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Progress value={validationResult.statistics.fill_rate * 100} />
                          <p className="text-2xl font-bold">
                            {(validationResult.statistics.fill_rate * 100).toFixed(1)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Celdas Vacías</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{validationResult.statistics.empty_cells}</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cambiar Archivo
            </Button>
            <Button
              onClick={handleImport}
              disabled={!validationResult.valid_for_import}
            >
              Continuar con Importación
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === "import" && (
        <Card>
          <CardHeader>
            <CardTitle>Importando Productos</CardTitle>
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
              Los productos han sido importados exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold">{importResult.results?.total_rows || 0}</div>
                <div className="text-sm text-muted-foreground">Total Procesado</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-green-50">
                <div className="text-3xl font-bold text-green-600">{importResult.results?.inserts || 0}</div>
                <div className="text-sm text-muted-foreground">Nuevos</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-blue-50">
                <div className="text-3xl font-bold text-blue-600">{importResult.results?.updates || 0}</div>
                <div className="text-sm text-muted-foreground">Actualizados</div>
              </div>
            </div>

            {importResult.results?.failed_rows > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Algunos productos fallaron</AlertTitle>
                <AlertDescription>
                  {importResult.results.failed_rows} productos no pudieron ser procesados
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                Importar Más Productos
              </Button>
              <Button onClick={onCancel}>
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

