"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  QrCode, 
  Package, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Truck
} from "lucide-react"
import { toast } from "sonner"

interface DispatchGuide {
  id: string
  guide_number: string
  client_name: string
  client_address: string
  client_phone?: string
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
  created_at: string
  updated_at: string
  items: {
    description: string
    quantity: number
  }[]
}

const statusConfig = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-500',
    icon: Clock,
    description: 'Esperando procesamiento'
  },
  in_transit: {
    label: 'En Tránsito',
    color: 'bg-blue-500',
    icon: Truck,
    description: 'En camino al destino'
  },
  delivered: {
    label: 'Entregado',
    color: 'bg-green-500',
    icon: CheckCircle,
    description: 'Entregado exitosamente'
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-500',
    icon: XCircle,
    description: 'Envío cancelado'
  }
}

export default function ScanPage() {
  const params = useParams()
  const id = params.id as string
  const [guide, setGuide] = useState<DispatchGuide | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchGuideData(id)
    }
  }, [id])

  const fetchGuideData = async (guideId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // Simulación de datos para demo - en producción conectarías con tu API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simular carga
      
      const mockGuide: DispatchGuide = {
        id: guideId,
        guide_number: `GD-${guideId}`,
        client_name: "Empresa Cliente S.A.",
        client_address: "Av. Principal 123, Santiago, Chile",
        client_phone: "+56 9 1234 5678",
        status: Math.random() > 0.5 ? 'in_transit' : 'pending',
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        items: [
          { description: "Productos electrónicos", quantity: 5 },
          { description: "Material de oficina", quantity: 12 },
          { description: "Documentos importantes", quantity: 1 }
        ]
      }
      
      setGuide(mockGuide)
      toast.success("Datos de guía cargados")
    } catch (error) {
      console.error('Error fetching guide:', error)
      setError("Error al cargar los datos de la guía")
      toast.error("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    if (id) {
      fetchGuideData(id)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Cargando datos de la guía...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Guía No Encontrada</h2>
            <p className="text-slate-400 mb-4">
              {error || "No se pudo encontrar la guía de despacho solicitada"}
            </p>
            <Button onClick={refreshData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusInfo = statusConfig[guide.status]
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <QrCode className="h-12 w-12 text-blue-400" />
            </div>
            <CardTitle className="text-white text-2xl">
              Guía de Despacho
            </CardTitle>
            <CardDescription className="text-slate-400">
              Seguimiento en tiempo real
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Estado y Número */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{guide.guide_number}</h2>
                <p className="text-slate-400">
                  Creado el {new Date(guide.created_at).toLocaleDateString('es-CL')}
                </p>
              </div>
              <Button onClick={refreshData} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${statusInfo.color}`}>
                <StatusIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <Badge className={`${statusInfo.color} text-white`}>
                  {statusInfo.label}
                </Badge>
                <p className="text-sm text-slate-400 mt-1">{statusInfo.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Cliente */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <User className="mr-2 h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">{guide.client_name}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-slate-300">{guide.client_address}</p>
              </div>
            </div>
            
            {guide.client_phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-slate-400" />
                <p className="text-slate-300">{guide.client_phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Contenido del Envío
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {guide.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-slate-300">{item.description}</span>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    x{item.quantity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Última Actualización */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-slate-400">
              Última actualización: {new Date(guide.updated_at).toLocaleString('es-CL')}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Los datos se actualizan automáticamente cada 30 segundos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}