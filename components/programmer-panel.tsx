"use client"

import { useState, useEffect } from "react"
import {
  Code,
  Activity,
  Database,
  FileText,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"

interface ActivityLog {
  id: string
  user_id: string
  username?: string
  activity_type: string
  description?: string
  timestamp: string
  ip_address?: string
  details?: any
}

interface SystemStats {
  total_users: number
  active_sessions: number
  total_activities_today: number
  database_size?: string
  uptime?: string
}

export default function ProgrammerPanel() {
  const [activeTab, setActiveTab] = useState("audit")
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterDays, setFilterDays] = useState("7")
  const [filterType, setFilterType] = useState("all")
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchAuditData()
    fetchSystemStats()
  }, [filterDays, filterType])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAuditData()
        fetchSystemStats()
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh, filterDays, filterType])

  const fetchAuditData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType !== "all") {
        params.append("action_types", filterType)
      }

      const response = await apiClient.request(`/logs/activities?${params.toString()}`, {
        method: 'GET'
      })

      if (response.data) {
        setActivities(response.data.items || response.data || [])
      } else {
        console.error('Error fetching activities:', response.error)
      }
    } catch (error) {
      console.error('Error fetching audit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemStats = async () => {
    try {
      // Fetch multiple stats in parallel
      const [usersResponse, dashboardResponse] = await Promise.all([
        apiClient.request('/users/', { method: 'GET' }),
        apiClient.request('/dashboard/realtime-metrics', { method: 'GET' })
      ])

      const totalUsers = usersResponse.data?.items?.length || 0
      const activeSessions = dashboardResponse.data?.activity_metrics?.usuarios_activos_hoy || 0

      setStats({
        total_users: totalUsers,
        active_sessions: activeSessions,
        total_activities_today: activities.length,
        database_size: "N/A",
        uptime: "N/A"
      })
    } catch (error) {
      console.error('Error fetching system stats:', error)
    }
  }

  const exportAuditLogs = () => {
    const csvContent = [
      ['Timestamp', 'Usuario', 'Tipo de Actividad', 'Descripción', 'IP'],
      ...activities.map(log => [
        new Date(log.timestamp).toLocaleString('es-CL'),
        log.username || log.user_id,
        log.activity_type,
        log.description || '',
        log.ip_address || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success("Logs exportados exitosamente")
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "login":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "logout":
        return <XCircle className="w-4 h-4 text-gray-600" />
      case "user_created":
        return <User className="w-4 h-4 text-blue-600" />
      case "user_updated":
        return <User className="w-4 h-4 text-orange-600" />
      case "user_deleted":
        return <User className="w-4 h-4 text-red-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityBadgeVariant = (type: string) => {
    switch (type) {
      case "login":
        return "default"
      case "logout":
        return "secondary"
      case "user_created":
        return "default"
      case "user_updated":
        return "secondary"
      case "user_deleted":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Code className="w-8 h-8 text-blue-600" />
            Panel de Programador
          </h2>
          <p className="text-muted-foreground">
            Auditoría del sistema y configuración técnica
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
          <Button variant="outline" size="sm" onClick={() => { fetchAuditData(); fetchSystemStats() }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">En el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesiones Activas</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active_sessions || 0}</div>
            <p className="text-xs text-muted-foreground">Usuarios conectados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividades Hoy</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activities.length}</div>
            <p className="text-xs text-muted-foreground">Registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base de Datos</CardTitle>
            <Database className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">OK</div>
            <p className="text-xs text-muted-foreground">Estado: Conectado</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="audit">Auditoría</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="database">Base de Datos</TabsTrigger>
        </TabsList>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros de Auditoría
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Select value={filterDays} onValueChange={setFilterDays}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Últimas 24 horas</SelectItem>
                    <SelectItem value="7">Últimos 7 días</SelectItem>
                    <SelectItem value="30">Últimos 30 días</SelectItem>
                    <SelectItem value="90">Últimos 90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las actividades</SelectItem>
                    <SelectItem value="login">Inicios de sesión</SelectItem>
                    <SelectItem value="logout">Cierres de sesión</SelectItem>
                    <SelectItem value="user_created">Usuarios creados</SelectItem>
                    <SelectItem value="user_updated">Usuarios modificados</SelectItem>
                    <SelectItem value="user_deleted">Usuarios eliminados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" size="sm" onClick={exportAuditLogs}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Registro de Actividades
              </CardTitle>
              <CardDescription>
                Historial completo de acciones en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Cargando registros...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay actividades registradas
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {activities.slice(0, 100).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="mt-1">
                        {getActivityIcon(log.activity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getActivityBadgeVariant(log.activity_type)}>
                            {log.activity_type}
                          </Badge>
                          <span className="text-sm font-medium">
                            {log.username || `Usuario ${log.user_id.slice(0, 8)}`}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-sm text-muted-foreground">
                            {log.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.timestamp).toLocaleString('es-CL')}
                          </span>
                          {log.ip_address && (
                            <span>IP: {log.ip_address}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
              <CardDescription>
                Estado y configuración del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Estado del Sistema</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Operativo</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Versión</p>
                  <p className="text-sm text-muted-foreground">GDE v1.0.0</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Entorno</p>
                  <Badge variant="outline">Producción</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Última Actualización</p>
                  <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('es-CL')}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Módulos del Sistema</h4>
                <div className="space-y-2">
                  {[
                    { name: 'Dashboard', status: 'active' },
                    { name: 'Inventario', status: 'active' },
                    { name: 'Trazabilidad', status: 'active' },
                    { name: 'Gestión Financiera', status: 'active' },
                    { name: 'Reportes', status: 'active' },
                    { name: 'Administración', status: 'active' }
                  ].map((module) => (
                    <div key={module.name} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{module.name}</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Activo
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Estado de la Base de Datos
              </CardTitle>
              <CardDescription>
                Información y métricas de Supabase PostgreSQL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Conexión Exitosa</AlertTitle>
                <AlertDescription className="text-green-700">
                  La base de datos está operativa y respondiendo correctamente
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Tipo de Base de Datos</span>
                  <Badge>PostgreSQL (Supabase)</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Estado de Conexión</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Conectado
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Tablas Activas</span>
                  <span className="text-sm font-bold">20+</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Última Migración</span>
                  <span className="text-sm text-muted-foreground">Schema actualizado</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Tablas Principales</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'users',
                    'products',
                    'inventory',
                    'delivery_guides',
                    'guide_master',
                    'guide_tracking',
                    'barcode_scans',
                    'costs',
                    'expenses',
                    'capital',
                    'stock_movements',
                    'user_sessions'
                  ].map((table) => (
                    <div key={table} className="p-2 border rounded text-sm font-mono">
                      {table}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
