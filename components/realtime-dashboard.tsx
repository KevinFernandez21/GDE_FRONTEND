"use client"

import { useState, useEffect } from "react"
import {
  Package,
  AlertTriangle,
  Truck,
  DollarSign,
  RotateCw,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Activity,
  Scan,
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface RealtimeMetrics {
  stock_metrics: {
    total_productos: number
    stock_total: number
    productos_ok: number
    productos_bajo: number
    productos_agotados: number
    valor_compra: number
    valor_venta: number
  }
  guide_tracking: {
    total_guias: number
    guias_escaneadas: number
    guias_pendientes: number
    guias_desconocidas: number
    guias_duplicadas: number
  }
  scanning_activity: {
    sesiones_activas: number
    total_escaneos_hoy: number
    escaneos_guias: number
    escaneos_productos: number
  }
  financial_metrics: {
    total_costos: number
    total_gastos: number
    total_capital: number
  }
  delivery_guides: {
    total_guias_despacho: number
    pendientes: number
    en_transito: number
    entregadas: number
  }
  activity_metrics: {
    usuarios_activos_hoy: number
  }
  top_products: Array<{
    code: string
    name: string
    current_stock: number
    total_movimiento: number
    num_movimientos: number
  }>
  alerts: Array<{
    type: "critical" | "warning" | "info"
    category: string
    message: string
    priority: "high" | "medium" | "low"
  }>
}

export default function RealtimeDashboard() {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds

  const fetchRealtimeMetrics = async () => {
    try {
      setError(null) // Clear previous errors
      const response = await apiClient.request('/dashboard/realtime-metrics', {
        method: 'GET'
      })

      if (response.data) {
        // Validate that the response has the expected structure
        if (response.data && typeof response.data === 'object') {
          // Additional validation for required fields
          const requiredFields = ['stock_metrics', 'guide_tracking', 'scanning_activity', 'financial_metrics']
          const hasRequiredFields = requiredFields.every(field => response.data[field] !== undefined)
          
          if (hasRequiredFields) {
            setMetrics(response.data)
            setLastUpdate(new Date())
            setError(null)
          } else {
            const errorMsg = 'Estructura de datos incompleta'
            console.error('Invalid response data structure:', response.data)
            setError(errorMsg)
            toast.error(`Error: ${errorMsg}`)
          }
        } else {
          const errorMsg = 'Datos de métricas inválidos'
          console.error('Invalid response data structure:', response.data)
          setError(errorMsg)
          toast.error(`Error: ${errorMsg}`)
        }
      } else {
        const errorMessage = response.error || 'Error desconocido al obtener métricas'
        console.error('Error fetching metrics:', errorMessage)
        setError(errorMessage)
        toast.error(`Error: ${errorMessage}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de conexión'
      console.error('Error fetching realtime metrics:', errorMessage)
      setError(errorMessage)
      toast.error(`Error de conexión: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRealtimeMetrics()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchRealtimeMetrics()
      }, refreshInterval * 1000)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-CL').format(value)
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-600" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "critical":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-orange-200 bg-orange-50"
      default:
        return "border-blue-200 bg-blue-50"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RotateCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando dashboard en tiempo real...</p>
        </div>
      </div>
    )
  }

  if (!metrics || error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-orange-600" />
          <p className="text-muted-foreground mb-2">
            {error ? `Error: ${error}` : 'No se pudieron cargar las métricas'}
          </p>
          {error && (
            <p className="text-xs text-muted-foreground mb-4">
              Verifica que el backend esté funcionando correctamente y que la base de datos esté disponible.
            </p>
          )}
          <Button onClick={fetchRealtimeMetrics} className="mt-4">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  const guideCompletionPercentage = metrics.guide_tracking.total_guias > 0
    ? (metrics.guide_tracking.guias_escaneadas / metrics.guide_tracking.total_guias) * 100
    : 0

  const deliveryCompletionPercentage = metrics.delivery_guides.total_guias_despacho > 0
    ? (metrics.delivery_guides.entregadas / metrics.delivery_guides.total_guias_despacho) * 100
    : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard en Tiempo Real</h2>
          <p className="text-muted-foreground">
            Monitoreo integral del sistema
            {lastUpdate && (
              <span className="ml-2 text-xs">
                • Última actualización: {lastUpdate.toLocaleTimeString('es-CL')}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchRealtimeMetrics}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {metrics.alerts.length > 0 && (
        <div className="space-y-2">
          {metrics.alerts.map((alert, index) => (
            <Alert key={index} className={getAlertColor(alert.type)}>
              {getAlertIcon(alert.type)}
              <AlertTitle className="font-semibold">
                {alert.category.toUpperCase()} - Prioridad: {alert.priority}
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Metrics Grid - Row 1: Stock & Inventory */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Inventario y Stock
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics.stock_metrics.total_productos)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Stock total: {formatNumber(metrics.stock_metrics.stock_total)} unidades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock OK</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(metrics.stock_metrics.productos_ok)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Por encima del mínimo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatNumber(metrics.stock_metrics.productos_bajo)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Requieren atención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agotados</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatNumber(metrics.stock_metrics.productos_agotados)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Reposición urgente
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Metrics Grid - Row 2: Financial */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-purple-600" />
          Métricas Financieras
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(metrics.stock_metrics.valor_compra)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Costo de compra
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Venta Potencial</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(metrics.stock_metrics.valor_venta)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Margen: {formatCurrency(metrics.stock_metrics.valor_venta - metrics.stock_metrics.valor_compra)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costos Totales</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(metrics.financial_metrics.total_costos)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gastos: {formatCurrency(metrics.financial_metrics.total_gastos)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Capital Total</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(metrics.financial_metrics.total_capital)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aportes y préstamos
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Metrics Grid - Row 3: Guide Tracking */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          Seguimiento de Guías
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guías Master</CardTitle>
              <FileText className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics.guide_tracking.total_guias)}</div>
              <Progress value={guideCompletionPercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {guideCompletionPercentage.toFixed(1)}% completado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escaneadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(metrics.guide_tracking.guias_escaneadas)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Verificadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatNumber(metrics.guide_tracking.guias_pendientes)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Por escanear</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Desconocidas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatNumber(metrics.guide_tracking.guias_desconocidas)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">No en lista</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duplicadas</CardTitle>
              <RotateCcw className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatNumber(metrics.guide_tracking.guias_duplicadas)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Multi-scan</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Metrics Grid - Row 4: Scanning & Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanning Activity */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Scan className="w-5 h-5 text-cyan-600" />
            Actividad de Escaneo (Hoy)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sesiones Activas</CardTitle>
                <Activity className="h-4 w-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(metrics.scanning_activity.sesiones_activas)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Escaneos</CardTitle>
                <Scan className="h-4 w-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(metrics.scanning_activity.total_escaneos_hoy)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Guías: {metrics.scanning_activity.escaneos_guias} | Productos: {metrics.scanning_activity.escaneos_productos}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delivery Guides */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-600" />
            Guías de Despacho (Último mes)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Guías</CardTitle>
                <Truck className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(metrics.delivery_guides.total_guias_despacho)}</div>
                <Progress value={deliveryCompletionPercentage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {deliveryCompletionPercentage.toFixed(1)}% entregadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado</CardTitle>
                <Activity className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pendientes:</span>
                    <span className="font-semibold">{metrics.delivery_guides.pendientes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">En tránsito:</span>
                    <span className="font-semibold">{metrics.delivery_guides.en_transito}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-green-600">Entregadas:</span>
                    <span className="font-semibold text-green-600">{metrics.delivery_guides.entregadas}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Products & System Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Top Productos (Últimos 7 días)
            </CardTitle>
            <CardDescription>Productos con mayor movimiento</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.top_products.length > 0 ? (
              <div className="space-y-3">
                {metrics.top_products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                        <p className="font-medium">{product.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Código: {product.code} | Stock actual: {product.current_stock}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{formatNumber(product.total_movimiento)}</p>
                      <p className="text-xs text-muted-foreground">{product.num_movimientos} movimientos</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No hay movimientos de productos en los últimos 7 días
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Actividad del Sistema
            </CardTitle>
            <CardDescription>Estado actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium">Usuarios Activos Hoy</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {metrics.activity_metrics.usuarios_activos_hoy}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Auto-refresh:</span>
                <Badge variant={autoRefresh ? "default" : "secondary"}>
                  {autoRefresh ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Intervalo:</span>
                <Badge variant="outline">{refreshInterval}s</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total alertas:</span>
                <Badge variant={metrics.alerts.length > 0 ? "destructive" : "secondary"}>
                  {metrics.alerts.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
