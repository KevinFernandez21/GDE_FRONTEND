'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Building2, Users, ShoppingCart } from 'lucide-react'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const success = await login(username, password)
      if (!success) {
        setError('Credenciales inválidas. Por favor, verifica tu usuario y contraseña.')
      }
    } catch (error) {
      setError('Error de conexión. Por favor, intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const demoUsers = [
    { username: 'kfernandez', password: 'kevin123', role: 'Admin', description: 'Acceso completo al sistema' },
    { username: 'admin', password: 'admin', role: 'Admin', description: 'Administrador general' },
    { username: 'contador', password: 'contador123', role: 'Contable', description: 'Gestión contable e inventario' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Branding and features */}
        <div className="text-white space-y-8 hidden md:block">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 size={48} className="text-blue-400" />
              <div>
                <h1 className="text-4xl font-bold">GDE Sistema</h1>
                <p className="text-xl text-blue-200">Gestión de Inventario y Contabilidad</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <ShoppingCart size={24} className="text-blue-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Control de Inventario</h3>
                <p className="text-gray-300">Gestión completa de productos, stock y movimientos con códigos QR para seguimiento en tiempo real.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-green-500/20 p-3 rounded-lg">
                <Users size={24} className="text-green-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Gestión Contable</h3>
                <p className="text-gray-300">Sistema integrado de contabilidad con facturas, compras y reportes automatizados.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <Building2 size={24} className="text-purple-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Guías de Despacho</h3>
                <p className="text-gray-300">Escaneo QR y carga masiva de guías desde CSV/Excel para logística eficiente.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
              <CardDescription className="text-center">
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingresa tu usuario"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    required
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ingresar
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Demo credentials card */}
          <Card className="mt-6 bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-center text-slate-700">Usuarios de Prueba</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoUsers.map((user, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-mono text-sm text-slate-600">
                          <span className="font-semibold">Usuario:</span> {user.username}
                        </div>
                        <div className="font-mono text-sm text-slate-600">
                          <span className="font-semibold">Contraseña:</span> {user.password}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{user.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}