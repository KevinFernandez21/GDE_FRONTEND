"use client"

/**
 * Universal Import Wizard
 * Reusable component for importing data across all modules
 * Supports CSV/Excel imports with validation, preview, and error handling
 */

import { useState, useCallback } from "react"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Download, FileText, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

interface UniversalImportWizardProps {
  /** API endpoint for validation (e.g., "/inventory/import/validate") */
  validateEndpoint: string
  /** API endpoint for import (e.g., "/inventory/import/import") */
  importEndpoint: string
  /** Import type identifier (e.g., "products", "guides", "kardex") */
  importType: string
  /** Module display name (e.g., "Productos", "Guías Madre") */
  moduleName: string
  /** Callback when import completes successfully */
  onSuccess?: () => void
  /** Callback when user cancels */
  onCancel?: () => void
  /** Download template endpoint (optional) */
  templateEndpoint?: string
  /** Allow update existing records */
  allowUpdate?: boolean
}

interface ValidationResult {
  success: boolean
  valid_for_import: boolean
  file_info: any
  column_validation: any
  data_validation: any
  duplicate_check: any
  duplicate_file_check?: any
  duplicate_tracking_check?: any
  duplicate_sku_check?: any
  preview_data: any[]
  statistics: any
  recommendations: any[]
  schema: any
}

export default function UniversalImportWizard({
  validateEndpoint,
  importEndpoint,
  importType,
  moduleName,
  onSuccess,
  onCancel,
  templateEndpoint,
  allowUpdate = true
}: UniversalImportWizardProps) {
  const [step, setStep] = useState<'upload' | 'validate' | 'import' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      if (!validTypes.includes(selectedFile.type) && 
          !selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
        toast.error("Formato de archivo no válido. Use CSV o Excel (.xlsx)")
        return
      }
      
      setFile(selectedFile)
      setValidation(null)
    }
  }

  const handleValidate = async () => {
    if (!file) return

    setIsValidating(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem('gde_token')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      const response = await fetch(`${API_BASE_URL}${validateEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()

      if (result.success && result.data) {
        setValidation(result.data)
        setStep('validate')
        
        if (!result.data.valid_for_import) {
          toast.warning("El archivo contiene errores que deben corregirse")
        } else {
          toast.success("Validación exitosa. El archivo está listo para importar")
        }
      } else {
        toast.error(result.message || "Error al validar el archivo")
      }
    } catch (error) {
      console.error('Validation error:', error)
      toast.error("Error al conectar con el servidor")
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (allowUpdate) {
        formData.append('update_existing', 'true')
      }

      const token = localStorage.getItem('gde_token')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      const response = await fetch(`${API_BASE_URL}${importEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const result = await response.json()
      
      console.log("=" .repeat(60))
      console.log("🔍 IMPORT RESULT FROM BACKEND:")
      console.log("Result object:", JSON.stringify(result, null, 2))
      console.log("result.success:", result.success)
      console.log("result.stats:", result.stats)
      console.log("result.results:", result.results)
      console.log("result.data:", result.data)
      console.log("=" .repeat(60))

      if (result.success) {
        console.log("✅ Setting import result and changing step to complete")
        // The backend returns {success, message, data} where data contains the actual import result
        // So we need to use result.data if it exists, otherwise use result directly
        const importData = result.data || result
        console.log("📦 Import data to display:", importData)
        setImportResult(importData)
        setStep('complete')
        toast.success(result.message || "Importación completada exitosamente")
        
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500)
        }
      } else {
        toast.error(result.message || "Error durante la importación")
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error("Error al conectar con el servidor")
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    if (!templateEndpoint) return

    try {
      const token = localStorage.getItem('gde_token')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      const response = await fetch(`${API_BASE_URL}${templateEndpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `plantilla_${importType}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success("Plantilla descargada")
      }
    } catch (error) {
      console.error('Download template error:', error)
      toast.error("Error al descargar la plantilla")
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'warning': return 'default'
      case 'info': return 'secondary'
      case 'success': return 'outline'
      default: return 'secondary'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'info': return <Info className="w-5 h-5 text-blue-500" />
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center space-x-2 ${step === 'upload' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step === 'upload' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
          }`}>
            1
          </div>
          <span>Cargar Archivo</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-300" />
        <div className={`flex items-center space-x-2 ${step === 'validate' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step === 'validate' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
          }`}>
            2
          </div>
          <span>Validar</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-300" />
        <div className={`flex items-center space-x-2 ${(step === 'import' || step === 'complete') ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            (step === 'import' || step === 'complete') ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
          }`}>
            3
          </div>
          <span>Importar</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Importar {moduleName}</CardTitle>
            <CardDescription>
              Cargue un archivo CSV o Excel con los datos a importar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Arrastra un archivo aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-gray-500">
                  Formatos soportados: CSV, XLSX (máx. 10MB)
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>Seleccionar Archivo</span>
                  </Button>
                </label>
              </div>
            </div>

            {file && (
              <Alert>
                <FileSpreadsheet className="w-4 h-4" />
                <AlertTitle>Archivo seleccionado</AlertTitle>
                <AlertDescription>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {templateEndpoint && (
              <Alert>
                <Download className="w-4 h-4" />
                <AlertTitle>¿Primera vez importando?</AlertTitle>
                <AlertDescription>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm">Descarga la plantilla con el formato correcto</span>
                    <Button variant="link" size="sm" onClick={handleDownloadTemplate}>
                      Descargar Plantilla
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              <Button 
                onClick={handleValidate} 
                disabled={!file || isValidating}
              >
                {isValidating ? "Validando..." : "Continuar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Validate */}
      {step === 'validate' && validation && (
        <div className="space-y-4">
          {/* File Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Archivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Filas</p>
                  <p className="text-2xl font-bold">{validation.file_info.rows}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Columnas</p>
                  <p className="text-2xl font-bold">{validation.file_info.columns}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tamaño</p>
                  <p className="text-2xl font-bold">
                    {(validation.file_info.file_size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <Badge variant={validation.valid_for_import ? "default" : "destructive"}>
                    {validation.valid_for_import ? "Válido" : "Con Errores"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {validation.recommendations && validation.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recomendaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {validation.recommendations.map((rec: any, idx: number) => (
                  <Alert key={idx} variant={rec.severity === 'critical' ? 'destructive' : 'default'}>
                    {getSeverityIcon(rec.severity)}
                    <AlertTitle className="ml-2">{rec.type}</AlertTitle>
                    <AlertDescription className="ml-7">
                      {rec.message}
                      {rec.details && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer">Ver detalles</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                            {JSON.stringify(rec.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Preview Data */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa (Primeras 10 Filas)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {validation.preview_data[0] && Object.keys(validation.preview_data[0]).map((key) => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validation.preview_data.map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        {Object.values(row).map((value: any, cellIdx: number) => (
                          <TableCell key={cellIdx}>
                            {value !== null && value !== undefined ? String(value) : '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('upload')}>
              Atrás
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!validation.valid_for_import || isImporting}
            >
              {isImporting ? "Importando..." : "Importar Datos"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 'complete' && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <span>Importación Completada</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Exitosos</p>
                <p className="text-3xl font-bold text-green-600">
                  {importResult.stats?.successful || importResult.results?.successful_rows || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Fallidos</p>
                <p className="text-3xl font-bold text-red-600">
                  {importResult.stats?.failed || importResult.results?.failed_rows || 0}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold text-blue-600">
                  {importResult.stats?.total || importResult.results?.total_rows || 0}
                </p>
              </div>
            </div>

            {importResult.results?.errors && importResult.results.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Algunos registros fallaron</AlertTitle>
                <AlertDescription>
                  <details className="mt-2">
                    <summary className="cursor-pointer">Ver errores</summary>
                    <ul className="mt-2 text-xs space-y-1">
                      {importResult.results.errors.map((error: any, idx: number) => (
                        <li key={idx}>Fila {error.row}: {error.error}</li>
                      ))}
                    </ul>
                  </details>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button onClick={onSuccess || onCancel}>
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

