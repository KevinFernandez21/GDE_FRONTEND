"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, Upload, Smartphone, FileSpreadsheet, FileText, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import DispatchGuideManager from "@/components/dispatch/DispatchGuideManager"
import QRGenerator from "@/components/qr/QRGenerator"
import QRScanner from "@/components/qr/QRScanner"
import FileUploader from "@/components/upload/FileUploader"

export default function EmptyDashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">GDE - Guías de Despacho Electrónicas</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-300">Bienvenido, {user?.email}</span>
            <Button 
              variant="outline" 
              onClick={logout}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              Inicio
            </TabsTrigger>
            <TabsTrigger value="dispatch" className="data-[state=active]:bg-blue-600">
              Despachos
            </TabsTrigger>
            <TabsTrigger value="qr" className="data-[state=active]:bg-blue-600">
              QR Codes
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-blue-600">
              Cargar Archivos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Guías de Despacho
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Gestiona tus guías de despacho electrónicas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setActiveTab("dispatch")}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Comenzar con Despachos
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <QrCode className="mr-2 h-5 w-5" />
                    Códigos QR
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Genera y escanea códigos QR para seguimiento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setActiveTab("qr")}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Gestionar QR
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Upload className="mr-2 h-5 w-5" />
                    Cargar Datos
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Importa guías desde archivos CSV o Excel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setActiveTab("upload")}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Subir Archivos
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">¡Bienvenido al Sistema GDE!</CardTitle>
                <CardDescription className="text-slate-400">
                  Tu aplicación está lista para comenzar a gestionar guías de despacho electrónicas
                </CardDescription>
              </CardHeader>
              <CardContent className="text-slate-300">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Smartphone className="mr-2 h-4 w-4" />
                      Funcionalidades Principales:
                    </h3>
                    <ul className="text-sm space-y-1 text-slate-400">
                      <li>• Gestión completa de guías de despacho</li>
                      <li>• Generación automática de códigos QR</li>
                      <li>• Escaneo en tiempo real desde móvil</li>
                      <li>• Importación desde CSV y Excel</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Cómo empezar:</h3>
                    <ol className="text-sm space-y-1 text-slate-400">
                      <li>1. Ve a la pestaña &quot;Despachos&quot; para crear guías</li>
                      <li>2. Genera códigos QR para seguimiento</li>
                      <li>3. Usa el móvil para escanear en tiempo real</li>
                      <li>4. Importa datos masivos con archivos</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dispatch">
            <DispatchGuideManager />
          </TabsContent>

          <TabsContent value="qr">
            <div className="grid gap-6 lg:grid-cols-2">
              <QRGenerator />
              <QRScanner />
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <FileUploader />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}