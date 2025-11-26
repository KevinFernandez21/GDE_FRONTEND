"use client"

import { useState, useEffect } from "react"
import { Plus, Upload, Search, Edit, Trash2, Calendar, Package, ArrowRightLeft, Download, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import ScannedGuidesImportWizard from "./scanned-guides-import-wizard"

interface ScannedGuide {
  id?: string
  fecha: string
  guia_despacho: string
  tipo: "salida" | "entrada"
  created_at?: string
  updated_at?: string
}

export default function ScannedGuidesModule() {
  const [scannedGuides, setScannedGuides] = useState<ScannedGuide[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportWizard, setShowImportWizard] = useState(false)
  const [editingGuide, setEditingGuide] = useState<ScannedGuide | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<ScannedGuide>({
    fecha: new Date().toISOString().split('T')[0],
    guia_despacho: "",
    tipo: "salida"
  })

  // Fetch scanned guides
  const fetchScannedGuides = async () => {
    setLoading(true)
    try {
      const response = await apiClient.request('/scanned-guides', {
        method: 'GET'
      })
      
      if (response.data) {
        if (response.data.items) {
          // Paginated response
          setScannedGuides(response.data.items || [])
        } else if (Array.isArray(response.data)) {
          // Direct array response
          setScannedGuides(response.data)
        } else {
          setScannedGuides([])
        }
      } else {
        setScannedGuides([])
      }
    } catch (error: any) {
      console.error("Error fetching scanned guides:", error)
      // Don't show error on initial load if endpoint doesn't exist yet
      if (error.message && !error.message.includes('404')) {
        toast.error("Error al cargar guías escaneadas")
      }
      setScannedGuides([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScannedGuides()
  }, [])

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.guia_despacho.trim()) {
      toast.error("La guía de despacho es requerida")
      return
    }

    if (!formData.fecha) {
      toast.error("La fecha es requerida")
      return
    }

    try {
      if (editingGuide?.id) {
        // Update existing
        const updateData: any = {}
        if (formData.fecha) updateData.fecha = formData.fecha
        if (formData.guia_despacho) updateData.guia_despacho = formData.guia_despacho
        if (formData.tipo) updateData.tipo = formData.tipo
        
        await apiClient.request(`/scanned-guides/${editingGuide.id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
        toast.success("Guía escaneada actualizada exitosamente")
      } else {
        // Create new
        await apiClient.request('/scanned-guides', {
          method: 'POST',
          body: JSON.stringify({
            fecha: formData.fecha,
            guia_despacho: formData.guia_despacho,
            tipo: formData.tipo
          })
        })
        toast.success("Guía escaneada agregada exitosamente")
      }

      setShowAddModal(false)
      setEditingGuide(null)
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        guia_despacho: "",
        tipo: "salida"
      })
      fetchScannedGuides()
    } catch (error: any) {
      console.error("Error saving scanned guide:", error)
      toast.error(error.message || "Error al guardar la guía escaneada")
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await apiClient.request(`/scanned-guides/${id}`, {
        method: 'DELETE'
      })
      toast.success("Guía escaneada eliminada exitosamente")
      setDeleteTarget(null)
      fetchScannedGuides()
    } catch (error: any) {
      console.error("Error deleting scanned guide:", error)
      toast.error("Error al eliminar la guía escaneada")
    }
  }

  // Handle edit
  const handleEdit = (guide: ScannedGuide) => {
    setEditingGuide(guide)
    setFormData({
      fecha: guide.fecha,
      guia_despacho: guide.guia_despacho,
      tipo: guide.tipo
    })
    setShowAddModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      guia_despacho: "",
      tipo: "salida"
    })
    setEditingGuide(null)
  }

  // Filter guides
  const filteredGuides = scannedGuides.filter(guide => {
    const search = searchQuery.toLowerCase()
    return (
      guide.guia_despacho.toLowerCase().includes(search) ||
      guide.fecha.includes(search) ||
      guide.tipo.toLowerCase().includes(search)
    )
  })

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Guías Escaneadas</CardTitle>
              <CardDescription>
                Registro de guías escaneadas con fecha, guía de despacho y tipo de movimiento
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowImportWizard(true)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Importar
              </Button>
              <Button
                onClick={() => {
                  resetForm()
                  setShowAddModal(true)
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Guía
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por guía, fecha o tipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Guías Escaneadas</CardTitle>
          <CardDescription>
            {filteredGuides.length} guía(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Cargando...</div>
            </div>
          ) : filteredGuides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay guías escaneadas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "No se encontraron resultados para tu búsqueda" : "Comienza agregando una guía escaneada o importando un archivo"}
              </p>
              {!searchQuery && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowImportWizard(true)}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Importar Archivo
                  </Button>
                  <Button
                    onClick={() => {
                      resetForm()
                      setShowAddModal(true)
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Manualmente
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Guía de Despacho</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuides.map((guide) => (
                    <TableRow key={guide.id || guide.guia_despacho}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(guide.fecha).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{guide.guia_despacho}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={guide.tipo === "entrada" ? "default" : "secondary"}
                          className="flex items-center gap-1 w-fit"
                        >
                          <ArrowRightLeft className="h-3 w-3" />
                          {guide.tipo === "entrada" ? "Entrada" : "Salida"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(guide)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(guide.id || guide.guia_despacho)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => {
        setShowAddModal(open)
        if (!open) {
          resetForm()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGuide ? "Editar Guía Escaneada" : "Agregar Guía Escaneada"}
            </DialogTitle>
            <DialogDescription>
              {editingGuide 
                ? "Modifica los datos de la guía escaneada"
                : "Registra una nueva guía escaneada con fecha, guía de despacho y tipo de movimiento"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="fecha">
                <Calendar className="inline h-4 w-4 mr-2" />
                Fecha *
              </Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
              />
            </div>

            {/* Guía de Despacho */}
            <div className="space-y-2">
              <Label htmlFor="guia_despacho">
                <Package className="inline h-4 w-4 mr-2" />
                Guía de Despacho *
              </Label>
              <Input
                id="guia_despacho"
                placeholder="Ingrese el número de guía de despacho"
                value={formData.guia_despacho}
                onChange={(e) => setFormData({ ...formData, guia_despacho: e.target.value })}
                required
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">
                <ArrowRightLeft className="inline h-4 w-4 mr-2" />
                Tipo de Movimiento *
              </Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: "salida" | "entrada") => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Seleccione el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salida">Salida</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Nota:</strong> El tipo de movimiento determina si la guía es de entrada o salida de productos.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingGuide ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar guía escaneada?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La guía escaneada será eliminada permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Wizard */}
      {showImportWizard && (
        <ScannedGuidesImportWizard
          isOpen={showImportWizard}
          onClose={() => setShowImportWizard(false)}
          onCancel={() => setShowImportWizard(false)}
          onImportComplete={() => {
            setShowImportWizard(false)
            fetchScannedGuides()
            toast.success("Guías escaneadas importadas exitosamente")
          }}
        />
      )}
    </div>
  )
}

