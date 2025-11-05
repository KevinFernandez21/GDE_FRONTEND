"use client"

import { Package, Home, Truck, RotateCcw, FileText, Settings, LogOut, Menu, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useApp } from "@/contexts/app-context"

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { activeModule, setActiveModule, sidebarCollapsed, setSidebarCollapsed } = useApp()
  
  console.log('[Sidebar] User data:', user)

  const menuItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "inventario", icon: Package, label: "Inventario" },
    { id: "trazabilidad", icon: Truck, label: "Trazabilidad" },
    { id: "gestion", icon: RotateCcw, label: "Gestión" },
    // { id: "reportes", icon: FileText, label: "Reportes" }, // Oculto temporalmente
    { id: "configuracion", icon: Settings, label: "Configuración" },
  ]

  // Close sidebar on mobile when clicking outside or on item click
  const handleItemClick = (itemId: string) => {
    setActiveModule(itemId)
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true)
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          bg-slate-900 text-white h-full flex flex-col
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed 
            ? '-translate-x-full lg:translate-x-0 lg:w-16 lg:flex-shrink-0' 
            : 'translate-x-0 w-64 lg:flex-shrink-0'
          }
        `}
      >
      <div className="p-4 lg:p-6 border-b border-slate-700">
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
          <div className={`flex items-center gap-3 min-w-0 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-lg flex items-center justify-center p-1 flex-shrink-0">
              <Image
                src="/logo-iem.png"
                alt="Importadora El Mayorista"
                width={40}
                height={40}
                className="object-contain mx-auto"
              />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-base lg:text-lg truncate">IMPORTADORA</h1>
                <p className="text-xs lg:text-sm text-slate-300 truncate">EL MAYORISTA</p>
              </div>
            )}
          </div>
          {/* Close button for mobile */}
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-slate-800 p-2 flex-shrink-0"
              onClick={() => setSidebarCollapsed(true)}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-2 lg:p-4 overflow-y-auto overflow-x-hidden">
        <div className="space-y-1 lg:space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-2 lg:px-3 py-2 rounded-lg transition-colors
                  ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}
                  ${activeModule === item.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }
                `}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left text-sm lg:text-base whitespace-nowrap">{item.label}</span>
                    {activeModule === item.id && <div className="w-2 h-2 bg-white rounded-full flex-shrink-0" />}
                  </>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="p-2 lg:p-4 border-t border-slate-700 flex-shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-slate-700 text-white">
                {(user?.full_name || user?.username)
                  ? (user.full_name || user.username).split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name || user?.username || "Usuario"}</p>
              <p className="text-xs text-slate-400 capitalize truncate">{user?.role || "usuario"}</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="flex justify-center mb-2">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-slate-700 text-white text-xs">
                {(user?.full_name || user?.username)
                  ? (user.full_name || user.username).split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={`w-full text-slate-300 hover:text-white ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-2'}`}
          onClick={logout}
          title={sidebarCollapsed ? "Cerrar Sesión" : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="ml-2 text-sm whitespace-nowrap">Cerrar Sesión</span>}
        </Button>
      </div>
    </aside>
    </>
  )
}
