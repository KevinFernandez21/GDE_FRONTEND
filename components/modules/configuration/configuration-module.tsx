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

interface ActivityItem {
  id?: string
  action: string
  username?: string
  user_id?: string
  ip_address?: string
  created_at: string
  detail?: string
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
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [activeTab, setActiveTab] = useState("general")
  
  const { user } = useAuth()

  // Permission checks
  const isAdmin = user?.role === 'admin'
  const isOperador = user?.role === 'operador'
  const isContador = user?.role === 'contador'
  const isProgramador = user?.role === 'programador'
  const canManageUsers = isAdmin || isProgramador
  const canManageDatabase = isAdmin || isProgramador
  const canViewSystemStats = isAdmin || isProgramador || isOperador || isContador

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      await loadNotificationSettings()
      if (canManageUsers) await loadUsers()
      if (canViewSystemStats) await loadSystemStats()
      if (isAdmin || isProgramador) await loadActivities()
    } catch (error) {
      console.error('Error loading configuration data:', error)
      toast.error("Error al cargar la configuración")
    } finally {
      setLoading(false)
    }
  }, [])

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

  // Load audit activities (admin/programador)
  const loadActivities = async () => {
    try {
      const response = await apiClient.request('/logs/activities?limit=20')
      if (response.data && Array.isArray(response.data.items)) {
        setActivities(response.data.items)
      } else if (Array.isArray(response.data)) {
        setActivities(response.data)
      }
    } catch (error) {
      console.error('Error loading activities:', error)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600 mt-1">Preferencias y administración del sistema</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
          <TabsTrigger value="general">General</TabsTrigger>
          {canManageUsers && <TabsTrigger value="usuarios">Usuarios</TabsTrigger>}
          {(isAdmin || isProgramador) && <TabsTrigger value="auditoria">Auditoría</TabsTrigger>}
          {canViewSystemStats && <TabsTrigger value="sistema">Sistema</TabsTrigger>}
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Configuración de Notificaciones
              </CardTitle>
              <CardDescription>Personaliza cómo recibir notificaciones del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Notificaciones por Email</Label>
                    <p className="text-sm text-gray-600">Recibe notificaciones importantes por correo electrónico</p>
                  </div>
                  <Switch id="email-notifications" checked={notificationSettings.email_notifications} onCheckedChange={(checked) => handleNotificationSettingChange('email_notifications', checked)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="system-alerts">Alertas del Sistema</Label>
                    <p className="text-sm text-gray-600">Notificaciones sobre el estado del sistema</p>
                  </div>
                  <Switch id="system-alerts" checked={notificationSettings.system_alerts} onCheckedChange={(checked) => handleNotificationSettingChange('system_alerts', checked)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance-alerts">Alertas de Mantenimiento</Label>
                    <p className="text-sm text-gray-600">Notificaciones sobre tareas de mantenimiento programadas</p>
                  </div>
                  <Switch id="maintenance-alerts" checked={notificationSettings.maintenance_alerts} onCheckedChange={(checked) => handleNotificationSettingChange('maintenance_alerts', checked)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="security-alerts">Alertas de Seguridad</Label>
                    <p className="text-sm text-gray-600">Notificaciones sobre eventos de seguridad</p>
                  </div>
                  <Switch id="security-alerts" checked={notificationSettings.security_alerts} onCheckedChange={(checked) => handleNotificationSettingChange('security_alerts', checked)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="data-import-alerts">Alertas de Importación</Label>
                    <p className="text-sm text-gray-600">Notificaciones sobre el estado de las importaciones de datos</p>
                  </div>
                  <Switch id="data-import-alerts" checked={notificationSettings.data_import_alerts} onCheckedChange={(checked) => handleNotificationSettingChange('data_import_alerts', checked)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usuarios (solo admin/programador) */}
        {canManageUsers && (
          <TabsContent value="usuarios" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="w-5 h-5" /> Gestión de usuarios</h2>
              <Button onClick={() => setShowCreateUserModal(true)} className="gap-2"><Plus className="w-4 h-4" /> Crear usuario</Button>
            </div>

            {/* Filtros rápidos */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Input placeholder="Buscar por nombre, usuario o email" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Rol" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="programador">Programador</SelectItem>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="contador">Contador</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCheck className="w-5 h-5" /> Usuarios</CardTitle>
                <CardDescription>Listado de usuarios con estado y rol</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Último acceso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => (
                      <TableRow key={u.id}>
                        <TableCell>{u.full_name}</TableCell>
                        <TableCell>{u.username}</TableCell>
                        <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                        <TableCell>{u.last_login ? new Date(u.last_login).toLocaleString() : '-'}</TableCell>
                        <TableCell>
                          {u.is_active ? <Badge className="bg-green-100 text-green-700">Activo</Badge> : <Badge variant="destructive">Inactivo</Badge>}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); setShowEditUserModal(true) }}>Editar</Button>
                          <Button size="sm" variant={u.is_active ? "secondary" : "default"} onClick={() => handleToggleUserStatus(u.id, u.is_active)}>
                            {u.is_active ? 'Desactivar' : 'Activar'}
                          </Button>
                          {isAdmin && (
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(u.id)}>Eliminar</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Auditoría (solo admin/programador) */}
        {(isAdmin || isProgramador) && (
          <TabsContent value="auditoria" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" /> Auditoría del sistema</CardTitle>
                <CardDescription>Últimas actividades de usuarios y del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((a, idx) => (
                      <TableRow key={a.id || idx}>
                        <TableCell>{new Date(a.created_at).toLocaleString()}</TableCell>
                        <TableCell>{a.username || a.user_id || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{a.action}</Badge></TableCell>
                        <TableCell>{a.ip_address || '-'}</TableCell>
                        <TableCell className="max-w-[360px] truncate" title={a.detail || ''}>{a.detail || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {activities.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500">Sin actividades recientes</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Sistema */}
        {canViewSystemStats && (
          <TabsContent value="sistema" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Server className="w-5 h-5" /> Estado de la base de datos</CardTitle>
                  <CardDescription>Uso de recursos y métricas principales</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Tamaño</p>
                      <p className="font-medium">{systemStats ? `${(systemStats.database_size / (1024*1024)).toFixed(1)} MB` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registros</p>
                      <p className="font-medium">{systemStats?.total_records ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Usuarios totales</p>
                      <p className="font-medium">{systemStats?.total_users ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Usuarios activos</p>
                      <p className="font-medium">{systemStats?.active_users ?? '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm"><span>CPU</span><span>{systemStats?.cpu_usage ?? 0}%</span></div>
                      <Progress value={systemStats?.cpu_usage ?? 0} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm"><span>Memoria</span><span>{systemStats?.memory_usage ?? 0}%</span></div>
                      <Progress value={systemStats?.memory_usage ?? 0} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm"><span>Disco</span><span>{systemStats?.disk_usage ?? 0}%</span></div>
                      <Progress value={systemStats?.disk_usage ?? 0} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {canManageDatabase && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DatabaseIcon className="w-5 h-5" /> Mantenimiento</CardTitle>
                    <CardDescription>Operaciones administrativas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={handleDatabaseBackup} className="w-full" variant="outline">Crear respaldo</Button>
                    <Button onClick={handleDatabaseRestore} className="w-full" variant="destructive">Restaurar respaldo</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Modal Crear usuario */}
      {canManageUsers && (
        <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear usuario</DialogTitle>
              <DialogDescription>Completa la información del nuevo usuario</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nombre completo" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} />
              <Input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              <Input placeholder="Usuario" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
              <Input placeholder="Contraseña" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="programador">Programador</SelectItem>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="contador">Contador</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="Notas (opcional)" value={newUser.notes} onChange={(e) => setNewUser({ ...newUser, notes: e.target.value })} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateUserModal(false)}>Cancelar</Button>
                <Button onClick={handleCreateUser} disabled={isCreatingUser}>{isCreatingUser ? 'Creando...' : 'Crear'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Editar usuario */}
      {canManageUsers && selectedUser && (
        <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar usuario</DialogTitle>
              <DialogDescription>Actualiza la información del usuario</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nombre completo" value={selectedUser.full_name} onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })} />
              <Input placeholder="Email" value={selectedUser.email} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} />
              <Select value={selectedUser.role} onValueChange={(v) => setSelectedUser({ ...selectedUser, role: v as User["role"] })}>
                <SelectTrigger><SelectValue placeholder="Rol" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="programador">Programador</SelectItem>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="contador">Contador</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditUserModal(false)}>Cancelar</Button>
                <Button onClick={handleEditUser} disabled={isEditingUser}>{isEditingUser ? 'Guardando...' : 'Guardar'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}