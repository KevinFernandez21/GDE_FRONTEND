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
  RefreshCw,
  X
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
import { Label } from "@/components/ui/label"
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
    original_columns?: string[]
    applied_mappings?: Record<string, string>
    required_columns: string[]
    optional_columns: string[]
    missing_required: string[]
    unknown_columns: string[]
    column_mapping: ColumnMapping[]
  }
  data_validation: {
    critical_errors: ValidationError[]
    warnings: ValidationError[]
    total_errors: number
  }
  duplicate_check: {
    has_duplicates: boolean
    duplicate_rows: number[]
  }
  duplicate_file_check?: {
    is_duplicate: boolean
    last_imported: string
  }
  duplicate_sku_check?: {
    has_existing: boolean
    existing_count: number
    new_count: number
    total_skus: number
  }
  preview_data: any[]
  recommendations: Recommendation[]
  schema: SchemaDefinition
}

interface ColumnMapping {
  column_name: string
  original_name?: string
  status: "required" | "optional" | "unknown" | "missing"
  message: string
  can_remove: boolean
  definition?: any
  suggested_aliases?: string[]
}

interface ValidationError {
  message: string
  affected_rows?: number[]
  total_affected?: number
}

interface Recommendation {
  severity: "critical" | "warning" | "info"
  message: string
}

interface ColumnDefinition {
  type: string
  validation: string
  max_length?: number
  description: string
  example: string
  unique?: boolean
}

interface SchemaDefinition {
  required_columns: string[]
  optional_columns: string[]
  column_definitions: Record<string, ColumnDefinition>
}

interface ImportWizardProps {
  isOpen?: boolean
  onClose?: () => void
  onImportComplete?: () => void
  onCancel?: () => void
}

export default function InventoryImportWizard({ isOpen, onClose, onImportComplete, onCancel }: ImportWizardProps) {
  const [step, setStep] = useState<"upload" | "validate" | "review" | "import" | "complete">("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [columnsToRemove, setColumnsToRemove] = useState<string[]>([])

  // Handle validation
  const handleValidate = () => {
    if (selectedFile) {
      validateFile(selectedFile)
    }
  }

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

  // Validate file (dry-run mode)
  const validateFile = async (file: File) => {
    setIsValidating(true)
    
    try {
      const response = await apiClient.validateImport(file)
      
      if (response.error) {
        toast.error("Error al validar", {
          description: response.error.message || "Error desconocido"
        })
        setStep("upload")
        return
      }
      
      if (response.data) {
        // Map response to ValidationResult format
        const validationData: ValidationResult = {
          success: response.data.valid_for_import || false,
          valid_for_import: response.data.valid_for_import || false,
          file_info: {
            rows: response.data.total_rows || 0,
            columns: Object.keys(response.data.column_mapping || {}).length,
            file_type: file.name.endsWith('.csv') ? 'csv' : 'xlsx'
          },
          column_validation: {
            valid: response.data.valid_for_import || false,
            file_columns: Object.keys(response.data.column_mapping || {}),
            column_mapping: Object.entries(response.data.column_mapping || {}).map(([key, value]) => ({
              column_name: key,
              original_name: key,
              status: "required" as const,
              message: `Mapeado a ${value}`,
              can_remove: false
            })),
            required_columns: ['sku', 'name'],
            optional_columns: [],
            missing_required: [],
            unknown_columns: []
          },
          data_validation: {
            critical_errors: (response.data.errors || []).filter((e: any) => e.error && !e.error.includes('warning')).map((e: any) => ({
              message: `${e.field ? `Campo "${e.field}": ` : ''}${e.error || e.message || "Error de validación"}${e.value ? ` (valor: ${e.value})` : ''}`,
              affected_rows: [e.row || e.line || 0],
              total_affected: 1
            })),
            warnings: (response.data.errors || []).filter((e: any) => e.error && e.error.includes('warning')).map((e: any) => ({
              message: `${e.field ? `Campo "${e.field}": ` : ''}${e.error || e.message || "Advertencia"}${e.value ? ` (valor: ${e.value})` : ''}`,
              affected_rows: [e.row || e.line || 0],
              total_affected: 1
            })),
            total_errors: response.data.invalid_rows || 0
          },
          duplicate_check: {
            has_duplicates: false,
            duplicate_rows: []
          },
          preview_data: response.data.preview || [],
          recommendations: [],
          schema: {
            required_columns: ['sku', 'name'],
            optional_columns: [],
            column_definitions: {}
          }
        }
        
        setValidationResult(validationData)
        setStep("review")
        
        if (response.data.valid_for_import) {
          toast.success("Validación exitosa", {
            description: `${response.data.valid_rows} filas válidas de ${response.data.total_rows} totales`
          })
        } else {
          toast.warning("Errores detectados", {
            description: `${response.data.invalid_rows} filas con errores. Revisa los detalles antes de continuar`
          })
        }
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

  const [importOnlyValid, setImportOnlyValid] = useState(false)

  // Handle import
  const handleImport = async () => {
    if (!selectedFile || !validationResult) return
    
    setIsImporting(true)
    setStep("import")
    
    try {
      const response = await apiClient.importInventory(selectedFile, importOnlyValid)
      
      if (response.error) {
        toast.error("Error en la importación", {
          description: response.error.message || "Error desconocido"
        })
        setStep("review")
        return
      }
      
      if (response.data) {
        setImportResult(response.data)
        setStep("complete")
        
        toast.success("Importación exitosa", {
          description: `${response.data.successful || 0} productos procesados exitosamente`
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

  // Download template
  const handleDownloadTemplate = async (format: 'xlsx' | 'csv') => {
    try {
      // Use fetch directly to download the blob
      const token = localStorage.getItem('gde_token')
      const apiBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
      const response = await fetch(
        `${apiBaseUrl}/api/v1/inventory/import/template/download?format=${format}`,
        {
          method: 'GET',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Error al descargar la plantilla')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
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
    const variants: Record<string, { variant: "destructive" | "secondary" | "outline", label: string }> = {
      required: { variant: "destructive", label: "Requerida" },
      optional: { variant: "secondary", label: "Opcional" },
      unknown: { variant: "outline", label: "Desconocida" },
      missing: { variant: "destructive", label: "Faltante" }
    }
    
    const config = variants[status] || { variant: "outline" as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with progress indicator */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Importar Inventario</h2>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress indicator - responsive */}
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-2">
            {["upload", "validate", "review", "import", "complete"].map((s, index) => (
              <div key={s} className="flex items-center flex-shrink-0">
                <div className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 text-xs sm:text-sm ${
                  step === s ? "border-primary bg-primary text-primary-foreground" :
                  ["upload", "validate", "review", "import", "complete"].indexOf(step) > index ? "border-primary bg-primary/20" :
                  "border-muted"
                }`}>
                  {index + 1}
                </div>
                {index < 4 && (
                  <div className={`h-0.5 w-6 sm:w-12 ${
                    ["upload", "validate", "review", "import", "complete"].indexOf(step) > index ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-6 pb-24 max-h-[calc(100vh-200px)]">
        <div className="space-y-6">
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
                  className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 sm:p-12 transition-colors ${
                    isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                  }`}
                >
                  <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                  <p className="text-base sm:text-lg font-medium mb-2 text-center">
                    Arrastra tu archivo aquí
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4 text-center">
                    o haz clic para seleccionar
                  </p>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Badge variant="secondary" className="text-xs">CSV o XLSX</Badge>
                </div>

                {/* Download templates */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">¿No tienes una plantilla?</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadTemplate('xlsx')}
                      className="flex-1 sm:flex-none"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Descargar Plantilla XLSX</span>
                      <span className="sm:hidden">XLSX</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadTemplate('csv')}
                      className="flex-1 sm:flex-none"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Descargar Plantilla CSV</span>
                      <span className="sm:hidden">CSV</span>
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
                      <li><strong>sku</strong>: Código único del producto (también acepta: code, código, codigo, item_code, etc.)</li>
                      <li><strong>name</strong>: Nombre del producto (también acepta: nombre, producto, description, etc.)</li>
                      <li><strong>cost_price</strong>: Precio de costo (también acepta: precio_costo, costo, cost, purchase_price, etc.)</li>
                      <li><strong>current_stock</strong>: Stock actual (también acepta: stock, inventario, cantidad, qty, quantity, etc.)</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Nota:</strong> El sistema mapea automáticamente variaciones comunes de nombres de columnas. 
                      No necesitas renombrar tus columnas si usan nombres estándar del mercado.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Columnas opcionales: description, category, brand, proveedor, unit, sale_price, min_stock, max_stock, location, barcode
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
                      <div className="text-sm text-muted-foreground">Filas Totales</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {validationResult.column_validation?.valid_columns || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Columnas Válidas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-destructive">
                        {validationResult.data_validation?.total_errors || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Errores Críticos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Column Mappings Applied */}
              {validationResult.column_validation?.applied_mappings && 
               Object.keys(validationResult.column_validation.applied_mappings).length > 0 && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Info className="h-4 w-4 text-blue-600" />
                      Mapeo Inteligente de Columnas
                    </CardTitle>
                    <CardDescription className="text-xs">
                      El sistema ha mapeado automáticamente tus columnas a los nombres estándar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(validationResult.column_validation.applied_mappings).map(([original, mapped]) => (
                        <div key={original} className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-muted-foreground">{original}</span>
                          <ArrowRight className="h-3 w-3 text-blue-600" />
                          <span className="font-semibold text-blue-700">{mapped}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {validationResult.recommendations?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recomendaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {validationResult.recommendations?.map((rec, index) => (
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
                <CardContent className="p-4 sm:p-6">
                  <Tabs defaultValue="columns" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 h-auto">
                      <TabsTrigger value="columns" className="text-xs sm:text-sm py-2">
                        <span className="hidden sm:inline">Columnas</span>
                        <span className="sm:hidden">Col</span>
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {validationResult.column_validation?.file_columns?.length || 0}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="errors" className="text-xs sm:text-sm py-2">
                        <span className="hidden sm:inline">Errores</span>
                        <span className="sm:hidden">Err</span>
                        <Badge variant="destructive" className="ml-1 text-xs">
                          {validationResult.data_validation?.total_errors || 0}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="text-xs sm:text-sm py-2">
                        <span className="hidden sm:inline">Vista Previa</span>
                        <span className="sm:hidden">Prev</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Columns Tab */}
                    <TabsContent value="columns" className="space-y-4">
                      <ScrollArea className="h-[400px] sm:h-[500px] border rounded-md">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[40px]"></TableHead>
                                <TableHead className="min-w-[120px]">Columna</TableHead>
                                <TableHead className="min-w-[100px]">Estado</TableHead>
                                <TableHead className="min-w-[200px]">Mensaje</TableHead>
                                <TableHead className="text-right w-[80px]">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {validationResult.column_validation?.column_mapping?.map((col, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    {col.status === "required" && <XCircle className="h-4 w-4 text-destructive" />}
                                    {col.status === "optional" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                    {col.status === "unknown" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                                    {col.status === "missing" && <XCircle className="h-4 w-4 text-destructive" />}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    <div>
                                      <div>{col.column_name}</div>
                                      {col.original_name && col.original_name !== col.column_name && (
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                          Mapeado desde: <span className="italic">{col.original_name}</span>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>{getStatusBadge(col.status)}</TableCell>
                                  <TableCell className="text-sm">
                                    <div>{col.message}</div>
                                    {col.status === "missing" && col.suggested_aliases && col.suggested_aliases.length > 0 && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Sugerencias: {col.suggested_aliases.slice(0, 3).join(", ")}
                                      </div>
                                    )}
                                  </TableCell>
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
                      </ScrollArea>
                    </TabsContent>

                    {/* Errors Tab */}
                    <TabsContent value="errors" className="space-y-4">
                      <ScrollArea className="h-[300px] sm:h-[400px] border rounded-md">
                        <div className="space-y-3 p-4">
                          {validationResult.data_validation?.critical_errors && validationResult.data_validation.critical_errors.length > 0 ? (
                            validationResult.data_validation.critical_errors.map((error, index) => (
                              <Alert key={`error-${index}`} variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle className="font-medium">
                                  Fila {error.affected_rows?.[0] || index + 1}: {error.message}
                                </AlertTitle>
                                <AlertDescription className="text-sm">
                                  {error.affected_rows && error.affected_rows.length > 1 && (
                                    <p className="text-xs mt-1">También afecta a las filas: {error.affected_rows.slice(1).join(", ")}</p>
                                  )}
                                  {error.total_affected && error.total_affected > 10 && (
                                    <p className="text-xs mt-1">...y {error.total_affected - 10} filas más</p>
                                  )}
                                </AlertDescription>
                              </Alert>
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                              <p>No se encontraron errores críticos</p>
                            </div>
                          )}
                          
                          {validationResult.data_validation?.warnings && validationResult.data_validation.warnings.length > 0 && (
                            <>
                              <div className="text-sm font-medium mt-4 mb-2">Advertencias:</div>
                              {validationResult.data_validation.warnings.map((warning, index) => (
                                <Alert key={`warning-${index}`}>
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertTitle className="font-medium">
                                    Fila {warning.affected_rows?.[0] || index + 1}: {warning.message}
                                  </AlertTitle>
                                  <AlertDescription className="text-sm">
                                    {warning.affected_rows && warning.affected_rows.length > 1 && (
                                      <p className="text-xs mt-1">También afecta a las filas: {warning.affected_rows.slice(1).join(", ")}</p>
                                    )}
                                  </AlertDescription>
                                </Alert>
                              ))}
                            </>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>

                    {/* Preview Tab */}
                    <TabsContent value="preview">
                      <ScrollArea className="h-[300px] sm:h-[400px] border rounded-md">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {validationResult.column_validation?.file_columns?.map((col) => (
                                  <TableHead key={col} className="min-w-[100px] text-xs sm:text-sm">{col}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {validationResult.preview_data?.map((row, index) => (
                                <TableRow key={index}>
                                  {validationResult.column_validation?.file_columns?.map((col) => (
                                    <TableCell key={col} className="max-w-[150px] sm:max-w-[200px] truncate text-xs sm:text-sm">
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

                  </Tabs>
                </CardContent>
              </Card>
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
              onClick={onCancel}
            >
              Cancelar
            </Button>
            
            {step === "upload" && selectedFile && (
              <Button
                onClick={handleValidate}
                disabled={isValidating}
                className="flex items-center gap-2"
              >
                {isValidating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {isValidating ? "Validando..." : "Validar Archivo"}
              </Button>
            )}
            
            {step === "review" && validationResult && (
              <div className="flex flex-col gap-3">
                {validationResult.data_validation?.total_errors > 0 && (
                  <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <Checkbox
                      id="import-only-valid"
                      checked={importOnlyValid}
                      onCheckedChange={(checked) => setImportOnlyValid(checked === true)}
                    />
                    <Label
                      htmlFor="import-only-valid"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Importar solo filas válidas ({validationResult.file_info?.rows - (validationResult.data_validation?.total_errors || 0)} de {validationResult.file_info?.rows} filas)
                    </Label>
                  </div>
                )}
                <Button
                  onClick={handleImport}
                  disabled={isImporting || (!validationResult.valid_for_import && !importOnlyValid)}
                  className="flex items-center gap-2"
                >
                  {isImporting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {isImporting ? "Importando..." : "Importar Productos"}
                </Button>
              </div>
            )}
            
            {step === "complete" && (
              <Button
                onClick={onCancel}
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
  )
}
