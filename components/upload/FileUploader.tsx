"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle, 
  XCircle,
  Download,
  AlertCircle,
  Trash2
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import Papa from "papaparse"

interface UploadedFile {
  file: File
  status: 'uploading' | 'success' | 'error'
  progress: number
  data?: any[]
  errors?: string[]
}

interface DispatchGuideData {
  guide_number: string
  client_name: string
  client_address: string
  client_phone?: string
  items: string
  notes?: string
}

export default function FileUploader() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [processingResults, setProcessingResults] = useState<{
    total: number
    success: number
    errors: string[]
  } | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      status: 'uploading' as const,
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Procesar cada archivo
    newFiles.forEach((uploadedFile, index) => {
      processFile(uploadedFile.file, uploadedFiles.length + index)
    })
  }, [uploadedFiles.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const processFile = async (file: File, fileIndex: number) => {
    try {
      // Simular progreso de carga
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 100))
        updateFileProgress(fileIndex, progress)
      }

      let data: any[] = []
      const errors: string[] = []

      if (file.name.endsWith('.csv')) {
        data = await parseCSV(file)
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        data = await parseExcel(file)
      }

      // Validar datos
      const { validData, validationErrors } = validateDispatchGuides(data)
      errors.push(...validationErrors)

      updateFileStatus(fileIndex, 'success', validData, errors)
      toast.success(`Archivo ${file.name} procesado exitosamente`)
      
    } catch (error) {
      console.error('Error processing file:', error)
      updateFileStatus(fileIndex, 'error', undefined, [`Error procesando archivo: ${error}`])
      toast.error(`Error procesando ${file.name}`)
    }
  }

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data)
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  }

  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Error reading file'))
      reader.readAsBinaryString(file)
    })
  }

  const validateDispatchGuides = (data: any[]): { validData: DispatchGuideData[], validationErrors: string[] } => {
    const validData: DispatchGuideData[] = []
    const validationErrors: string[] = []

    data.forEach((row, index) => {
      const rowNumber = index + 2 // +1 for 0-based index, +1 for header row
      
      // Validar campos requeridos
      if (!row.guide_number || !row.client_name || !row.client_address) {
        validationErrors.push(`Fila ${rowNumber}: Faltan campos obligatorios (guide_number, client_name, client_address)`)
        return
      }

      // Normalizar datos
      const guide: DispatchGuideData = {
        guide_number: String(row.guide_number).trim(),
        client_name: String(row.client_name).trim(),
        client_address: String(row.client_address).trim(),
        client_phone: row.client_phone ? String(row.client_phone).trim() : undefined,
        items: row.items ? String(row.items).trim() : 'Sin especificar',
        notes: row.notes ? String(row.notes).trim() : undefined
      }

      // Validaciones adicionales
      if (guide.guide_number.length < 3) {
        validationErrors.push(`Fila ${rowNumber}: Número de guía muy corto`)
      }

      if (guide.client_name.length < 2) {
        validationErrors.push(`Fila ${rowNumber}: Nombre de cliente muy corto`)
      }

      validData.push(guide)
    })

    return { validData, validationErrors }
  }

  const updateFileProgress = (fileIndex: number, progress: number) => {
    setUploadedFiles(prev => prev.map((file, index) => 
      index === fileIndex ? { ...file, progress } : file
    ))
  }

  const updateFileStatus = (fileIndex: number, status: 'success' | 'error', data?: any[], errors?: string[]) => {
    setUploadedFiles(prev => prev.map((file, index) => 
      index === fileIndex ? { ...file, status, data, errors } : file
    ))
  }

  const removeFile = (fileIndex: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== fileIndex))
  }

  const processAllFiles = async () => {
    const allData: DispatchGuideData[] = []
    const allErrors: string[] = []

    uploadedFiles.forEach(file => {
      if (file.status === 'success' && file.data) {
        allData.push(...file.data)
      }
      if (file.errors) {
        allErrors.push(...file.errors)
      }
    })

    setProcessingResults({
      total: allData.length,
      success: allData.length - allErrors.length,
      errors: allErrors
    })

    // Aquí enviarías los datos al backend
    toast.success(`Procesados ${allData.length} registros de guías de despacho`)
  }

  const downloadTemplate = () => {
    const template = [
      {
        guide_number: 'GD-2024-001',
        client_name: 'Empresa Cliente S.A.',
        client_address: 'Av. Principal 123, Santiago, Chile',
        client_phone: '+56 9 1234 5678',
        items: 'Producto 1 (x5), Producto 2 (x3)',
        notes: 'Entregar en horario de oficina'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'plantilla_guias_despacho.xlsx')
    
    toast.success('Plantilla descargada')
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Cargar Guías de Despacho
          </CardTitle>
          <CardDescription className="text-slate-400">
            Importa guías desde archivos CSV o Excel (.xlsx)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Área de arrastre */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-400">Suelta los archivos aquí...</p>
            ) : (
              <>
                <p className="text-slate-300 mb-2">
                  Arrastra archivos aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-slate-500">
                  Soporta archivos CSV y Excel (.xlsx, .xls) hasta 10MB
                </p>
              </>
            )}
          </div>

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar Plantilla
            </Button>

            {uploadedFiles.length > 0 && (
              <Button
                onClick={processAllFiles}
                className="bg-green-600 hover:bg-green-700"
              >
                Procesar Archivos ({uploadedFiles.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de archivos subidos */}
      {uploadedFiles.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Archivos Subidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFiles.map((uploadedFile, index) => (
              <div key={index} className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <FileSpreadsheet className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">{uploadedFile.file.name}</p>
                      <p className="text-sm text-slate-400">
                        {Math.round(uploadedFile.file.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {uploadedFile.status === 'success' && (
                      <Badge className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Exitoso
                      </Badge>
                    )}
                    {uploadedFile.status === 'error' && (
                      <Badge className="bg-red-600">
                        <XCircle className="mr-1 h-3 w-3" />
                        Error
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {uploadedFile.status === 'uploading' && (
                  <Progress value={uploadedFile.progress} className="mb-2" />
                )}

                {uploadedFile.status === 'success' && uploadedFile.data && (
                  <p className="text-sm text-green-400">
                    ✓ {uploadedFile.data.length} registros procesados
                  </p>
                )}

                {uploadedFile.errors && uploadedFile.errors.length > 0 && (
                  <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-600">
                    <p className="text-red-400 text-sm font-medium mb-1">
                      <AlertCircle className="inline mr-1 h-3 w-3" />
                      Errores encontrados:
                    </p>
                    <ul className="text-xs text-red-300 space-y-1">
                      {uploadedFile.errors.slice(0, 3).map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                      {uploadedFile.errors.length > 3 && (
                        <li>• Y {uploadedFile.errors.length - 3} errores más...</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Resultados del procesamiento */}
      {processingResults && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Resultados del Procesamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <p className="text-2xl font-bold text-blue-400">{processingResults.total}</p>
                <p className="text-sm text-slate-400">Total Procesados</p>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <p className="text-2xl font-bold text-green-400">{processingResults.success}</p>
                <p className="text-sm text-slate-400">Exitosos</p>
              </div>
              <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                <p className="text-2xl font-bold text-red-400">{processingResults.errors.length}</p>
                <p className="text-sm text-slate-400">Con Errores</p>
              </div>
            </div>

            {processingResults.errors.length > 0 && (
              <div className="p-4 bg-red-900/20 rounded-lg border border-red-600">
                <h4 className="text-red-400 font-medium mb-2">Errores de Validación:</h4>
                <div className="max-h-32 overflow-y-auto">
                  <ul className="text-sm text-red-300 space-y-1">
                    {processingResults.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Guía de formato */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Formato de Archivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-medium mb-2">Columnas Requeridas:</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• <code className="bg-slate-700 px-2 py-1 rounded">guide_number</code> - Número de guía único</li>
                <li>• <code className="bg-slate-700 px-2 py-1 rounded">client_name</code> - Nombre del cliente</li>
                <li>• <code className="bg-slate-700 px-2 py-1 rounded">client_address</code> - Dirección de entrega</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-2">Columnas Opcionales:</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• <code className="bg-slate-700 px-2 py-1 rounded">client_phone</code> - Teléfono de contacto</li>
                <li>• <code className="bg-slate-700 px-2 py-1 rounded">items</code> - Descripción de productos</li>
                <li>• <code className="bg-slate-700 px-2 py-1 rounded">notes</code> - Observaciones adicionales</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}