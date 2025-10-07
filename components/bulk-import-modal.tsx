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
import { Upload, CheckCircle, XCircle, Info, AlertTriangle, FileText, Eye } from "lucide-react"

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PreviewData {
  [key: string]: string | number
}

interface ColumnMapping {
  detected: string
  mapped: string
  status: "match" | "missing" | "extra" | "unmapped"
}

export default function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [detectedColumns, setDetectedColumns] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<PreviewData[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [activeTab, setActiveTab] = useState("upload")

  // Columnas recomendadas basadas en la estructura de tu inventario
  const recommendedColumns = [
    { key: "codigo", label: "Código", required: true },
    { key: "producto", label: "Producto", required: true },
    { key: "familia", label: "Familia", required: false },
    { key: "subcategoria", label: "Subcategoría", required: false },
    { key: "proveedor", label: "Proveedor", required: false },
    { key: "marca", label: "Marca", required: false },
    { key: "stockDisponible", label: "Stock Disponible", required: true },
    { key: "ubicacion", label: "Ubicación", required: false },
    { key: "precio", label: "Precio", required: true },
    { key: "estado", label: "Estado", required: false },
  ]

  // Simulación de datos CSV para demostración
  const simulateCSVData = (filename: string) => {
    const sampleData = [
      {
        producto: "Laptop Dell Inspiron 15",
        codigo: "LAP001",
        cantidad: "25",
        ubicacion_bodega: "A-01-15",
        precio_unitario: "850.00",
        categoria: "Electrónicos",
        proveedor_nombre: "Dell Inc",
        marca: "Dell",
        estado_producto: "Activo",
      },
      {
        producto: "Mouse Logitech MX Master",
        codigo: "MOU002",
        cantidad: "120",
        ubicacion_bodega: "B-02-08",
        precio_unitario: "65.00",
        categoria: "Accesorios",
        proveedor_nombre: "Logitech",
        marca: "Logitech",
        estado_producto: "Activo",
      },
      {
        producto: "Monitor Samsung 24 pulgadas",
        codigo: "MON003",
        cantidad: "8",
        ubicacion_bodega: "A-03-22",
        precio_unitario: "280.00",
        categoria: "Electrónicos",
        proveedor_nombre: "Samsung",
        marca: "Samsung",
        estado_producto: "Bajo Stock",
      },
      {
        producto: "Teclado Mecánico Corsair",
        codigo: "TEC004",
        cantidad: "45",
        ubicacion_bodega: "B-01-12",
        precio_unitario: "120.00",
        categoria: "Accesorios",
        proveedor_nombre: "Corsair",
        marca: "Corsair",
        estado_producto: "Activo",
      },
      {
        producto: "Impresora HP LaserJet",
        codigo: "IMP005",
        cantidad: "12",
        ubicacion_bodega: "C-01-05",
        precio_unitario: "450.00",
        categoria: "Oficina",
        proveedor_nombre: "HP Inc",
        marca: "HP",
        estado_producto: "Activo",
      },
    ]
    return sampleData
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
        const simulatedData = simulateCSVData(file.name)
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
    alert(`Importación exitosa: ${previewData.length} productos procesados.`)
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
            <FileText className="w-5 h-5 text-blue-600" />
            Importar Productos Masivamente
          </DialogTitle>
          <DialogDescription>
            Sube un archivo CSV o Excel para añadir múltiples productos a tu inventario.
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
                  Tu archivo debe incluir columnas como: código, producto, cantidad, precio, ubicación, etc. Se
                  detectarán automáticamente las columnas y se te permitirá mapearlas.
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
                  {" "}
                  {/* Contenedor con ancho mínimo */}
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
                  Esta es una muestra de los datos que se importarán. Revisa que la información sea correcta antes de
                  continuar.
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
              Importar {previewData.length} Productos
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
