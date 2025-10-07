"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  QrCode, 
  Edit,
  Trash2,
  Package,
  User,
  MapPin,
  Phone,
  FileText,
  Calendar
} from "lucide-react"
import { toast } from "sonner"

interface DispatchGuide {
  id: string
  guide_number: string
  client_name: string
  client_address: string
  client_phone?: string
  items: string
  notes?: string
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
  created_at: string
  updated_at: string
}

const statusConfig = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-600',
    textColor: 'text-yellow-100'
  },
  in_transit: {
    label: 'En Tránsito',
    color: 'bg-blue-600',
    textColor: 'text-blue-100'
  },
  delivered: {
    label: 'Entregado',
    color: 'bg-green-600',
    textColor: 'text-green-100'
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-600',
    textColor: 'text-red-100'
  }
}

export default function DispatchGuideManager() {
  const [guides, setGuides] = useState<DispatchGuide[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingGuide, setEditingGuide] = useState<DispatchGuide | null>(null)
  const [formData, setFormData] = useState({
    guide_number: '',
    client_name: '',
    client_address: '',
    client_phone: '',
    items: '',
    notes: ''
  })

  useEffect(() => {
    loadMockData()
  }, [])

  const loadMockData = () => {
    // Datos de ejemplo para mostrar la funcionalidad
    const mockGuides: DispatchGuide[] = [
      {
        id: '1',
        guide_number: 'GD-2024-001',
        client_name: 'Comercial Los Andes Ltda.',
        client_address: 'Av. Los Andes 456, Las Condes, Santiago',
        client_phone: '+56 9 8765 4321',
        items: 'Equipos electrónicos (x5), Material de oficina (x10)',
        notes: 'Entregar en horario de oficina',
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        guide_number: 'GD-2024-002',
        client_name: 'Distribuidora Central S.A.',
        client_address: 'Calle Central 789, Providencia, Santiago',
        client_phone: '+56 2 2345 6789',
        items: 'Productos farmacéuticos (x25), Insumos médicos (x15)',
        status: 'in_transit',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      }
    ]
    setGuides(mockGuides)
  }

  const filteredGuides = guides.filter(guide =>
    guide.guide_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.client_address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.guide_number || !formData.client_name || !formData.client_address) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    if (editingGuide) {
      // Actualizar guía existente
      const updatedGuide: DispatchGuide = {
        ...editingGuide,
        ...formData,
        updated_at: new Date().toISOString()
      }
      
      setGuides(prev => prev.map(guide => 
        guide.id === editingGuide.id ? updatedGuide : guide
      ))
      
      toast.success("Guía actualizada exitosamente")
      setEditingGuide(null)
    } else {
      // Crear nueva guía
      const newGuide: DispatchGuide = {
        id: Date.now().toString(),
        ...formData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setGuides(prev => [newGuide, ...prev])
      toast.success("Nueva guía creada exitosamente")
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      guide_number: '',
      client_name: '',
      client_address: '',
      client_phone: '',
      items: '',
      notes: ''
    })
    setShowForm(false)
    setEditingGuide(null)
  }

  const handleEdit = (guide: DispatchGuide) => {
    setEditingGuide(guide)
    setFormData({
      guide_number: guide.guide_number,
      client_name: guide.client_name,
      client_address: guide.client_address,
      client_phone: guide.client_phone || '',
      items: guide.items,
      notes: guide.notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = (guideId: string) => {
    setGuides(prev => prev.filter(guide => guide.id !== guideId))
    toast.success("Guía eliminada")
  }

  const generateQR = (guideId: string) => {
    const baseUrl = window.location.origin
    const url = `${baseUrl}/scan/${guideId}`
    window.open(url, '_blank')
    toast.success("Código QR abierto en nueva ventana")
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Gestión de Guías de Despacho
              </CardTitle>
              <CardDescription className="text-slate-400">
                Administra todas tus guías de despacho electrónicas
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Guía
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por número de guía, cliente o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Formulario de creación/edición */}
      {showForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              {editingGuide ? 'Editar Guía de Despacho' : 'Nueva Guía de Despacho'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="guide_number" className="text-slate-300">
                    Número de Guía *
                  </Label>
                  <Input
                    id="guide_number"
                    required
                    value={formData.guide_number}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      guide_number: e.target.value
                    }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="GD-2024-003"
                  />
                </div>

                <div>
                  <Label htmlFor="client_name" className="text-slate-300">
                    Nombre del Cliente *
                  </Label>
                  <Input
                    id="client_name"
                    required
                    value={formData.client_name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      client_name: e.target.value
                    }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Empresa Cliente S.A."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="client_address" className="text-slate-300">
                  Dirección de Entrega *
                </Label>
                <Input
                  id="client_address"
                  required
                  value={formData.client_address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    client_address: e.target.value
                  }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Av. Principal 123, Santiago, Chile"
                />
              </div>

              <div>
                <Label htmlFor="client_phone" className="text-slate-300">
                  Teléfono de Contacto
                </Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    client_phone: e.target.value
                  }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div>
                <Label htmlFor="items" className="text-slate-300">
                  Descripción de Productos
                </Label>
                <Textarea
                  id="items"
                  value={formData.items}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    items: e.target.value
                  }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Producto 1 (x5), Producto 2 (x3)..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-slate-300">
                  Notas Adicionales
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Observaciones especiales..."
                  rows={2}
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {editingGuide ? 'Actualizar Guía' : 'Crear Guía'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de guías */}
      <div className="space-y-4">
        {filteredGuides.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center">
              <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-300 mb-2">No hay guías de despacho</p>
              <p className="text-slate-500 text-sm">
                {guides.length === 0 
                  ? 'Crea tu primera guía de despacho para comenzar'
                  : 'No se encontraron resultados para la búsqueda'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredGuides.map((guide) => {
            const statusInfo = statusConfig[guide.status]
            return (
              <Card key={guide.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-600 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {guide.guide_number}
                        </h3>
                        <p className="text-slate-400 text-sm flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          Creado {new Date(guide.created_at).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={`${statusInfo.color} ${statusInfo.textColor}`}>
                        {statusInfo.label}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => generateQR(guide.id)}
                        className="text-slate-400 hover:text-white"
                        title="Generar QR"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(guide)}
                        className="text-slate-400 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(guide.id)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <User className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-white font-medium">{guide.client_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-slate-300 text-sm">{guide.client_address}</p>
                        </div>
                      </div>
                      
                      {guide.client_phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <p className="text-slate-300 text-sm">{guide.client_phone}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {guide.items && (
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Productos:</p>
                          <p className="text-slate-300 text-sm">{guide.items}</p>
                        </div>
                      )}
                      
                      {guide.notes && (
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Notas:</p>
                          <p className="text-slate-300 text-sm">{guide.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}