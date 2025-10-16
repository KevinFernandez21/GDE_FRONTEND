"use client"

import React, { useState } from 'react'
import { Bell, Package, AlertTriangle, DollarSign, Users, CheckCircle, XCircle, Info, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications } from './notification-provider'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotification, 
    clearAll 
  } = useNotifications()
  
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all')

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inventory': return <Package className="w-4 h-4 text-blue-600" />
      case 'financial': return <DollarSign className="w-4 h-4 text-green-600" />
      case 'system': return <Users className="w-4 h-4 text-purple-600" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default: return <Info className="w-4 h-4 text-blue-600" />
    }
  }

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'inventory': return 'bg-blue-100 text-blue-800'
      case 'financial': return 'bg-green-100 text-green-800'
      case 'system': return 'bg-purple-100 text-purple-800'
      case 'success': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-300'
    }
  }

  const filteredNotifications = activeFilter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  const groupedNotifications = filteredNotifications.reduce((acc, notification) => {
    const type = notification.type
    if (!acc[type]) acc[type] = []
    acc[type].push(notification)
    return acc
  }, {} as Record<string, typeof notifications>)

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Centro de Notificaciones</span>
              <span className="sm:hidden">Notificaciones</span>
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="min-w-[20px] h-5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={markAllAsRead} className="text-xs sm:text-sm">
                <Check className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Marcar todas</span>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={clearAll} className="text-xs sm:text-sm">
              <X className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Limpiar todo</span>
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs sm:text-sm mt-2">
          Mantente informado sobre las actividades del sistema en tiempo real
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as 'all' | 'unread')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="relative">
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="relative">
              Sin leer ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeFilter} className="mt-4">
            <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Bell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-base sm:text-lg font-medium">No hay notificaciones</p>
                  <p className="text-xs sm:text-sm">Cuando recibas notificaciones, aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {Object.entries(groupedNotifications).map(([type, typeNotifications]) => (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                        {getNotificationIcon(type)}
                        <span className="capitalize">
                          {type === 'inventory' ? 'Inventario' :
                           type === 'financial' ? 'Financiero' :
                           type === 'system' ? 'Sistema' :
                           type === 'success' ? 'Exitoso' :
                           type === 'error' ? 'Error' :
                           type === 'warning' ? 'Advertencia' : 'Información'}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {typeNotifications.length}
                        </Badge>
                      </div>

                      {typeNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 sm:p-4 border border-l-4 rounded-lg ${getPriorityColor(notification.priority)} ${
                            notification.read ? 'bg-gray-50 opacity-75' : 'bg-white'
                          } hover:shadow-md transition-shadow cursor-pointer`}
                          onClick={() => !notification.read && markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                              <div className="mt-1 flex-shrink-0">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className={`font-medium text-xs sm:text-sm truncate ${
                                    notification.read ? 'text-gray-600' : 'text-gray-900'
                                  }`}>
                                    {notification.title}
                                  </h4>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                                  )}
                                </div>
                                <p className={`text-xs sm:text-sm line-clamp-2 ${
                                  notification.read ? 'text-gray-500' : 'text-gray-700'
                                }`}>
                                  {notification.message}
                                </p>
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                                  <Badge className={`text-[10px] sm:text-xs ${getNotificationBadgeColor(notification.type)}`}>
                                    {notification.type === 'inventory' ? 'Inv.' :
                                     notification.type === 'financial' ? 'Fin.' :
                                     notification.type === 'system' ? 'Sis.' :
                                     notification.type === 'success' ? 'Ok' :
                                     notification.type === 'error' ? 'Err' :
                                     notification.type === 'warning' ? 'Adv' : 'Info'}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] sm:text-xs ${
                                      notification.priority === 'high' ? 'border-red-500 text-red-700' :
                                      notification.priority === 'medium' ? 'border-yellow-500 text-yellow-700' :
                                      'border-green-500 text-green-700'
                                    }`}
                                  >
                                    {notification.priority === 'high' ? 'Alta' :
                                     notification.priority === 'medium' ? 'Med' : 'Baja'}
                                  </Badge>
                                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                    {formatDistanceToNow(notification.timestamp, {
                                      addSuffix: true,
                                      locale: es
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                clearNotification(notification.id)
                              }}
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}