"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Camera, Shield, Settings, RefreshCw } from 'lucide-react'

interface CameraPermissionsHelpProps {
  onRetry: () => void
}

export default function CameraPermissionsHelp({ onRetry }: CameraPermissionsHelpProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Permisos de Cámara Requeridos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Camera className="h-4 w-4" />
          <AlertDescription>
            Para usar la cámara, necesitas dar permisos a esta aplicación.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium">Cómo habilitar los permisos:</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600">1.</span>
              <span>Busca el ícono de cámara en la barra de direcciones de tu navegador</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600">2.</span>
              <span>Haz clic en el ícono y selecciona &quot;Permitir&quot; o &quot;Allow&quot;</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600">3.</span>
              <span>Si no ves el ícono, ve a Configuración del navegador → Privacidad → Cámara</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-blue-600">4.</span>
              <span>Habilita el acceso a la cámara para este sitio</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Settings className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">En dispositivos móviles:</p>
                <p className="text-yellow-700">Ve a Configuración → Aplicaciones → Navegador → Permisos → Cámara</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onRetry} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Intentar de Nuevo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
