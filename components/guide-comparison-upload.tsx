"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileUp, CheckCircle2, XCircle, AlertCircle, Download, Upload } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface ComparisonResult {
  summary: {
    total_rows: number
    processed: number
    matches: number
    mismatches: number
    not_found: number
    errors: number
    match_percentage: number
  }
  matches: Array<{
    row: number
    numero_guia: string
    fecha_archivo: string
    fecha_guia: string
    tipo_movimiento: string
    cliente: string
    estado: string
    guide_id: string
  }>
  mismatches: Array<{
    row: number
    numero_guia: string
    fecha_archivo: string
    fecha_guia: string
    tipo_movimiento: string
    cliente: string
    estado: string
    guide_id: string
    difference: string
  }>
  not_found: Array<{
    row: number
    numero_guia: string
    fecha: string
    tipo_movimiento: string
  }>
  errors: Array<{
    row: number
    numero_guia?: string
    error: string
  }>
  filename: string
  processed_at: string
}

export default function GuideComparisonUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<ComparisonResult | null>(null)
  const [activeTab, setActiveTab] = useState<"matches" | "mismatches" | "not_found" | "errors">("matches")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const ext = selectedFile.name.toLowerCase().split('.').pop()
      if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
        toast.error("Solo se permiten archivos CSV o Excel (.csv, .xlsx, .xls)")
        return
      }
      setFile(selectedFile)
      setResults(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecciona un archivo primero")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await apiClient.request("/delivery-guides/compare-file", {
        method: "POST",
        body: formData,
      })

      if (response.data) {
        setResults(response.data)
        toast.success("Archivo procesado correctamente")
      } else {
        toast.error(response.error || "Error al procesar el archivo")
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.message || "Error al cargar el archivo")
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusBadge = (status: string, count: number) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      matches: { variant: "default", icon: CheckCircle2 },
      mismatches: { variant: "secondary", icon: AlertCircle },
      not_found: { variant: "outline", icon: XCircle },
      errors: { variant: "destructive", icon: XCircle },
    }

    const config = variants[status] || { variant: "default", icon: null }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {count}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Comparación de Guías</h2>
          <p className="text-muted-foreground">
            Carga archivos CSV o Excel para comparar con las guías de despacho existentes
          </p>
        </div>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Cargar Archivo
          </CardTitle>
          <CardDescription>
            El archivo debe contener las columnas: <strong>fecha</strong>, <strong>numero_guia</strong>, y <strong>tipo_movimiento</strong> (entrada/salida)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input">
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Seleccionar archivo
                  </span>
                </Button>
              </label>
            </div>
            {file && (
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                </p>
              </div>
            )}
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <FileUp className="w-4 h-4" />
                  Comparar
                </>
              )}
            </Button>
          </div>

          {/* Format Help */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Formato esperado del archivo:</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• <strong>fecha</strong>: Fecha del movimiento (ej: 2024-01-15)</p>
              <p>• <strong>numero_guia</strong>: Número de guía de despacho</p>
              <p>• <strong>tipo_movimiento</strong>: Debe ser "entrada" o "salida"</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de la Comparación</CardTitle>
            <CardDescription>
              Archivo: {results.filename} | Procesado: {new Date(results.processed_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{results.summary.matches}</div>
                <div className="text-sm text-muted-foreground">Coincidencias</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{results.summary.mismatches}</div>
                <div className="text-sm text-muted-foreground">Fechas No Coinciden</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{results.summary.not_found}</div>
                <div className="text-sm text-muted-foreground">No Encontradas</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">{results.summary.errors}</div>
                <div className="text-sm text-muted-foreground">Errores</div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Porcentaje de coincidencias: <strong>{results.summary.match_percentage}%</strong>
              </p>
            </div>

            {/* Tabs for different result types */}
            <div className="border-b">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("matches")}
                  className={`px-4 py-2 border-b-2 transition-colors ${
                    activeTab === "matches"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Coincidencias {getStatusBadge("matches", results.summary.matches)}
                </button>
                <button
                  onClick={() => setActiveTab("mismatches")}
                  className={`px-4 py-2 border-b-2 transition-colors ${
                    activeTab === "mismatches"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Fechas No Coinciden {getStatusBadge("mismatches", results.summary.mismatches)}
                </button>
                <button
                  onClick={() => setActiveTab("not_found")}
                  className={`px-4 py-2 border-b-2 transition-colors ${
                    activeTab === "not_found"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  No Encontradas {getStatusBadge("not_found", results.summary.not_found)}
                </button>
                <button
                  onClick={() => setActiveTab("errors")}
                  className={`px-4 py-2 border-b-2 transition-colors ${
                    activeTab === "errors"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Errores {getStatusBadge("errors", results.summary.errors)}
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {activeTab === "matches" && (
                      <>
                        <TableHead>Fila</TableHead>
                        <TableHead>Número Guía</TableHead>
                        <TableHead>Fecha Archivo</TableHead>
                        <TableHead>Fecha Guía</TableHead>
                        <TableHead>Tipo Movimiento</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Estado</TableHead>
                      </>
                    )}
                    {activeTab === "mismatches" && (
                      <>
                        <TableHead>Fila</TableHead>
                        <TableHead>Número Guía</TableHead>
                        <TableHead>Fecha Archivo</TableHead>
                        <TableHead>Fecha Guía</TableHead>
                        <TableHead>Tipo Movimiento</TableHead>
                        <TableHead>Diferencia</TableHead>
                      </>
                    )}
                    {activeTab === "not_found" && (
                      <>
                        <TableHead>Fila</TableHead>
                        <TableHead>Número Guía</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo Movimiento</TableHead>
                      </>
                    )}
                    {activeTab === "errors" && (
                      <>
                        <TableHead>Fila</TableHead>
                        <TableHead>Número Guía</TableHead>
                        <TableHead>Error</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTab === "matches" && results.matches.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No hay coincidencias
                      </TableCell>
                    </TableRow>
                  )}
                  {activeTab === "matches" &&
                    results.matches.map((match, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{match.row}</TableCell>
                        <TableCell className="font-medium">{match.numero_guia}</TableCell>
                        <TableCell>{match.fecha_archivo}</TableCell>
                        <TableCell>{match.fecha_guia}</TableCell>
                        <TableCell>
                          <Badge variant={match.tipo_movimiento === "entrada" ? "default" : "secondary"}>
                            {match.tipo_movimiento}
                          </Badge>
                        </TableCell>
                        <TableCell>{match.cliente}</TableCell>
                        <TableCell>{match.estado}</TableCell>
                      </TableRow>
                    ))}

                  {activeTab === "mismatches" && results.mismatches.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay fechas que no coincidan
                      </TableCell>
                    </TableRow>
                  )}
                  {activeTab === "mismatches" &&
                    results.mismatches.map((mismatch, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{mismatch.row}</TableCell>
                        <TableCell className="font-medium">{mismatch.numero_guia}</TableCell>
                        <TableCell>{mismatch.fecha_archivo}</TableCell>
                        <TableCell>{mismatch.fecha_guia}</TableCell>
                        <TableCell>
                          <Badge variant={mismatch.tipo_movimiento === "entrada" ? "default" : "secondary"}>
                            {mismatch.tipo_movimiento}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-yellow-600">{mismatch.difference}</TableCell>
                      </TableRow>
                    ))}

                  {activeTab === "not_found" && results.not_found.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Todas las guías fueron encontradas
                      </TableCell>
                    </TableRow>
                  )}
                  {activeTab === "not_found" &&
                    results.not_found.map((notFound, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{notFound.row}</TableCell>
                        <TableCell className="font-medium">{notFound.numero_guia}</TableCell>
                        <TableCell>{notFound.fecha}</TableCell>
                        <TableCell>
                          <Badge variant={notFound.tipo_movimiento === "entrada" ? "default" : "secondary"}>
                            {notFound.tipo_movimiento}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}

                  {activeTab === "errors" && results.errors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No hay errores
                      </TableCell>
                    </TableRow>
                  )}
                  {activeTab === "errors" &&
                    results.errors.map((error, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{error.row}</TableCell>
                        <TableCell>{error.numero_guia || "-"}</TableCell>
                        <TableCell className="text-red-600">{error.error}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

            {(results.matches.length > 100 ||
              results.mismatches.length > 100 ||
              results.not_found.length > 100 ||
              results.errors.length > 100) && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Mostrando los primeros 100 resultados de cada categoría</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

