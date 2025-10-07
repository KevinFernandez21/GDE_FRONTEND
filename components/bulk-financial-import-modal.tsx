"use client"

import { useState, type ChangeEvent } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, CheckCircle, XCircle, Info, AlertTriangle, FileText, Eye, DollarSign } from "lucide-react"

interface BulkFinancialImportModalProps {
  isOpen: boolean
  onClose: () => void
  type: "costos" | "gastos" | "capital"
}

interface PreviewData {
  [key: string]: string | number
}

interface ColumnMapping {
  detected: string
  mapped: string
  status: "match" | "missing" | "extra" | "unmapped"
}

export default function BulkFinancialImportModal({ isOpen, onClose, type }: BulkFinancialImportModalProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [detectedColumns, setDetectedColumns] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<PreviewData[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [activeTab, setActiveTab] = useState("upload")

  // Columnas recomendadas según el tipo
  const getRecommendedColumns = () => {
    switch (type) {
      case "costos":
        return [
          { key: "fecha", label: "Fecha", required: true },
          { key: "categoria", label: "Categoría", required: true },
          { key: "subcategoria", label: "Subcategoría", required: false },
          { key: "descripcion", label: "Descripción", required: true },
          { key: "monto", label: "Monto", required: true },
          { key: "proveedor", label: "Proveedor", required: false },
          { key: "documento", label: "Documento", required: false },
          { key: "estado", label: "Estado", required: false },
        ]
      case "gastos":
        return [
          { key: "fecha", label: "Fecha", required: true },
          { key: "categoria", label: "Categoría", required: true },
          { key: "subcategoria", label: "Subcategoría", required: false },
          { key: "descripcion", label: "Descripción", required: true },
          { key: "monto", label: "Monto", required: true },
          { key: "proveedor", label: "Proveedor", required: false },
          { key: "documento", label: "Documento", required: false },
          { key: "estado", label: "Estado", required: false },
        ]
      case "capital":
        return [
          { key: "fecha", label: "Fecha", required: true },
          { key: "tipo", label: "Tipo", required: true },
          { key: "descripcion", label: "Descripción", required: true },
          { key: "monto", label: "Monto", required: true },
          { key: "origen", label: "Origen", required: true },
          { key: "documento", label: "Documento", required: false },
          { key: "estado", label: "Estado", required: false },
        ]
      default:
        return []
    }
  }

  const recommendedColumns = getRecommendedColumns()

  // Simulación de datos CSV específicos para cada tipo
  const simulateFinancialData = (filename: string) => {
    switch (type) {
      case "costos":
        return [
          {
            fecha_registro: "2024-01-05",
            categoria_costo: "Costo de Ventas",
            subcategoria_item: "Mercadería",
            descripcion_detalle: "Compra productos electrónicos Q1",
            monto_total: "15000.00",
            proveedor_nombre: "Dell Technologies Inc",
            numero_documento: "FC-001-2024",
            estado_aprobacion: "Aprobado"
          },
          {
            fecha_registro: "2024-01-04",
            categoria_costo: "Gastos Operativos",
            subcategoria_item: "Transporte",
            descripcion_detalle: "Flete mercadería importada",
            monto_total: "2500.00",
            proveedor_nombre: "Transportes Logística ABC",
            numero_documento: "FC-002-2024",
            estado_aprobacion: "Pendiente"
          },
          {
            fecha_registro: "2024-01-03",
            categoria_costo: "Gastos Financieros",
            subcategoria_item: "Intereses",
            descripcion_detalle: "Intereses préstamo bancario",
            monto_total: "850.00",
            proveedor_nombre: "Banco Nacional",
            numero_documento: "NB-001-2024",
            estado_aprobacion: "Pagado"
          }
        ]
      case "gastos":
        return [
          {
            fecha_movimiento: "2024-01-05",
            tipo_gasto: "Gastos Administrativos",
            detalle_subcategoria: "Servicios Básicos",
            descripcion_gasto: "Electricidad oficina principal enero",
            valor_gasto: "450.00",
            proveedor_servicio: "Empresa Eléctrica Regional",
            documento_referencia: "FE-003-2024",
            estado_pago: "Pagado"
          },
          {
            fecha_movimiento: "2024-01-04",
            tipo_gasto: "Gastos de Ventas",
            detalle_subcategoria: "Marketing Digital",
            descripcion_gasto: "Campaña publicitaria redes sociales",
            valor_gasto: "1200.00",
            proveedor_servicio: "Agencia Digital Marketing Plus",
            documento_referencia: "FS-004-2024",
            estado_pago: "Aprobado"
          },
          {
            fecha_movimiento: "2024-01-03",
            tipo_gasto: "Gastos Generales",
            detalle_subcategoria: "Mantenimiento",
            descripcion_gasto: "Mantenimiento equipos oficina",
            valor_gasto: "320.00",
            proveedor_servicio: "Servicios Técnicos Integrales",
            documento_referencia: "FM-005-2024",
            estado_pago: "Pendiente"
          }
        ]
      case "capital":
        return [
          {
            fecha_operacion: "2024-01-01",
            tipo_capital: "Aporte de Capital",
            descripcion_movimiento: "Aporte inicial socio fundador A",
            monto_operacion: "50000.00",
            origen_fondos: "Socio A - Juan Pérez",
            documento_legal: "AC-001-2024",
            estado_registro: "Registrado"
          },
          {
            fecha_operacion: "2024-01-15",
            tipo_capital: "Préstamo Bancario",
            descripcion_movimiento: "Préstamo capital de trabajo mediano plazo",
            monto_operacion: "25000.00",
            origen_fondos: "Banco Nacional Comercial",
            documento_legal: "PB-001-2024",
            estado_registro: "Activo"
          },
          {
            fecha_operacion: "2024-01-20",
            tipo_capital: "Inversión",
            descripcion_movimiento: "Inversión en maquinaria y equipos",
            monto_operacion: "18000.00",
            origen_fondos: "Inversionista Estratégico B",
            documento_legal: "INV-002-2024",
            estado_registro: "Pendiente"
          }
        ]
      default:
        return []
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsProcessing(true)
      setFileName(file.name)
      setFileError(null)

      // Validar tipo de archivo
      if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        setFileError("Formato de archivo no soportado. Por favor, sube un archivo CSV o Excel.")
        setDetectedColumns([])
        setPreviewData([])
        setFileName(null)
        setIsProcessing(false)
        return
      }

      // Simular procesamiento del archivo
      setTimeout(() => {
        const simulatedData = simulateFinancialData(file.name)
        const columns = Object.keys(simulatedData[0])

        setDetectedColumns(columns)
        setPreviewData(simulatedData)

        // Crear mapeos automáticos
        const mappings: ColumnMapping[] = columns.map((col) => {
          const normalizedCol = col.toLowerCase().replace(/[^a-z0-9]/g, "")
          const recommendedCol = recommendedColumns.find((rec) => {
            const normalizedRec = rec.key.toLowerCase().replace(/[^a-z0-9]/g, "")
            return normalizedCol.includes(normalizedRec) || normalizedRec.includes(normalizedCol)
          })

          return {
            detected: col,
            mapped: recommendedCol?.key || "",
            status: recommendedCol ? "match" : "extra",
          }
        })

        setColumnMappings(mappings)
        setIsProcessing(false)
        setActiveTab("preview")
      }, 1500) // Simular tiempo de procesamiento
    } else {
      setFileName(null)
      setDetectedColumns([])
      setPreviewData([])
      setFileError(null)
      setColumnMappings([])
    }
  }

  const updateColumnMapping = (detectedColumn: string, mappedColumn: string) => {
    setColumnMappings((prev) =>
      prev.map((mapping) =>
        mapping.detected === detectedColumn
          ? { ...mapping, mapped: mappedColumn, status: mappedColumn ? "match" : "unmapped" }
          : mapping,
      ),
    )
  }

  const getValidationSummary = () => {
    const requiredColumns = recommendedColumns.filter((col) => col.required)
    const mappedRequired = requiredColumns.filter((req) =>
      columnMappings.some((mapping) => mapping.mapped === req.key && mapping.status === "match"),
    )

    return {
      total: recommendedColumns.length,
      required: requiredColumns.length,
      mappedRequired: mappedRequired.length,
      isValid: mappedRequired.length === requiredColumns.length,
    }
  }

  const handleImport = () => {
    const validation = getValidationSummary()
    if (!validation.isValid) {
      alert("Por favor, mapea todas las columnas requeridas antes de importar.")
      return
    }

    // Aquí iría la lógica real de importación
    const typeLabels = {
      costos: "costos",
      gastos: "gastos", 
      capital: "movimientos de capital"
    }
    alert(`Importación exitosa: ${previewData.length} ${typeLabels[type]} procesados.`)
    onClose()
  }

  const resetModal = () => {
    setFileName(null)
    setDetectedColumns([])
    setPreviewData([])
    setFileError(null)
    setColumnMappings([])
    setActiveTab("upload")
  }

  const validation = getValidationSummary()
  
  const getTypeInfo = () => {
    switch (type) {
      case "costos":
        return {
          title: "Importar Costos Masivamente",
          description: "Sube un archivo CSV o Excel con datos de costos para añadir múltiples registros al sistema.",
          format: "fecha, categoría, subcategoría, descripción, monto, proveedor, documento, estado, etc."
        }
      case "gastos":
        return {
          title: "Importar Gastos Masivamente", 
          description: "Sube un archivo CSV o Excel con datos de gastos operativos, administrativos y de ventas.",
          format: "fecha, tipo de gasto, subcategoría, descripción, monto, proveedor, documento, estado, etc."
        }
      case "capital":
        return {
          title: "Importar Movimientos de Capital",
          description: "Sube un archivo CSV o Excel con aportes de capital, préstamos y movimientos financieros.",
          format: "fecha, tipo, descripción, monto, origen, documento, estado, etc."
        }
      default:
        return {
          title: "Importar Datos Financieros",
          description: "Importación masiva de datos financieros",
          format: "Formato estándar"
        }
    }
  }

  const typeInfo = getTypeInfo()

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetModal()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-[95vw] lg:max-w-[1200px] max-h-[90vh] w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            {typeInfo.title}
          </DialogTitle>
          <DialogDescription>
            {typeInfo.description}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" disabled={isProcessing}>
              <Upload className="w-4 h-4 mr-2" />
              Subir Archivo
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!previewData.length}>
              <Eye className="w-4 h-4 mr-2" />
              Previsualizar
            </TabsTrigger>
            <TabsTrigger value="mapping" disabled={!detectedColumns.length}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mapear Columnas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file" className="text-right">
                  Archivo
                </Label>
                <Input
                  id="file"
                  type="file"
                  className="col-span-3"
                  onChange={handleFileChange}
                  accept=".csv, .xlsx, .xls"
                  disabled={isProcessing}
                />
              </div>

              {isProcessing && (
                <div className="text-sm text-blue-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Procesando archivo...
                </div>
              )}

              {fileName && !fileError && !isProcessing && (
                <div className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Archivo procesado: {fileName} ({previewData.length} registros encontrados)
                </div>
              )}

              {fileError && (
                <div className="text-sm text-red-500 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  {fileError}
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Formato Recomendado</AlertTitle>
                <AlertDescription>
                  Tu archivo debe incluir columnas como: {typeInfo.format} 
                  Se detectarán automáticamente las columnas y se te permitirá mapearlas.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Previsualización de Datos</h4>
                <Badge variant="secondary">{previewData.length} registros</Badge>
              </div>

              <ScrollArea className="h-[350px] w-full rounded-md border">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {detectedColumns.map((col, index) => (
                          <TableHead key={index} className="min-w-[100px] max-w-[150px] truncate">
                            <div className="truncate" title={col}>
                              {col}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          {detectedColumns.map((col, colIndex) => (
                            <TableCell key={colIndex} className="font-mono text-xs min-w-[100px] max-w-[150px]">
                              <div className="truncate" title={String(row[col])}>
                                {row[col]}
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Vista Previa</AlertTitle>
                <AlertDescription>
                  Esta es una muestra de los datos financieros que se importarán. Revisa que la información sea correcta antes de continuar.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Mapeo de Columnas</h4>
                <div className="flex gap-2">
                  <Badge variant={validation.isValid ? "default" : "destructive"}>
                    {validation.mappedRequired}/{validation.required} requeridas
                  </Badge>
                  <Badge variant="secondary">
                    {columnMappings.filter((m) => m.status === "match").length}/{columnMappings.length} mapeadas
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium mb-3">Columnas Detectadas</h5>
                  <ScrollArea className="h-[250px] w-full rounded-md border p-3">
                    <div className="space-y-2">
                      {columnMappings.map((mapping, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 border rounded"
                        >
                          <span className="font-mono text-xs truncate flex-1" title={mapping.detected}>
                            {mapping.detected}
                          </span>
                          <Select
                            value={mapping.mapped || "default"}
                            onValueChange={(value) => updateColumnMapping(mapping.detected, value)}
                          >
                            <SelectTrigger className="w-full sm:w-[160px]">
                              <SelectValue placeholder="Mapear a..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Sin mapear</SelectItem>
                              {recommendedColumns.map((col) => (
                                <SelectItem key={col.key} value={col.key}>
                                  {col.label} {col.required && "*"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div>
                  <h5 className="font-medium mb-3">Columnas del Sistema</h5>
                  <ScrollArea className="h-[250px] w-full rounded-md border p-3">
                    <div className="space-y-2">
                      {recommendedColumns.map((col) => {
                        const isMapped = columnMappings.some((m) => m.mapped === col.key && m.status === "match")
                        return (
                          <div key={col.key} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2 flex-1">
                              {isMapped ? (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : col.required ? (
                                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                              ) : (
                                <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                              <span className="text-xs truncate">
                                {col.label}
                                {col.required && <span className="text-red-500 ml-1">*</span>}
                              </span>
                            </div>
                            <Badge
                              variant={isMapped ? "default" : col.required ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {isMapped ? "OK" : col.required ? "Req" : "Opc"}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {!validation.isValid && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Mapeo Incompleto</AlertTitle>
                  <AlertDescription className="text-red-700">
                    Debes mapear todas las columnas requeridas (marcadas con *) antes de poder importar los datos.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2">
          <div className="flex gap-2 order-2 sm:order-1">
            <Button
              variant="outline"
              onClick={() => {
                resetModal()
                onClose()
              }}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            {activeTab === "upload" && fileName && !isProcessing && (
              <Button onClick={() => setActiveTab("preview")} className="flex-1 sm:flex-none">
                <Eye className="w-4 h-4 mr-2" />
                Previsualizar
              </Button>
            )}
            {activeTab === "preview" && (
              <Button onClick={() => setActiveTab("mapping")} className="flex-1 sm:flex-none">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mapear Columnas
              </Button>
            )}
          </div>

          {activeTab === "mapping" && (
            <Button
              onClick={handleImport}
              disabled={!validation.isValid}
              className="bg-green-600 hover:bg-green-700 order-1 sm:order-2 w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar {previewData.length} Registros
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}