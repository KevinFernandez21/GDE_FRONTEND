"use client"

import { useState } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Shield, Calendar, Edit, Save, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    username: user?.username || "",
  })

  const handleSave = () => {
    // Aquí iría la lógica para actualizar el perfil en el backend
    toast.success("Perfil actualizado exitosamente")
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedUser({
      name: user?.full_name || "",
      email: user?.email || "",
      username: user?.username || "",
    })
    setIsEditing(false)
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Mi Perfil
          </DialogTitle>
          <DialogDescription>
            Visualiza y edita la información de tu perfil de usuario
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Información Personal</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-2xl">
                    {user.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <Button size="sm" variant="outline" className="absolute -bottom-2 -right-2">
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre Completo</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editedUser.name}
                      onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-gray-50 rounded-md">{user.full_name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="username">Nombre de Usuario</Label>
                  {isEditing ? (
                    <Input
                      id="username"
                      value={editedUser.username}
                      onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-gray-50 rounded-md font-mono">{user.username}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 p-2 bg-gray-50 rounded-md">{user.email}</p>
                )}
              </div>

              <div>
                <Label>Rol del Usuario</Label>
                <div className="mt-1">
                  <Badge variant="default" className="text-sm">
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>ID de Usuario</Label>
                <p className="mt-1 p-2 bg-gray-50 rounded-md font-mono text-sm text-gray-600">{user.id}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seguridad de la Cuenta</CardTitle>
                <CardDescription>
                  Gestiona la seguridad y privacidad de tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Contraseña</h4>
                    <p className="text-sm text-gray-600">Última modificación: hace 30 días</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Cambiar Contraseña
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Autenticación de Dos Factores</h4>
                    <p className="text-sm text-gray-600">Añade una capa extra de seguridad</p>
                  </div>
                  <Badge variant="secondary">Desactivado</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Sesiones Activas</h4>
                    <p className="text-sm text-gray-600">Administra tus sesiones activas</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Sesiones
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Permisos</CardTitle>
                <CardDescription>
                  Permisos asignados a tu cuenta de usuario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {user.permissions && user.permissions.length > 0 ? (
                    user.permissions.map((permission, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No se han asignado permisos específicos</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actividad Reciente</CardTitle>
                <CardDescription>
                  Historial de actividades en tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Inicio de sesión</p>
                      <p className="text-xs text-gray-600">Hoy a las 09:30 AM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Edit className="w-4 h-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Producto actualizado</p>
                      <p className="text-xs text-gray-600">Ayer a las 15:45 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-4 h-4 text-orange-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Reporte generado</p>
                      <p className="text-xs text-gray-600">2 días atrás a las 11:20 AM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estadísticas de Uso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">42</p>
                    <p className="text-sm text-gray-600">Sesiones este mes</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">127</p>
                    <p className="text-sm text-gray-600">Acciones realizadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}