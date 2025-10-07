"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface CostModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (costData: any) => void
  editingCost?: any
}

export default function CostModal({ isOpen, onClose, onSave, editingCost }: CostModalProps) {
  const [formData, setFormData] = useState({
    categoria: editingCost?.categoria || "",
    subcategoria: editingCost?.subcategoria || "",
    descripcion: editingCost?.descripcion || "",
    monto: editingCost?.monto || 0,
    proveedor: editingCost?.proveedor || "",
    documento: editingCost?.documento || "",
    estado: editingCost?.estado || "Pendiente",
  })

  const handleSave = () => {
    if (!formData.categoria || !formData.descripcion || !formData.monto) {
      toast.error("Por favor complete todos los campos obligatorios")
      return
    }

    const costData = {
      ...formData,
      fecha: new Date().toISOString().slice(0, 10),
      monto: parseFloat(formData.monto.toString()) || 0,
    }

    onSave(costData)
    onClose()
    setFormData({
      categoria: "",
      subcategoria: "",
      descripcion: "",
      monto: 0,
      proveedor: "",
      documento: "",
      estado: "Pendiente",
    })
    toast.success(editingCost ? "Costo actualizado exitosamente" : "Costo creado exitosamente")
  }

  const handleCancel = () => {
    onClose()
    setFormData({
      categoria: "",
      subcategoria: "",
      descripcion: "",
      monto: 0,
      proveedor: "",
      documento: "",
      estado: "Pendiente",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCost ? "Editar Costo" : "Agregar Nuevo Costo"}</DialogTitle>
          <DialogDescription>
            {editingCost ? "Actualiza la información del costo" : "Ingresa los detalles del nuevo costo"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="categoria">Categoría *</Label>
            <Select value={formData.categoria} onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Costo de Ventas">Costo de Ventas</SelectItem>
                <SelectItem value="Gastos Operativos">Gastos Operativos</SelectItem>
                <SelectItem value="Gastos Financieros">Gastos Financieros</SelectItem>
                <SelectItem value="Gastos Administrativos">Gastos Administrativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subcategoria">Subcategoría</Label>
            <Input
              id="subcategoria"
              value={formData.subcategoria}
              onChange={(e) => setFormData(prev => ({ ...prev, subcategoria: e.target.value }))}
              placeholder="Ej: Mercadería, Transporte"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Describe el costo detalladamente"
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
            <Label htmlFor="proveedor">Proveedor</Label>
            <Input
              id="proveedor"
              value={formData.proveedor}
              onChange={(e) => setFormData(prev => ({ ...prev, proveedor: e.target.value }))}
              placeholder="Nombre del proveedor"
            />
          </div>

          <div>
            <Label htmlFor="documento">Documento</Label>
            <Input
              id="documento"
              value={formData.documento}
              onChange={(e) => setFormData(prev => ({ ...prev, documento: e.target.value }))}
              placeholder="Ej: FC-001, REC-002"
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
                <SelectItem value="Aprobado">Aprobado</SelectItem>
                <SelectItem value="Pagado">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {editingCost ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}