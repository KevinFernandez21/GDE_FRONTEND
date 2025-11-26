"use client"

import { Upload, DollarSign, TrendingUp, FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import UniversalImportWizard from "@/components/shared/universal-import-wizard"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface Cost {
  id: string
  tipo: string
  descripcion: string
  monto: number
  fecha: string
  guia_id?: string
  guia_codigo?: string
  categoria?: string
  proveedor?: string
  created_at: string
}

interface CostSummary {
  total_costos: number
  total_gastos: number
  total_general: number
  cantidad_costos: number
  cantidad_gastos: number
  detalle: Array<{
    tipo: string
    cantidad: number
    total: number
    promedio: number
  }>
}

export default function CostManagement() {
  const [costs, setCosts] = useState<Cost[]>([])
  const [summary, setSummary] = useState<CostSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showImport, setShowImport] = useState(false)
  const [activeTab, setActiveTab] = useState<"costos" | "gastos" | "all">("all")

  useEffect(() => {
    fetchCosts()
    fetchSummary()
  }, [activeTab])

  const fetchCosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (activeTab === "costos") {
        params.append("tipo", "costo")
      } else if (activeTab === "gastos") {
        params.append("tipo", "gasto")
      }
      
      const response = await apiClient.request(`/costs?${params.toString()}`)
      
      if (response.data?.items) {
        setCosts(response.data.items)
      }
    } catch (error) {
      console.error("Error fetching costs:", error)
      toast.error("Error al cargar costos")
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await apiClient.request("/costs/summary")
      
      if (response.data) {
        setSummary(response.data)
      }
    } catch (error) {
      console.error("Error fetching summary:", error)
    }
  }

  const handleImportSuccess = () => {
    setShowImport(false)
    fetchCosts()
    fetchSummary()
    toast.success("Costos importados exitosamente")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Costos y Gastos</h2>
          <p className="text-muted-foreground">
            Administra costos y gastos del sistema con separación automática
          </p>
        </div>
        <Button onClick={() => setShowImport(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Importar Costos
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Total Costos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.total_costos)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.cantidad_costos} registro(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                Total Gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.total_gastos)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.cantidad_gastos} registro(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.total_general)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.cantidad_costos + summary.cantidad_gastos} registro(s) total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="costos">Costos</TabsTrigger>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registros</CardTitle>
              <CardDescription>
                Lista de {activeTab === "all" ? "costos y gastos" : activeTab}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <p>Cargando registros...</p>
                </div>
              ) : costs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No se encontraron registros</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Guía</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Proveedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costs.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell>
                          <Badge variant={cost.tipo === "costo" ? "default" : "outline"}>
                            {cost.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{cost.descripcion}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(cost.monto)}
                        </TableCell>
                        <TableCell>
                          {new Date(cost.fecha).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {cost.guia_codigo ? (
                            <span className="font-mono text-sm">{cost.guia_codigo}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{cost.categoria || "-"}</TableCell>
                        <TableCell>{cost.proveedor || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Costos y Gastos</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV o Excel con los costos y gastos. El sistema separará automáticamente costos de gastos.
            </DialogDescription>
          </DialogHeader>
          <UniversalImportWizard
            validateEndpoint="/costs/import/validate"
            importEndpoint="/costs/import"
            importType="costs"
            moduleName="Costos y Gastos"
            onSuccess={handleImportSuccess}
            onCancel={() => setShowImport(false)}
            allowUpdate={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

