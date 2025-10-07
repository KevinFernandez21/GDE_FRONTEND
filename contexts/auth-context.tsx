"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiClient } from "@/lib/api"

interface User {
  id: string
  username: string
  full_name: string
  email: string
  role: string
  permissions?: string[]
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('gde_token')
      if (token) {
        apiClient.setToken(token)
        const response = await apiClient.getCurrentUser()
        if (response.data) {
          setUser(response.data)
        } else {
          // Invalid token, clear it
          apiClient.clearToken()
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const response = await apiClient.login(username, password)
      
      if (response.data) {
        apiClient.setToken(response.data.access_token)
        
        // Set user data from login response
        if (response.data.user) {
          setUser(response.data.user)
          return { success: true }
        }
        
        // Fallback: Get user data
        const userResponse = await apiClient.getCurrentUser()
        if (userResponse.data) {
          setUser(userResponse.data)
          return { success: true }
        }
      }
      
      return { success: false, error: response.error || 'Login failed' }
    } catch (error) {
      return { success: false, error: 'Network error' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      apiClient.clearToken()
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
