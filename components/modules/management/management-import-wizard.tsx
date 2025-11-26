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
  X,
  DollarSign,
  Receipt
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
  compras_count: number
  gastos_count: number
  total_rows: number
  valid_rows: number
  invalid_rows: number
  errors: Array<{
    row: number
    field: string
    error: string
    value?: any
  }>
  warnings: Array<{
    row: number
    field: string
    error: string
    value?: any
  }>
  preview: any[]
  column_mapping: Record<string, string>
  found_columns: Record<string, string>
  missing_required: string[]
  valid_conceptos: string[]
  invalid_conceptos: string[]
}

interface ImportWizardProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete?: () => void
  onCancel?: () => void
}

export default function ManagementImportWizard({ isOpen, onClose, onImportComplete, onCancel }: ImportWizardProps) {
  const [step, setStep] = useState<"upload" | "validate" | "review" | "import" | "complete">("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [importOnlyValid, setImportOnlyValid] = useState(false)

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
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await apiClient.request('/accounting/costs/import/validate', {
        method: 'POST',
        body: formData
      })
      
      console.log('[ManagementImportWizard] Validation response:', response)
      
      if (response.error) {
        toast.error("Error al validar", {
          description: typeof response.error === 'string' ? response.error : (response.error as any)?.message || "Error desconocido"
        })
        setStep("upload")
        return
      }
      
      // Handle response format: backend returns {"success": true, "data": {...}}
      // apiClient may unwrap it to {data: {success: true, data: {...}}} or {data: {...}}
      let validationDataRaw = response.data as any
      
      // If response.data has a nested "data" property (double-wrapped), unwrap it
      if (validationDataRaw && typeof validationDataRaw === 'object' && 'data' in validationDataRaw && 'success' in validationDataRaw) {
        validationDataRaw = validationDataRaw.data
      }
      
      // If still wrapped, try one more level
      if (validationDataRaw && typeof validationDataRaw === 'object' && 'data' in validationDataRaw) {
        validationDataRaw = validationDataRaw.data
      }
      
      console.log('[ManagementImportWizard] Unwrapped validation data:', validationDataRaw)
      
      if (validationDataRaw) {
        console.log('[ManagementImportWizard] Validation data raw:', validationDataRaw)
        
        const validationData: ValidationResult = {
          success: validationDataRaw.valid_for_import || false,
          valid_for_import: validationDataRaw.valid_for_import || false,
          file_info: {
            rows: validationDataRaw.total_rows || 0,
            columns: Object.keys(validationDataRaw.found_columns || {}).length,
            file_type: file.name.endsWith('.csv') ? 'csv' : 'xlsx'
          },
          compras_count: validationDataRaw.compras_count || 0,
          gastos_count: validationDataRaw.gastos_count || 0,
          total_rows: validationDataRaw.total_rows || 0,
          valid_rows: validationDataRaw.valid_rows || 0,
          invalid_rows: validationDataRaw.invalid_rows || 0,
          errors: validationDataRaw.errors || [],
          warnings: validationDataRaw.warnings || [],
          preview: validationDataRaw.preview || [],
          column_mapping: validationDataRaw.column_mapping || {},
          found_columns: validationDataRaw.found_columns || {},
          missing_required: validationDataRaw.missing_required || [],
          valid_conceptos: validationDataRaw.valid_conceptos || [],
          invalid_conceptos: validationDataRaw.invalid_conceptos || []
        }
        
        console.log('[ManagementImportWizard] Processed validation data:', validationData)
        
        setValidationResult(validationData)
        setStep("review")
        
        if (validationDataRaw.valid_for_import) {
          toast.success("Validación exitosa", {
            description: `${validationDataRaw.compras_count || 0} compras y ${validationDataRaw.gastos_count || 0} gastos detectados`
          })
        } else {
          toast.warning("Errores detectados", {
            description: `${validationDataRaw.invalid_rows || 0} filas con errores. Revisa los detalles antes de continuar`
          })
        }
      } else {
        console.error('[ManagementImportWizard] No validation data in response:', response)
        toast.error("Error al procesar la respuesta", {
          description: "No se recibieron datos de validación"
        })
        setStep("upload")
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
      formData.append('import_only_valid', importOnlyValid.toString())
      
      const response = await apiClient.request('/accounting/costs/import/import', {
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
      
      if (response.data) {
        setImportResult(response.data)
        setStep("complete")
        
        toast.success("Importación exitosa", {
          description: `${response.data.costos_imported || 0} costos y ${response.data.gastos_imported || 0} gastos importados`
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
    setImportOnlyValid(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Importar Datos de Gestión</CardTitle>
              <CardDescription>
                Sube un archivo Excel/CSV con compras y gastos. Se separarán automáticamente según el campo "Concepto"
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging ? "border-primary bg-primary/5" : "border-gray-300"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Arrastra tu archivo aquí</h3>
                <p className="text-sm text-gray-500 mb-4">
                  O haz clic para seleccionar un archivo
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Seleccionar archivo
                  </label>
                </Button>
                <p className="text-xs text-gray-400 mt-4">
                  Formatos soportados: CSV, XLSX, XLS
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Formato esperado</AlertTitle>
                <AlertDescription>
                  El archivo debe contener las columnas: Fecha, Canal, Concepto, Proveedor, Producto, Codigo SKU, Documento, Cantidad, Costo Unitario, Total, Metodo de Pago.
                  <br />
                  <strong>El campo "Concepto" determina la clasificación:</strong>
                  <br />
                  • "Compras" / "Compra" / "Costo" / "Costos" → Se importará como <strong>Costos</strong>
                  <br />
                  • "Gasto" / "Gastos" / "Expense" / "Expenses" → Se importará como <strong>Gastos</strong>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Validate Step */}
          {step === "validate" && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                <h3 className="text-lg font-semibold mb-2">Validando archivo...</h3>
                <p className="text-sm text-gray-500">
                  Analizando estructura y datos del archivo
                </p>
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === "review" && validationResult && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Filas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{validationResult.total_rows}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Compras (Costos)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{validationResult.compras_count}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Gastos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{validationResult.gastos_count}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Válidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{validationResult.valid_rows}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Validation Status */}
              {validationResult.valid_for_import ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Archivo válido para importación</AlertTitle>
                  <AlertDescription className="text-green-700">
                    El archivo ha sido validado correctamente. Puedes proceder con la importación.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Errores detectados</AlertTitle>
                  <AlertDescription className="text-red-700">
                    Se encontraron {validationResult.invalid_rows} filas con errores. Revisa los detalles antes de continuar.
                  </AlertDescription>
                </Alert>
              )}

              {/* Column Mapping */}
              <Card>
                <CardHeader>
                  <CardTitle>Columnas Detectadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(validationResult.found_columns).map(([std, orig]) => (
                      <div key={std} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{std}</span>
                        <Badge variant="outline">{orig}</Badge>
                      </div>
                    ))}
                  </div>
                  {validationResult.missing_required.length > 0 && (
                    <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">Columnas faltantes</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        {validationResult.missing_required.join(", ")}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Preview */}
              {validationResult.preview.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Vista Previa (Primeras 10 filas)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(validationResult.preview[0] || {}).map((col) => (
                              <TableHead key={col}>{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.preview.map((row, idx) => (
                            <TableRow key={idx}>
                              {Object.values(row).map((val: any, colIdx) => (
                                <TableCell key={colIdx}>{String(val || '')}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Errors and Warnings */}
              <Tabs defaultValue="errors" className="w-full">
                <TabsList>
                  <TabsTrigger value="errors">
                    Errores ({validationResult.errors.length})
                  </TabsTrigger>
                  <TabsTrigger value="warnings">
                    Advertencias ({validationResult.warnings.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="errors">
                  <Card>
                    <CardContent className="pt-6">
                      <ScrollArea className="h-48">
                        {validationResult.errors.length > 0 ? (
                          <div className="space-y-2">
                            {validationResult.errors.map((error, idx) => (
                              <Alert key={idx} variant="destructive">
                                <AlertDescription>
                                  Fila {error.row}: {error.error}
                                </AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-8">
                            No se encontraron errores
                          </p>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="warnings">
                  <Card>
                    <CardContent className="pt-6">
                      <ScrollArea className="h-48">
                        {validationResult.warnings.length > 0 ? (
                          <div className="space-y-2">
                            {validationResult.warnings.map((warning, idx) => (
                              <Alert key={idx} className="border-yellow-200 bg-yellow-50">
                                <AlertDescription>
                                  Fila {warning.row}: {warning.error}
                                </AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-8">
                            No se encontraron advertencias
                          </p>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Import Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Opciones de Importación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="import-only-valid"
                      checked={importOnlyValid}
                      onCheckedChange={(checked) => setImportOnlyValid(checked as boolean)}
                    />
                    <Label htmlFor="import-only-valid" className="cursor-pointer">
                      Importar solo filas válidas (omitir filas con errores)
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleReset}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={!validationResult.valid_for_import}
                >
                  Importar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Import Step */}
          {step === "import" && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                <h3 className="text-lg font-semibold mb-2">Importando datos...</h3>
                <p className="text-sm text-gray-500">
                  Por favor espera mientras se procesan los datos
                </p>
                <Progress value={50} className="mt-4 max-w-md mx-auto" />
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && importResult && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <h3 className="text-2xl font-semibold mb-2">Importación Completada</h3>
                <p className="text-gray-500">
                  Los datos han sido importados exitosamente
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Costos Importados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {importResult.costos_imported || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Gastos Importados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {importResult.gastos_imported || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {(importResult.costos_errors?.length > 0 || importResult.gastos_errors?.length > 0) && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Algunos registros no se pudieron importar</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Revisa los errores en la consola o contacta al administrador
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button onClick={() => {
                  handleReset()
                  onClose()
                }}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


