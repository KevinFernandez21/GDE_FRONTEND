"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  Shield,
  Bell,
  FileText,
  Database,
  Upload,
  Download,
  Settings,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info,
  Trash2,
  Edit,
  Plus,
  Eye,
  User,
  Key,
  Server,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Globe,
  Mail,
  Lock,
  Unlock,
  RefreshCw,
  Save,
  X,
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  ShieldCheck,
  Database as DatabaseIcon,
  ServerCrash,
  Wifi,
  WifiOff
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"

interface User {
  id: string
  username: string
  email: string
  full_name: string
  role: 'admin' | 'contador' | 'operador'
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at?: string
}

interface SystemStats {
  database_size: number
  total_users: number
  active_users: number
  total_records: number
  system_uptime: string
  memory_usage: number
  cpu_usage: number
  disk_usage: number
}

interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  system_alerts: boolean
  maintenance_alerts: boolean
  security_alerts: boolean
  data_import_alerts: boolean
}

export default function ConfigurationModule() {
  const [activeTab, setActiveTab] = useState("overview")
  const [users, setUsers] = useState<User[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    system_alerts: true,
    maintenance_alerts: true,
    security_alerts: true,
    data_import_alerts: true
  })
  const [loading, setLoading] = useState(true)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    username: "",
    password: "",
    role: "",
    notes: ""
  })
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isEditingUser, setIsEditingUser] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  
  const { user } = useAuth()
  
  // Permission checks
  const isAdmin = user?.role === 'admin'
  const isOperador = user?.role === 'operador'
  const isContador = user?.role === 'contador'
  const canManageUsers = isAdmin || isOperador
  const canManageDatabase = isAdmin || isOperador
  const canViewSystemStats = isAdmin || isOperador || isContador

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      if (canManageUsers) {
        await loadUsers()
      }
      
      if (canViewSystemStats) {
        await loadSystemStats()
      }
      
      await loadNotificationSettings()
      
    } catch (error) {
      console.error('Error loading configuration data:', error)
      toast.error("Error al cargar la configuración")
    } finally {
      setLoading(false)
    }
  }, [canManageUsers, canViewSystemStats])

  // Load users
  const loadUsers = async () => {
    try {
      const response = await apiClient.request('/users')
      if (response.data) {
        setUsers(response.data)
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error("Error al cargar usuarios")
    }
  }

  // Load system stats
  const loadSystemStats = async () => {
    try {
      const response = await apiClient.request('/system/stats')
      if (response.data) {
        setSystemStats(response.data)
      }
    } catch (error) {
      console.error('Error loading system stats:', error)
      // Set mock data for development
      setSystemStats({
        database_size: 1024 * 1024 * 50, // 50MB
        total_users: 5,
        active_users: 3,
        total_records: 1250,
        system_uptime: "7 días, 12 horas",
        memory_usage: 65,
        cpu_usage: 23,
        disk_usage: 45
      })
    }
  }

  // Load notification settings
  const loadNotificationSettings = async () => {
    try {
      const response = await apiClient.request('/settings/notifications')
      if (response.data) {
        setNotificationSettings(response.data)
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
    }
  }

  // Create user
  const handleCreateUser = async () => {
    if (!newUser.full_name || !newUser.email || !newUser.username || !newUser.password || !newUser.role) {
      toast.error("Todos los campos son requeridos")
      return
    }

    setIsCreatingUser(true)
    try {
      const response = await apiClient.request('/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      })

      if (response.success) {
        toast.success("Usuario creado exitosamente")
        setNewUser({
          full_name: "",
          email: "",
          username: "",
          password: "",
          role: "",
          notes: ""
        })
        setShowCreateUserModal(false)
        await loadUsers()
      } else {
        toast.error(response.message || "Error al crear usuario")
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error("Error al crear usuario")
    } finally {
      setIsCreatingUser(false)
    }
  }

  // Edit user
  const handleEditUser = async () => {
    if (!selectedUser) return

    setIsEditingUser(true)
    try {
      const response = await apiClient.request(`/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: selectedUser.full_name,
          email: selectedUser.email,
          role: selectedUser.role,
          is_active: selectedUser.is_active
        })
      })

      if (response.success) {
        toast.success("Usuario actualizado exitosamente")
        setShowEditUserModal(false)
        setSelectedUser(null)
        await loadUsers()
      } else {
        toast.error(response.message || "Error al actualizar usuario")
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error("Error al actualizar usuario")
    } finally {
      setIsEditingUser(false)
    }
  }

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      return
    }

    try {
      const response = await apiClient.request(`/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.success) {
        toast.success("Usuario eliminado exitosamente")
        await loadUsers()
      } else {
        toast.error(response.message || "Error al eliminar usuario")
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error("Error al eliminar usuario")
    }
  }

  // Toggle user status
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await apiClient.request(`/users/${userId}/toggle-status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (response.success) {
        toast.success(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`)
        await loadUsers()
      } else {
        toast.error(response.message || "Error al cambiar estado del usuario")
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error("Error al cambiar estado del usuario")
    }
  }

  // Update notification settings
  const handleNotificationSettingChange = async (setting: keyof NotificationSettings, value: boolean) => {
    try {
      const newSettings = { ...notificationSettings, [setting]: value }
      setNotificationSettings(newSettings)

      const response = await apiClient.request('/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(newSettings)
      })

      if (response.success) {
        toast.success("Configuración actualizada")
      } else {
        // Revert on error
        setNotificationSettings(notificationSettings)
        toast.error("Error al actualizar configuración")
      }
    } catch (error) {
      console.error('Error updating notification settings:', error)
      setNotificationSettings(notificationSettings)
      toast.error("Error al actualizar configuración")
    }
  }

  // Database operations
  const handleDatabaseBackup = async () => {
    try {
      const response = await apiClient.request('/database/backup', {
        method: 'POST'
      })

      if (response.success) {
        toast.success("Respaldo de base de datos iniciado")
      } else {
        toast.error("Error al iniciar respaldo")
      }
    } catch (error) {
      console.error('Error creating database backup:', error)
      toast.error("Error al crear respaldo")
    }
  }

  const handleDatabaseRestore = async () => {
    if (!window.confirm("¿Estás seguro de que quieres restaurar la base de datos? Esta acción sobrescribirá todos los datos actuales.")) {
      return
    }

    try {
      const response = await apiClient.request('/database/restore', {
        method: 'POST'
      })

      if (response.success) {
        toast.success("Restauración de base de datos iniciada")
      } else {
        toast.error("Error al iniciar restauración")
      }
    } catch (error) {
      console.error('Error restoring database:', error)
      toast.error("Error al restaurar base de datos")
    }
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.is_active) ||
                         (statusFilter === "inactive" && !user.is_active)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Cargando configuración...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600 mt-1">
            Gestiona usuarios, configuración del sistema y base de datos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
          {canManageUsers && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
          )}
          {canManageDatabase && (
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Base de Datos</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificaciones</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {canViewSystemStats && systemStats && (
            <>
              {/* System Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                        <p className="text-2xl font-bold text-green-600">{systemStats.active_users}</p>
                      </div>
                      <UserCheck className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Registros</p>
                        <p className="text-2xl font-bold text-blue-600">{systemStats.total_records.toLocaleString()}</p>
                      </div>
                      <DatabaseIcon className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Uso de Memoria</p>
                        <p className="text-2xl font-bold text-orange-600">{systemStats.memory_usage}%</p>
                      </div>
                      <MemoryStick className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tiempo Activo</p>
                        <p className="text-2xl font-bold text-purple-600">{systemStats.system_uptime}</p>
                      </div>
                      <Clock className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Rendimiento del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Uso de CPU</span>
                      <span>{systemStats.cpu_usage}%</span>
                    </div>
                    <Progress value={systemStats.cpu_usage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Uso de Disco</span>
                      <span>{systemStats.disk_usage}%</span>
                    </div>
                    <Progress value={systemStats.disk_usage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Uso de Memoria</span>
                      <span>{systemStats.memory_usage}%</span>
                    </div>
                    <Progress value={systemStats.memory_usage} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {canManageUsers && (
                  <Button 
                    onClick={() => setShowCreateUserModal(true)}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Plus className="w-6 h-6" />
                    <span>Crear Usuario</span>
                  </Button>
                )}
                
                {canManageDatabase && (
                  <Button 
                    onClick={handleDatabaseBackup}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Download className="w-6 h-6" />
                    <span>Respaldo BD</span>
                  </Button>
                )}
                
                <Button 
                  onClick={() => setActiveTab("notifications")}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Bell className="w-6 h-6" />
                  <span>Notificaciones</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        {canManageUsers && (
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestión de Usuarios</CardTitle>
                    <CardDescription>
                      Administra usuarios del sistema y sus permisos
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateUserModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Usuario
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar usuarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtrar por rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="contador">Contador</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="inactive">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Último Acceso</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.full_name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              user.role === 'admin' ? 'destructive' :
                              user.role === 'contador' ? 'default' : 'secondary'
                            }>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? 'default' : 'secondary'}>
                              {user.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowEditUserModal(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                              >
                                {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Database Tab */}
        {canManageDatabase && (
          <TabsContent value="database" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Database Operations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Operaciones de Base de Datos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Respaldo</h4>
                    <p className="text-sm text-gray-600">
                      Crea una copia de seguridad de todos los datos
                    </p>
                    <Button onClick={handleDatabaseBackup} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Crear Respaldo
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Restauración</h4>
                    <p className="text-sm text-gray-600">
                      Restaura la base de datos desde un respaldo
                    </p>
                    <Button 
                      onClick={handleDatabaseRestore} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Restaurar Base de Datos
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Database Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Estadísticas de Base de Datos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tamaño de BD</span>
                    <span className="text-sm text-gray-600">
                      {(systemStats?.database_size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total de Registros</span>
                    <span className="text-sm text-gray-600">
                      {systemStats?.total_records.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Usuarios Registrados</span>
                    <span className="text-sm text-gray-600">
                      {systemStats?.total_users}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Configuración de Notificaciones
              </CardTitle>
              <CardDescription>
                Personaliza cómo y cuándo recibir notificaciones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                    <p className="text-sm text-gray-600">
                      Recibe notificaciones importantes por correo electrónico
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notificationSettings.email_notifications}
                    onCheckedChange={(checked) => handleNotificationSettingChange('email_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Notificaciones Push</Label>
                    <p className="text-sm text-gray-600">
                      Recibe notificaciones en tiempo real en el navegador
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={notificationSettings.push_notifications}
                    onCheckedChange={(checked) => handleNotificationSettingChange('push_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="system-alerts">Alertas del Sistema</Label>
                    <p className="text-sm text-gray-600">
                      Notificaciones sobre el estado del sistema
                    </p>
                  </div>
                  <Switch
                    id="system-alerts"
                    checked={notificationSettings.system_alerts}
                    onCheckedChange={(checked) => handleNotificationSettingChange('system_alerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance-alerts">Alertas de Mantenimiento</Label>
                    <p className="text-sm text-gray-600">
                      Notificaciones sobre tareas de mantenimiento programadas
                    </p>
                  </div>
                  <Switch
                    id="maintenance-alerts"
                    checked={notificationSettings.maintenance_alerts}
                    onCheckedChange={(checked) => handleNotificationSettingChange('maintenance_alerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="security-alerts">Alertas de Seguridad</Label>
                    <p className="text-sm text-gray-600">
                      Notificaciones sobre eventos de seguridad
                    </p>
                  </div>
                  <Switch
                    id="security-alerts"
                    checked={notificationSettings.security_alerts}
                    onCheckedChange={(checked) => handleNotificationSettingChange('security_alerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="data-import-alerts">Alertas de Importación</Label>
                    <p className="text-sm text-gray-600">
                      Notificaciones sobre el estado de las importaciones de datos
                    </p>
                  </div>
                  <Switch
                    id="data-import-alerts"
                    checked={notificationSettings.data_import_alerts}
                    onCheckedChange={(checked) => handleNotificationSettingChange('data_import_alerts', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Modal */}
      <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Agrega un nuevo usuario al sistema con los permisos correspondientes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={newUser.full_name}
                onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="juan@empresa.com"
              />
            </div>
            <div>
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                placeholder="jperez"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="contador">Contador</SelectItem>
                  <SelectItem value="operador">Operador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea
                id="notes"
                value={newUser.notes}
                onChange={(e) => setNewUser(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Información adicional sobre el usuario"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateUserModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreatingUser}>
              {isCreatingUser ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Usuario
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_full_name">Nombre Completo</Label>
                <Input
                  id="edit_full_name"
                  value={selectedUser.full_name}
                  onChange={(e) => setSelectedUser(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit_role">Rol</Label>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(value) => setSelectedUser(prev => prev ? { ...prev, role: value as any } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="contador">Contador</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_active"
                  checked={selectedUser.is_active}
                  onCheckedChange={(checked) => setSelectedUser(prev => prev ? { ...prev, is_active: checked } : null)}
                />
                <Label htmlFor="edit_is_active">Usuario Activo</Label>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditUserModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser} disabled={isEditingUser}>
              {isEditingUser ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}