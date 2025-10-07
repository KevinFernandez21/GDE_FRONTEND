"use client"

import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { AppProvider } from "@/contexts/app-context"
import LoginForm from "@/components/auth/login-form"
import MainLayout from "@/components/layout/main-layout"

export default function HomePage() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  )
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Cargando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return <MainLayout />
}
