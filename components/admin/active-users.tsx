"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Users, Activity, Clock, MapPin, Monitor, Smartphone, Tablet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface ActiveUser {
  user_id: string
  username: string
  full_name: string
  role: string
  last_activity: string
  ip_address?: string
  session_start: string
  device_info?: {
    type: 'desktop' | 'mobile' | 'tablet'
    os: string
    browser: string
  }
}

interface ActiveUsersProps {
  refreshInterval?: number
  className?: string
}

const getDeviceIcon = (deviceType?: string) => {
  switch (deviceType) {
    case 'mobile':
      return <Smartphone className="h-4 w-4" />
    case 'tablet':
      return <Tablet className="h-4 w-4" />
    default:
      return <Monitor className="h-4 w-4" />
  }
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin':
      return 'destructive'
    case 'programador':
      return 'secondary'
    case 'contable':
      return 'default'
    default:
      return 'outline'
  }
}

const getStatusColor = (lastActivity: string) => {
  const now = new Date()
  const activity = new Date(lastActivity)
  const minutesAgo = (now.getTime() - activity.getTime()) / (1000 * 60)

  if (minutesAgo <= 2) return 'bg-green-500'
  if (minutesAgo <= 15) return 'bg-yellow-500'
  return 'bg-gray-500'
}

const getStatusText = (lastActivity: string) => {
  const now = new Date()
  const activity = new Date(lastActivity)
  const minutesAgo = (now.getTime() - activity.getTime()) / (1000 * 60)

  if (minutesAgo <= 2) return 'En línea'
  if (minutesAgo <= 15) return 'Ausente'
  return 'Inactivo'
}

export function ActiveUsers({ refreshInterval = 30000, className = "" }: ActiveUsersProps) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [totalOnline, setTotalOnline] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchActiveUsers = useCallback(async () => {
    try {
      // TODO: Implement online users endpoint in backend
      throw new Error('Online users functionality not yet implemented in backend')

      /* const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/activity/online-users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch active users')
      }

      const result = await response.json()
      setActiveUsers(result.data.online_users)
      setTotalOnline(result.data.total_online)
      setError(null) */
    } catch (err) {
      console.error('Error fetching active users:', err)
      setError('Error al cargar usuarios activos')
      
      if (err instanceof Error && err.message.includes('403')) {
        toast({
          title: "Sin permisos",
          description: "No tienes permisos para ver usuarios activos.",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchActiveUsers()
    
    const interval = setInterval(fetchActiveUsers, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchActiveUsers, refreshInterval])

  if (error && !loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Activity className="mx-auto h-12 w-12 mb-4" />
            <p>{error}</p>
            <Button variant="outline" onClick={fetchActiveUsers} className="mt-4">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Usuarios Activos
          <Badge variant="secondary" className="ml-auto">
            {totalOnline} en línea
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activeUsers.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Activity className="mx-auto h-12 w-12 mb-4" />
            <p>No hay usuarios activos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeUsers.map((user) => (
              <div key={user.user_id} className="flex items-center space-x-3 p-3 rounded-lg border">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      <AvatarInitials name={user.full_name || user.username} />
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(user.last_activity)}`}
                  ></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.full_name || user.username}
                    </p>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span>{getStatusText(user.last_activity)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(user.last_activity), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    </div>
                    
                    {user.device_info && (
                      <div className="flex items-center gap-1">
                        {getDeviceIcon(user.device_info.type)}
                        <span>{user.device_info.os}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    Sesión iniciada
                  </div>
                  <div className="text-xs font-medium">
                    {formatDistanceToNow(new Date(user.session_start), { 
                      locale: es 
                    })}
                  </div>
                  
                  {user.ip_address && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{user.ip_address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t text-xs text-gray-500 text-center">
          Se actualiza cada {refreshInterval / 1000} segundos
        </div>
      </CardContent>
    </Card>
  )
}