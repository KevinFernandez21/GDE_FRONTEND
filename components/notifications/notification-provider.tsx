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

      // Randomly trigger a notification (10% chance every 30 seconds)
      if (Math.random() < 0.1) {
        const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]
        addNotification(randomNotification)
      }
    }, 30000) // Check every 30 seconds

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

  // Simulate stock alerts
  useEffect(() => {
    const stockAlertInterval = setInterval(() => {
      if (Math.random() < 0.15) {
        const products = ['Mouse Logitech MX', 'Monitor Samsung 24"', 'Teclado Mecánico', 'Webcam HD']
        const randomProduct = products[Math.floor(Math.random() * products.length)]
        const stockLevel = Math.floor(Math.random() * 10) + 1
        
        addNotification({
          type: 'warning',
          title: 'Alerta de Stock',
          message: `${randomProduct} tiene solo ${stockLevel} unidades disponibles.`,
          priority: stockLevel <= 3 ? 'high' : 'medium',
          data: { product: randomProduct, stock: stockLevel }
        })
      }
    }, 45000) // Check every 45 seconds

    return () => clearInterval(stockAlertInterval)
  }, [])

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