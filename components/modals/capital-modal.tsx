"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface CapitalModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (capitalData: any) => void
  editingCapital?: any
}

export default function CapitalModal({ isOpen, onClose, onSave, editingCapital }: CapitalModalProps) {
  const [formData, setFormData] = useState({
    tipo: editingCapital?.tipo || "",
    descripcion: editingCapital?.descripcion || "",
    monto: editingCapital?.monto || 0,
    origen: editingCapital?.origen || "",
    documento: editingCapital?.documento || "",
    estado: editingCapital?.estado || "Registrado",
  })

  const handleSave = () => {
    if (!formData.tipo || !formData.descripcion || !formData.monto) {
      toast.error("Por favor complete todos los campos obligatorios")
      return
    }

    const capitalData = {
      ...formData,
      fecha: new Date().toISOString().slice(0, 10),
      monto: parseFloat(formData.monto.toString()) || 0,
    }

    onSave(capitalData)
    onClose()
    setFormData({
      tipo: "",
      descripcion: "",
      monto: 0,
      origen: "",
      documento: "",
      estado: "Registrado",
    })
    toast.success(editingCapital ? "Capital actualizado exitosamente" : "Capital creado exitosamente")
  }

  const handleCancel = () => {
    onClose()
    setFormData({
      tipo: "",
      descripcion: "",
      monto: 0,
      origen: "",
      documento: "",
      estado: "Registrado",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCapital ? "Editar Movimiento de Capital" : "Agregar Nuevo Movimiento de Capital"}</DialogTitle>
          <DialogDescription>
            {editingCapital ? "Actualiza la información del movimiento de capital" : "Ingresa los detalles del nuevo movimiento de capital"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tipo">Tipo de Movimiento *</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aporte de Capital">Aporte de Capital</SelectItem>
                <SelectItem value="Préstamo Bancario">Préstamo Bancario</SelectItem>
                <SelectItem value="Inversión">Inversión</SelectItem>
                <SelectItem value="Línea de Crédito">Línea de Crédito</SelectItem>
                <SelectItem value="Retiro de Capital">Retiro de Capital</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="origen">Origen/Fuente *</Label>
            <Input
              id="origen"
              value={formData.origen}
              onChange={(e) => setFormData(prev => ({ ...prev, origen: e.target.value }))}
              placeholder="Ej: Socio A, Banco Nacional"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Describe detalladamente el movimiento de capital"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="monto">Monto *</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0"
              value={formData.monto}
              onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="documento">Documento de Respaldo</Label>
            <Input
              id="documento"
              value={formData.documento}
              onChange={(e) => setFormData(prev => ({ ...prev, documento: e.target.value }))}
              placeholder="Ej: AC-001, PB-001"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={formData.estado} onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Registrado">Registrado</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mt-4">
          <h4 className="font-medium mb-2 text-blue-800">Información Adicional:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Aporte de Capital:</strong> Dinero invertido por socios o accionistas</p>
            <p><strong>Préstamo Bancario:</strong> Financiamiento externo con obligación de pago</p>
            <p><strong>Inversión:</strong> Capital destinado a activos productivos</p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {editingCapital ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}