"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import { Bell, Package, AlertTriangle, DollarSign, Users, CheckCircle, XCircle, Info } from 'lucide-react'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'inventory' | 'financial' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high'
  data?: any
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const unreadCount = notifications.filter(n => !n.read).length

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    }

    setNotifications(prev => [newNotification, ...prev].slice(0, 100)) // Keep only last 100 notifications

    // Show toast notification
    const getIcon = () => {
      switch (notification.type) {
        case 'inventory': return <Package className="w-4 h-4" />
        case 'financial': return <DollarSign className="w-4 h-4" />
        case 'system': return <Users className="w-4 h-4" />
        case 'success': return <CheckCircle className="w-4 h-4" />
        case 'error': return <XCircle className="w-4 h-4" />
        case 'warning': return <AlertTriangle className="w-4 h-4" />
        default: return <Info className="w-4 h-4" />
      }
    }

    const toastOptions = {
      icon: getIcon(),
      duration: notification.priority === 'high' ? 8000 : notification.priority === 'medium' ? 5000 : 3000,
      position: 'top-right' as const,
    }

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, { 
          description: notification.message, 
          ...toastOptions 
        })
        break
      case 'error':
        toast.error(notification.title, { 
          description: notification.message, 
          ...toastOptions 
        })
        break
      case 'warning':
        toast.warning(notification.title, { 
          description: notification.message, 
          ...toastOptions 
        })
        break
      default:
        toast(notification.title, { 
          description: notification.message, 
          ...toastOptions 
        })
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate various types of notifications
      const notificationTypes = [
        {
          type: 'inventory' as const,
          title: 'Stock Bajo Detectado',
          message: 'El producto "Laptop Dell Inspiron" tiene solo 5 unidades disponibles.',
          priority: 'high' as const,
        },
        {
          type: 'financial' as const,
          title: 'Nuevo Movimiento Contable',
          message: 'Se registró un nuevo gasto por $1,200 en Marketing Digital.',
          priority: 'medium' as const,
        },
        {
          type: 'system' as const,
          title: 'Respaldo Completado',
          message: 'El respaldo automático se ejecutó correctamente a las 2:00 AM.',
          priority: 'low' as const,
        },
        {
          type: 'success' as const,
          title: 'Sincronización Exitosa',
          message: 'Los datos se sincronizaron correctamente con el sistema contable.',
          priority: 'medium' as const,
        }
      ]

      // OPTIMIZED: Reduced frequency to save API calls
      // Randomly trigger a notification (5% chance every 2 minutes)
      if (Math.random() < 0.05) {
        const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]
        addNotification(randomNotification)
      }
    }, 120000) // OPTIMIZED: Check every 2 minutes instead of 30 seconds

    // Add initial notifications
    setTimeout(() => {
      addNotification({
        type: 'info',
        title: 'Sistema Iniciado',
        message: 'Bienvenido al sistema de gestión empresarial. Todas las funcionalidades están operativas.',
        priority: 'low',
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // PAUSED: Fetch real stock alerts from backend
  // Temporarily disabled to reduce load and timeout issues
  /*
  useEffect(() => {
    let isMounted = true
    const processedAlertIds = new Set<string>()

    const fetchStockAlerts = async () => {
      try {
        const { apiClient } = await import('@/lib/api')
        const response = await apiClient.request('/inventory/alerts', {
          method: 'GET'
        })

        if (!isMounted) return

        if (response.data && Array.isArray(response.data)) {
          // Add new alerts (only if we haven't processed them before in this session)
          response.data.forEach((alert: any) => {
            const productId = alert.product?.id || alert.product_id
            if (productId && !processedAlertIds.has(productId)) {
              processedAlertIds.add(productId)
              
              const productName = alert.product?.name || 'Producto'
              const currentStock = alert.current_stock || 0
              const minStock = alert.min_stock || 0
              const alertLevel = alert.alert_level || alert.alert_type

              let title = 'Alerta de Stock'
              let message = ''
              let priority: 'low' | 'medium' | 'high' = 'medium'

              if (currentStock === 0) {
                title = 'Producto Agotado'
                message = `${productName} está agotado. Reponer inmediatamente.`
                priority = 'high'
              } else if (alertLevel === 'critico') {
                title = 'Stock Crítico'
                message = `${productName} tiene solo ${currentStock} unidades (mínimo: ${minStock}). Reponer urgente.`
                priority = 'high'
              } else {
                title = 'Stock Bajo'
                message = `${productName} tiene ${currentStock} unidades disponibles (mínimo: ${minStock}). Considerar reposición.`
                priority = currentStock <= minStock * 0.7 ? 'high' : 'medium'
              }

              addNotification({
                type: 'inventory',
                title,
                message,
                priority,
                data: {
                  productId,
                  productName,
                  currentStock,
                  minStock,
                  alertLevel,
                  alertType: alert.alert_type,
                  daysOfSupply: alert.days_of_supply
                }
              })
            }
          })
        }
      } catch (error) {
        console.error('Error fetching stock alerts:', error)
        // Don't show error to user, just log it
      }
    }

    // Fetch alerts immediately
    fetchStockAlerts()

    // Then fetch every 5 minutes
    const stockAlertInterval = setInterval(() => {
      fetchStockAlerts()
    }, 300000) // 5 minutes

    return () => {
      isMounted = false
      clearInterval(stockAlertInterval)
    }
  }, [addNotification])
  */

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}