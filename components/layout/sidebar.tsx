"use client"

import { Package, Home, Truck, RotateCcw, FileText, Settings, LogOut } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useApp } from "@/contexts/app-context"

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { activeModule, setActiveModule } = useApp()

  const menuItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "inventario", icon: Package, label: "Inventario" },
    { id: "trazabilidad", icon: Truck, label: "Trazabilidad" },
    { id: "gestion", icon: RotateCcw, label: "Gestión" },
    { id: "reportes", icon: FileText, label: "Reportes" },
    { id: "configuracion", icon: Settings, label: "Configuración" },
  ]

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
            <Image
              src="/logo-iem.png"
              alt="Importadora El Mayorista"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg">IMPORTADORA</h1>
            <p className="text-sm text-slate-300">EL MAYORISTA</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeModule === item.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {activeModule === item.id && <div className="w-2 h-2 bg-white rounded-full ml-auto" />}
            </button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-8 h-8">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>
              {user?.full_name
                ? user.full_name.split(" ")
                    .map((n) => n[0])
                    .join("")
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-medium">{user?.full_name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-300 hover:text-white"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}
