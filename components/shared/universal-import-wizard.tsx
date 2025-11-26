"use client"

/**
 * Universal Import Wizard
 * Reusable component for importing data across all modules
 * Supports CSV/Excel imports with validation, preview, and error handling
 */

import { useState, useCallback, useRef } from "react"
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
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      const selectedFile = droppedFiles[0]
      
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
  }, [])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleValidate = async () => {
    console.log('[UniversalImportWizard] handleValidate called')
    console.log('[UniversalImportWizard] File:', file)
    console.log('[UniversalImportWizard] Validate endpoint:', validateEndpoint)
    
    if (!file) {
      console.log('[UniversalImportWizard] No file selected, returning')
      return
    }

    setIsValidating(true)
    console.log('[UniversalImportWizard] Starting validation...')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      console.log('[UniversalImportWizard] FormData created with file:', file.name)

      const token = localStorage.getItem('gde_token')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      console.log('[UniversalImportWizard] API_BASE_URL:', API_BASE_URL)
      console.log('[UniversalImportWizard] Full URL:', `${API_BASE_URL}${validateEndpoint}`)
      console.log('[UniversalImportWizard] Token exists:', !!token)
      
      const response = await fetch(`${API_BASE_URL}${validateEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      console.log('[UniversalImportWizard] Response status:', response.status)
      console.log('[UniversalImportWizard] Response headers:', Object.fromEntries(response.headers.entries()))

      const result = await response.json()
      console.log('[UniversalImportWizard] Response result:', result)

      if (result.success && result.data) {
        console.log('[UniversalImportWizard] Validation successful, setting validation data:', result.data)
        setValidation(result.data)
        setStep('validate')
        console.log('[UniversalImportWizard] Step changed to validate')
        
        if (!result.data.valid_for_import) {
          console.log('[UniversalImportWizard] File has validation errors')
          toast.warning("El archivo contiene errores que deben corregirse")
        } else {
          console.log('[UniversalImportWizard] File validation passed')
          toast.success("Validación exitosa. El archivo está listo para importar")
        }
      } else {
        console.log('[UniversalImportWizard] Validation failed:', result.message)
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
    console.log('[UniversalImportWizard] handleImport called')
    console.log('[UniversalImportWizard] File:', file)
    console.log('[UniversalImportWizard] Import endpoint:', importEndpoint)
    
    if (!file) {
      console.log('[UniversalImportWizard] No file selected for import, returning')
      return
    }

    setIsImporting(true)
    console.log('[UniversalImportWizard] Starting import...')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (allowUpdate) {
        formData.append('update_existing', 'true')
        console.log('[UniversalImportWizard] Update existing enabled')
      }

      const token = localStorage.getItem('gde_token')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      console.log('[UniversalImportWizard] API_BASE_URL:', API_BASE_URL)
      console.log('[UniversalImportWizard] Full import URL:', `${API_BASE_URL}${importEndpoint}`)
      
      const response = await fetch(`${API_BASE_URL}${importEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      console.log('[UniversalImportWizard] Import response status:', response.status)
      const result = await response.json()
      console.log('[UniversalImportWizard] Import response result:', result)
      
      console.log("=" .repeat(60))
      console.log("🔍 IMPORT RESULT FROM BACKEND:")
      console.log("Result object:", JSON.stringify(result, null, 2))
      console.log("result.success:", result.success)
      console.log("result.stats:", result.stats)
      console.log("result.results:", result.results)
      console.log("result.data:", result.data)
      console.log("result.data.stats:", result.data?.stats)
      console.log("result.data.stats.total_rows:", result.data?.stats?.total_rows)
      console.log("result.data.stats.successful_rows:", result.data?.stats?.successful_rows)
      console.log("result.data.stats.failed_rows:", result.data?.stats?.failed_rows)
      console.log("=" .repeat(60))

      if (result.success) {
        console.log("✅ Setting import result and changing step to complete")
        // The backend returns {success, message, data} where data contains the actual import result
        // So we need to use result.data if it exists, otherwise use result directly
        const importData = result.data || result
        console.log("📦 Import data to display:", importData)
        console.log("📊 Import data stats:", importData.stats)
        console.log("📊 Import data data.stats:", importData.data?.stats)
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

  // Normalize column name for comparison
  const normalizeColumnName = (colName: string): string => {
    return colName.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[_-]/g, '')
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú/g, 'u')
      .replace(/ñ/g, 'n')
  }

  // Get relevant columns for delivery guides
  const getRelevantColumns = (allColumns: string[]): { relevant: string[], omitted: string[] } => {
    if (importType !== 'delivery_guides') {
      return { relevant: allColumns, omitted: [] }
    }

    // Columnas relevantes que el usuario pidió
    const relevantColumnNames = [
      'numero guia', 'numero guía', 'numeroguia', 'numeroguía', 'numero_guia', 'numero_guía',
      'codigo', 'código', 'guide_number', 'guianumber',
      'estatus', 'status', 'estado',
      'transportadora', 'courier', 'carrier', 'empresa_transporte',
      'producto id', 'productoid', 'product_id', 'producto_id', 'id_producto',
      'sku',
      'producto', 'product_name', 'nombre_producto',
      'cantidad', 'quantity', 'qty'
    ]

    const relevant: string[] = []
    const omitted: string[] = []

    allColumns.forEach(col => {
      const normalized = normalizeColumnName(col)
      const isRelevant = relevantColumnNames.some(relCol => 
        normalized.includes(normalizeColumnName(relCol)) || 
        normalizeColumnName(relCol).includes(normalized)
      )
      
      if (isRelevant) {
        relevant.push(col)
      } else {
        omitted.push(col)
      }
    })

    return { relevant, omitted }
  }

  return (
    <div className="space-y-6 bg-white">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 py-4">
        <div className={`flex items-center space-x-2 ${step === 'upload' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step === 'upload' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-400'
          }`}>
            1
          </div>
          <span className="text-sm">Cargar Archivo</span>
        </div>
        <div className={`w-16 h-0.5 ${step === 'validate' || step === 'import' || step === 'complete' ? 'bg-blue-300' : 'bg-gray-300'}`} />
        <div className={`flex items-center space-x-2 ${step === 'validate' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step === 'validate' ? 'border-blue-600 bg-blue-50 text-blue-600' : 
            step === 'import' || step === 'complete' ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-400'
          }`}>
            2
          </div>
          <span className="text-sm">Validar</span>
        </div>
        <div className={`w-16 h-0.5 ${step === 'import' || step === 'complete' ? 'bg-blue-300' : 'bg-gray-300'}`} />
        <div className={`flex items-center space-x-2 ${(step === 'import' || step === 'complete') ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            (step === 'import' || step === 'complete') ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-400'
          }`}>
            3
          </div>
          <span className="text-sm">Importar</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Importar {moduleName}</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Cargue un archivo CSV o Excel con los datos a importar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div 
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors duration-200 cursor-pointer ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleClick}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isDragging ? 'bg-blue-200' : 'bg-blue-100'
                }`}>
                  <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-700' : 'text-blue-600'}`} />
                </div>
                <div className="space-y-2">
                  <p className={`text-base font-medium ${
                    isDragging ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un archivo aquí o haz clic para seleccionar'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Formatos soportados: CSV, XLSX (máx. 10MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors duration-200"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Seleccionar Archivo
                  </span>
                </Button>
              </div>
            </div>

            {file && (
              <Alert className="border-green-200 bg-green-50">
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <AlertTitle className="text-green-800">Archivo seleccionado</AlertTitle>
                <AlertDescription className="text-green-700">
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {templateEndpoint && (
              <Alert className="border-blue-200 bg-blue-50">
                <Download className="w-4 h-4 text-blue-600" />
                <AlertTitle className="text-blue-800">¿Primera vez importando?</AlertTitle>
                <AlertDescription className="text-blue-700">
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm">Descarga la plantilla con el formato correcto</span>
                    <Button variant="link" size="sm" onClick={handleDownloadTemplate} className="text-blue-600 hover:text-blue-800">
                      Descargar Plantilla
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} className="px-6">
                  Cancelar
                </Button>
              )}
              <Button 
                onClick={() => {
                  console.log('[UniversalImportWizard] Continue button clicked')
                  console.log('[UniversalImportWizard] File available:', !!file)
                  console.log('[UniversalImportWizard] Is validating:', isValidating)
                  handleValidate()
                }} 
                disabled={!file || isValidating}
                className="px-6 bg-blue-600 hover:bg-blue-700"
              >
                {isValidating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Validando...
                  </div>
                ) : (
                  "Continuar"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Validate */}
      {step === 'validate' && validation && (
        <div className="space-y-6">
          {/* File Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Información del Archivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Filas</p>
                  <p className="text-2xl font-bold text-gray-900">{validation.file_info.rows}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Columnas</p>
                  <p className="text-2xl font-bold text-gray-900">{validation.file_info.columns}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Tamaño</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(validation.file_info.file_size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Estado</p>
                  <Badge 
                    variant={validation.valid_for_import ? "default" : "destructive"}
                    className={validation.valid_for_import ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {validation.valid_for_import ? "Válido" : "Con Errores"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {validation.recommendations && validation.recommendations.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Recomendaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {validation.recommendations.map((rec: any, idx: number) => (
                  <Alert 
                    key={idx} 
                    variant={rec.severity === 'critical' ? 'destructive' : 'default'}
                    className={rec.severity === 'critical' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}
                  >
                    {getSeverityIcon(rec.severity)}
                    <AlertTitle className="ml-2 text-sm font-semibold">{rec.type}</AlertTitle>
                    <AlertDescription className="ml-7 text-sm">
                      {rec.message}
                      {rec.details && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Ver detalles</summary>
                          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto border">
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
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Vista Previa (Primeras 10 Filas)</CardTitle>
              {validation && validation.preview_data && validation.preview_data[0] && importType === 'delivery_guides' && (() => {
                const { relevant, omitted } = getRelevantColumns(Object.keys(validation.preview_data[0]))
                if (omitted.length > 0) {
                  return (
                    <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                      <Info className="w-4 h-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">Columnas omitidas</AlertTitle>
                      <AlertDescription className="text-yellow-700 text-sm">
                        Las siguientes columnas no se mostrarán en la vista previa (serán ignoradas en la importación):{' '}
                        <span className="font-semibold">{omitted.join(', ')}</span>
                      </AlertDescription>
                    </Alert>
                  )
                }
                return null
              })()}
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile: Card-based view */}
              <div className="block md:hidden space-y-4 p-4">
                {validation.preview_data.slice(0, 5).map((row: any, idx: number) => {
                  const { relevant } = getRelevantColumns(Object.keys(row))
                  const relevantEntries = Object.entries(row).filter(([key]) => relevant.includes(key))
                  
                  return (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50 space-y-2">
                      {relevantEntries.map(([key, value]: [string, any]) => (
                        <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="text-xs font-semibold text-gray-600 min-w-[120px]">{key}:</span>
                          <span className="text-sm text-gray-900 break-words flex-1">
                            {value !== null && value !== undefined ? String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '') : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>

              {/* Desktop: Table view with limited width and scroll */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                {validation.preview_data[0] && (() => {
                  const { relevant } = getRelevantColumns(Object.keys(validation.preview_data[0]))
                  
                  return (
                    <div className="w-full overflow-x-auto overflow-y-auto" style={{ maxHeight: '500px' }}>
                      <Table className="min-w-full" style={{ width: 'auto' }}>
                        <TableHeader className="bg-gray-50 sticky top-0 z-10">
                          <TableRow>
                            {relevant.map((key) => (
                              <TableHead 
                                key={key} 
                                className="font-semibold text-gray-700 whitespace-nowrap px-3 py-2 text-xs"
                                style={{ width: '150px', minWidth: '120px' }}
                              >
                                <div className="truncate" title={key}>
                                  {key}
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validation.preview_data.map((row: any, idx: number) => (
                            <TableRow key={idx} className="hover:bg-gray-50">
                              {relevant.map((key, cellIdx: number) => (
                                <TableCell 
                                  key={`${idx}-${cellIdx}`} 
                                  className="text-xs px-3 py-2"
                                  style={{ width: '150px', minWidth: '120px' }}
                                >
                                  <div 
                                    className="truncate" 
                                    title={row[key] !== null && row[key] !== undefined ? String(row[key]) : '-'}
                                  >
                                    {row[key] !== null && row[key] !== undefined ? String(row[key]) : '-'}
                                  </div>
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
                })()}
                <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 text-center">
                  <span className="inline-flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Solo se muestran las columnas relevantes para la importación
                  </span>
                </div>
              </div>

              {/* Tablet: Compact table view */}
              <div className="hidden sm:block md:hidden border rounded-lg overflow-hidden">
                {validation.preview_data[0] && (() => {
                  const { relevant } = getRelevantColumns(Object.keys(validation.preview_data[0]))
                  
                  return (
                    <div className="w-full overflow-x-auto overflow-y-auto" style={{ maxHeight: '400px' }}>
                      <Table className="min-w-full text-xs" style={{ width: 'auto' }}>
                        <TableHeader className="bg-gray-50 sticky top-0 z-10">
                          <TableRow>
                            {relevant.map((key) => (
                              <TableHead 
                                key={key} 
                                className="font-semibold text-gray-700 whitespace-nowrap px-2 py-1"
                                style={{ width: '120px', minWidth: '100px' }}
                              >
                                <div className="truncate" title={key}>
                                  {key}
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validation.preview_data.map((row: any, idx: number) => (
                            <TableRow key={idx} className="hover:bg-gray-50">
                              {relevant.map((key, cellIdx: number) => (
                                <TableCell 
                                  key={`${idx}-${cellIdx}`} 
                                  className="px-2 py-1"
                                  style={{ width: '120px', minWidth: '100px' }}
                                >
                                  <div 
                                    className="truncate" 
                                    title={row[key] !== null && row[key] !== undefined ? String(row[key]) : '-'}
                                  >
                                    {row[key] !== null && row[key] !== undefined ? String(row[key]).substring(0, 30) + (String(row[key]).length > 30 ? '...' : '') : '-'}
                                  </div>
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
                })()}
                <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500 text-center">
                  <span className="inline-flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Solo se muestran las columnas relevantes para la importación
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep('upload')} className="px-6">
              Atrás
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!validation.valid_for_import || isImporting}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              {isImporting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importando...
                </div>
              ) : (
                "Importar Datos"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 'complete' && importResult && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-lg font-semibold text-gray-900">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <span>Importación Completada</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-2">Exitosos</p>
                <p className="text-4xl font-bold text-green-600">
                  {importResult.stats?.successful_rows || importResult.results?.successful_rows || importResult.data?.stats?.successful_rows || 0}
                </p>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-700 font-medium mb-2">Fallidos</p>
                <p className="text-4xl font-bold text-red-600">
                  {importResult.stats?.failed_rows || importResult.results?.failed_rows || importResult.data?.stats?.failed_rows || 0}
                </p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-2">Total</p>
                <p className="text-4xl font-bold text-blue-600">
                  {importResult.stats?.total_rows || importResult.results?.total_rows || importResult.data?.stats?.total_rows || 0}
                </p>
              </div>
            </div>

            {importResult.results?.errors && importResult.results.errors.length > 0 && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertTitle className="text-red-800">Algunos registros fallaron</AlertTitle>
                <AlertDescription className="text-red-700">
                  <details className="mt-2">
                    <summary className="cursor-pointer text-red-600 hover:text-red-800 font-medium">Ver errores</summary>
                    <ul className="mt-3 text-sm space-y-2 bg-red-100 p-3 rounded border">
                      {importResult.results.errors.map((error: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-600 font-medium">Fila {error.row}:</span>
                          <span>{error.error}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end pt-4">
              <Button 
                onClick={onSuccess || onCancel}
                className="px-8 bg-green-600 hover:bg-green-700"
              >
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

