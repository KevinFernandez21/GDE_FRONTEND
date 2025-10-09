"use client"

import { useState, useEffect } from "react"
import { Package, AlertTriangle, Truck, DollarSign, RotateCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

export default function DashboardModule() {
  const [dashboardData, setDashboardData] = useState({
    stock_metrics: {
      disponible: 0,
      comprometido: 0,
      agotados: 0,
      total_productos: 0
    },
    financial_metrics: {
      valor_inventario: 0,
      valor_venta_potencial: 0
    },
    critical_products: [],
    recent_movements: []
  })
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('No se encontró token de autenticación')
        return
      }

      const response = await fetch('http://localhost:8000/api/v1/dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setDashboardData(result.data)
      } else {
        const errorData = await response.json()
        toast.error(errorData.detail || 'Error al cargar datos del dashboard')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return (
    <div className="p-6 space-y-6">
      {loading && (
        <div className="text-center py-8">
          <p>Cargando datos del dashboard...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Alertas Críticas */}
          {dashboardData.critical_products.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Productos con Stock Crítico</AlertTitle>
          <AlertDescription className="text-red-700">
            Hay {dashboardData.critical_products.length} productos con stock por debajo del mínimo requerido. Revisar inmediatamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Disponible</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardData.stock_metrics.disponible.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
            <Progress value={70} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Comprometido</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboardData.stock_metrics.comprometido.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+5% desde la semana pasada</p>
            <Progress value={30} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Agotados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dashboardData.stock_metrics.agotados.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Requieren reposición urgente</p>
            <Progress value={15} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${(dashboardData.financial_metrics.valor_inventario / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">Valorización actual del inventario</p>
            <Progress value={85} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos Críticos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Productos con Stock Crítico
            </CardTitle>
            <CardDescription>Productos que requieren reposición inmediata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.critical_products.length > 0 ? (
                dashboardData.critical_products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock actual: {product.current_stock} | Mínimo: {product.min_stock}
                      </p>
                    </div>
                    <Badge variant={product.status === "critico" || product.status === "agotado" ? "destructive" : "secondary"}>
                      {product.status === "critico" ? "Crítico" : product.status === "agotado" ? "Agotado" : "Bajo"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No hay productos con stock crítico</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Movimientos Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-600" />
              Movimientos Recientes
            </CardTitle>
            <CardDescription>Últimas transacciones registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recent_movements.length > 0 ? (
                dashboardData.recent_movements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{movement.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {movement.movement_type} - {movement.reference_document} - {movement.username || 'Sistema'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${movement.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                        {movement.quantity > 0 ? "+" : ""}
                        {movement.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(movement.movement_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No hay movimientos recientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  )
}
