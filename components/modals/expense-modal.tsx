"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (expenseData: any) => void
  editingExpense?: any
}

export default function ExpenseModal({ isOpen, onClose, onSave, editingExpense }: ExpenseModalProps) {
  const [formData, setFormData] = useState({
    categoria: editingExpense?.categoria || "",
    subcategoria: editingExpense?.subcategoria || "",
    descripcion: editingExpense?.descripcion || "",
    monto: editingExpense?.monto || 0,
    proveedor: editingExpense?.proveedor || "",
    documento: editingExpense?.documento || "",
    estado: editingExpense?.estado || "Pendiente",
  })

  const handleSave = () => {
    if (!formData.categoria || !formData.descripcion || !formData.monto) {
      toast.error("Por favor complete todos los campos obligatorios")
      return
    }

    const expenseData = {
      ...formData,
      fecha: new Date().toISOString().slice(0, 10),
      monto: parseFloat(formData.monto.toString()) || 0,
    }

    onSave(expenseData)
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
    toast.success(editingExpense ? "Gasto actualizado exitosamente" : "Gasto creado exitosamente")
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
          <DialogTitle>{editingExpense ? "Editar Gasto" : "Agregar Nuevo Gasto"}</DialogTitle>
          <DialogDescription>
            {editingExpense ? "Actualiza la información del gasto" : "Ingresa los detalles del nuevo gasto"}
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
                <SelectItem value="Gastos Administrativos">Gastos Administrativos</SelectItem>
                <SelectItem value="Gastos de Ventas">Gastos de Ventas</SelectItem>
                <SelectItem value="Gastos Generales">Gastos Generales</SelectItem>
                <SelectItem value="Gastos Operativos">Gastos Operativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subcategoria">Subcategoría</Label>
            <Input
              id="subcategoria"
              value={formData.subcategoria}
              onChange={(e) => setFormData(prev => ({ ...prev, subcategoria: e.target.value }))}
              placeholder="Ej: Servicios Básicos, Marketing"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Describe el gasto detalladamente"
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
            <Label htmlFor="proveedor">Proveedor/Beneficiario</Label>
            <Input
              id="proveedor"
              value={formData.proveedor}
              onChange={(e) => setFormData(prev => ({ ...prev, proveedor: e.target.value }))}
              placeholder="Nombre del proveedor o beneficiario"
            />
          </div>

          <div>
            <Label htmlFor="documento">Documento</Label>
            <Input
              id="documento"
              value={formData.documento}
              onChange={(e) => setFormData(prev => ({ ...prev, documento: e.target.value }))}
              placeholder="Ej: FC-003, REC-004"
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
            {editingExpense ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}