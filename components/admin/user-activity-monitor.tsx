"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Activity, Clock, User, Filter, RefreshCw, Download, Search, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface UserActivity {
  activity_id: string
  user_id: string
  username: string
  full_name?: string
  action: string
  resource_type: string
  resource_id?: string
  description: string
  ip_address?: string
  user_agent?: string
  timestamp: string
  session_id?: string
  details?: Record<string, any>
}

interface UserActivityMonitorProps {
  currentUserRole: 'admin' | 'programador' | 'contable'
  refreshInterval?: number
  className?: string
}

interface FilterState {
  searchTerm: string
  actionType: string
  resourceType: string
  dateRange: string
  userId: string
}

const initialFilters: FilterState = {
  searchTerm: '',
  actionType: '',
  resourceType: '',
  dateRange: '24h',
  userId: ''
}

const getActionBadgeVariant = (action: string) => {
  if (action.includes('create') || action.includes('login')) return 'default'
  if (action.includes('update') || action.includes('modify')) return 'secondary'
  if (action.includes('delete') || action.includes('logout')) return 'destructive'
  if (action.includes('view') || action.includes('read')) return 'outline'
  return 'secondary'
}

const getActionIcon = (action: string) => {
  if (action.includes('user')) return <User className="h-3 w-3" />
  return <Activity className="h-3 w-3" />
}

const formatTimestamp = (timestamp: string) => {
  return formatDistanceToNow(new Date(timestamp), { 
    addSuffix: true, 
    locale: es 
  })
}

export function UserActivityMonitor({ currentUserRole, refreshInterval = 30000, className = "" }: UserActivityMonitorProps) {
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalActivities, setTotalActivities] = useState(0)
  const { toast } = useToast()

  const fetchActivities = useCallback(async (page = 1, appliedFilters = filters) => {
    if (currentUserRole === 'contable') {
      setError('Sin permisos para ver actividades de usuarios')
      setLoading(false)
      return
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '20'
      })

      if (appliedFilters.searchTerm) {
        params.append('search', appliedFilters.searchTerm)
      }
      if (appliedFilters.actionType) {
        params.append('action', appliedFilters.actionType)
      }
      if (appliedFilters.resourceType) {
        params.append('resource_type', appliedFilters.resourceType)
      }
      if (appliedFilters.dateRange && appliedFilters.dateRange !== 'all') {
        params.append('date_range', appliedFilters.dateRange)
      }
      if (appliedFilters.userId) {
        params.append('user_id', appliedFilters.userId)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/logs/activities?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }

      const result = await response.json()
      setActivities(result.data)
      setTotalPages(result.pagination.total_pages)
      setTotalActivities(result.pagination.total)
      setCurrentPage(result.pagination.page)
      setError(null)
    } catch (err) {
      console.error('Error fetching activities:', err)
      setError('Error al cargar actividades de usuarios')
      
      if (err instanceof Error && err.message.includes('403')) {
        toast({
          title: "Sin permisos",
          description: "No tienes permisos para ver actividades de usuarios.",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }, [filters, currentUserRole, toast])

  useEffect(() => {
    fetchActivities()
    
    const interval = setInterval(() => fetchActivities(), refreshInterval)
    return () => clearInterval(interval)
  }, [fetchActivities, refreshInterval])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setCurrentPage(1)
    fetchActivities(1, newFilters)
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchActivities(currentPage)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchActivities(page)
  }

  const toggleActivityDetails = (activityId: string) => {
    const newExpanded = new Set(expandedActivities)
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId)
    } else {
      newExpanded.add(activityId)
    }
    setExpandedActivities(newExpanded)
  }

  const exportActivities = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv'
      })

      if (filters.searchTerm) params.append('search', filters.searchTerm)
      if (filters.actionType) params.append('action', filters.actionType)
      if (filters.resourceType) params.append('resource_type', filters.resourceType)
      if (filters.dateRange && filters.dateRange !== 'all') params.append('date_range', filters.dateRange)
      if (filters.userId) params.append('user_id', filters.userId)

      // TODO: Implement export endpoint in backend
      throw new Error('Export functionality not yet implemented in backend')

      /* const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/logs/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to export activities')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user_activities_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Exportación exitosa",
        description: "Las actividades se han exportado correctamente."
      }) */
    } catch (error) {
      toast({
        title: "Error en exportación",
        description: "No se pudieron exportar las actividades.",
        variant: "destructive"
      })
    }
  }

  if (error && currentUserRole === 'contable') {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Activity className="mx-auto h-12 w-12 mb-4" />
            <p>No tienes permisos para ver actividades de usuarios</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitor de Actividad de Usuarios
            <Badge variant="secondary">
              {totalActivities} registros
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportActivities}
              disabled={loading}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
          <div>
            <Input
              placeholder="Buscar actividades..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Select value={filters.actionType} onValueChange={(value) => handleFilterChange('actionType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                <SelectItem value="login">Inicios de sesión</SelectItem>
                <SelectItem value="logout">Cierres de sesión</SelectItem>
                <SelectItem value="create">Creaciones</SelectItem>
                <SelectItem value="update">Actualizaciones</SelectItem>
                <SelectItem value="delete">Eliminaciones</SelectItem>
                <SelectItem value="view">Visualizaciones</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={filters.resourceType} onValueChange={(value) => handleFilterChange('resourceType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de recurso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los recursos</SelectItem>
                <SelectItem value="user">Usuarios</SelectItem>
                <SelectItem value="product">Productos</SelectItem>
                <SelectItem value="customer">Clientes</SelectItem>
                <SelectItem value="supplier">Proveedores</SelectItem>
                <SelectItem value="inventory">Inventario</SelectItem>
                <SelectItem value="file">Archivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Última hora</SelectItem>
                <SelectItem value="24h">Últimas 24 horas</SelectItem>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="all">Todo el tiempo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              placeholder="ID de usuario..."
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse p-4 border rounded-lg">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Activity className="mx-auto h-12 w-12 mb-4" />
            <p>No hay actividades que mostrar</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.activity_id} className="border rounded-lg">
                  <div 
                    className="flex items-center space-x-4 p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleActivityDetails(activity.activity_id)}
                  >
                    <div className="flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          <AvatarInitials name={activity.full_name || activity.username} />
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.full_name || activity.username}
                        </p>
                        <Badge variant={getActionBadgeVariant(activity.action)} className="text-xs">
                          <div className="flex items-center gap-1">
                            {getActionIcon(activity.action)}
                            {activity.action}
                          </div>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {activity.resource_type}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(activity.timestamp)}</span>
                        </div>
                        {activity.ip_address && (
                          <span>IP: {activity.ip_address}</span>
                        )}
                        {activity.session_id && (
                          <span>Sesión: {activity.session_id.slice(0, 8)}...</span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {expandedActivities.has(activity.activity_id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {expandedActivities.has(activity.activity_id) && (
                    <div className="px-4 pb-4 border-t bg-gray-50">
                      <div className="mt-4 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <strong>Usuario:</strong> {activity.username} ({activity.user_id})
                          </div>
                          <div>
                            <strong>Fecha/Hora:</strong> {new Date(activity.timestamp).toLocaleString()}
                          </div>
                          {activity.resource_id && (
                            <div>
                              <strong>ID del Recurso:</strong> {activity.resource_id}
                            </div>
                          )}
                          {activity.user_agent && (
                            <div className="col-span-2">
                              <strong>User Agent:</strong> 
                              <div className="mt-1 p-2 bg-white rounded border text-xs font-mono break-all">
                                {activity.user_agent}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <div>
                            <strong className="text-xs">Detalles adicionales:</strong>
                            <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto">
                              {JSON.stringify(activity.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}

        <div className="mt-4 pt-4 border-t text-xs text-gray-500 text-center">
          Se actualiza cada {refreshInterval / 1000} segundos • Mostrando actividades de los últimos {filters.dateRange === '1h' ? 'hora' : filters.dateRange === '24h' ? '24 horas' : filters.dateRange === '7d' ? '7 días' : filters.dateRange === '30d' ? '30 días' : 'todos los tiempos'}
        </div>
      </CardContent>
    </Card>
  )
}