"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface GuideModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (guideData: any) => void
  editingGuide?: any
}

export default function GuideModal({ isOpen, onClose, onSave, editingGuide }: GuideModalProps) {
  const [formData, setFormData] = useState({
    codigo: editingGuide?.codigo || "",
    cliente: editingGuide?.cliente || "",
    productos: editingGuide?.productos || 0,
    estado: editingGuide?.estado || "Pendiente",
    usuario: editingGuide?.usuario || "Usuario Actual",
    direccion: "",
    telefono: "",
    observaciones: "",
  })

  const handleSave = () => {
    if (!formData.cliente || !formData.productos) {
      toast.error("Por favor complete todos los campos obligatorios")
      return
    }

    const guideData = {
      ...formData,
      fecha: new Date().toISOString().slice(0, 10),
      productos: parseInt(formData.productos.toString()) || 0,
      codigo: formData.codigo || `GD-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
    }

    onSave(guideData)
    onClose()
    setFormData({
      codigo: "",
      cliente: "",
      productos: 0,
      estado: "Pendiente",
      usuario: "Usuario Actual",
      direccion: "",
      telefono: "",
      observaciones: "",
    })
    toast.success(editingGuide ? "Guía actualizada exitosamente" : "Guía creada exitosamente")
  }

  const handleCancel = () => {
    onClose()
    setFormData({
      codigo: "",
      cliente: "",
      productos: 0,
      estado: "Pendiente",
      usuario: "Usuario Actual",
      direccion: "",
      telefono: "",
      observaciones: "",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingGuide ? "Editar Guía de Despacho" : "Agregar Nueva Guía de Despacho"}</DialogTitle>
          <DialogDescription>
            {editingGuide ? "Actualiza la información de la guía de despacho" : "Ingresa los detalles de la nueva guía de despacho"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="codigo">Código de Guía</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
              placeholder="GD-2024-001 (se genera automáticamente)"
            />
          </div>

          <div>
            <Label htmlFor="estado">Estado</Label>
            <Select value={formData.estado} onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Despachado">Despachado</SelectItem>
                <SelectItem value="En Tránsito">En Tránsito</SelectItem>
                <SelectItem value="Entregado">Entregado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cliente">Cliente *</Label>
            <Input
              id="cliente"
              value={formData.cliente}
              onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <Label htmlFor="productos">Cantidad de Productos *</Label>
            <Input
              id="productos"
              type="number"
              min="1"
              value={formData.productos}
              onChange={(e) => setFormData(prev => ({ ...prev, productos: e.target.value }))}
              placeholder="1"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="direccion">Dirección de Entrega</Label>
            <Textarea
              id="direccion"
              value={formData.direccion}
              onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
              placeholder="Dirección completa de entrega"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="telefono">Teléfono de Contacto</Label>
            <Input
              id="telefono"
              value={formData.telefono}
              onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              placeholder="Teléfono del cliente"
            />
          </div>

          <div>
            <Label htmlFor="usuario">Usuario Responsable</Label>
            <Input
              id="usuario"
              value={formData.usuario}
              onChange={(e) => setFormData(prev => ({ ...prev, usuario: e.target.value }))}
              placeholder="Usuario responsable del despacho"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              placeholder="Observaciones adicionales sobre el despacho"
              rows={3}
            />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg mt-4">
          <h4 className="font-medium mb-2 text-green-800">Estados de la Guía:</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>Pendiente:</strong> Guía creada, pendiente de procesamiento</p>
            <p><strong>Despachado:</strong> Productos despachados del almacén</p>
            <p><strong>En Tránsito:</strong> Productos en camino al cliente</p>
            <p><strong>Entregado:</strong> Productos entregados al cliente</p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {editingGuide ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}