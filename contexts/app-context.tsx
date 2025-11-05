"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AppContextType {
  activeModule: string
  setActiveModule: (module: string) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModule] = useState("dashboard")
  // Initialize based on screen size - default to collapsed on mobile, open on desktop
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return false // Default to open on SSR
  })
  
  // Handle resize events to auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      // Only auto-adjust on mobile, let user control on desktop
      if (window.innerWidth < 1024 && !sidebarCollapsed) {
        // Auto-collapse when switching to mobile
        setSidebarCollapsed(true)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarCollapsed])

  return (
    <AppContext.Provider
      value={{
        activeModule,
        setActiveModule,
        sidebarCollapsed,
        setSidebarCollapsed,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
