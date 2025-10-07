"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface KardexModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (kardexData: any) => void
  editingKardex?: any
}

export default function KardexModal({ isOpen, onClose, onSave, editingKardex }: KardexModalProps) {
  const [formData, setFormData] = useState({
    tipoMovimiento: editingKardex?.tipoMovimiento || "Entrada",
    documento: editingKardex?.documento || "",
    cantidadEntrada: editingKardex?.cantidadEntrada || 0,
    cantidadSalida: editingKardex?.cantidadSalida || 0,
    saldo: editingKardex?.saldo || 0,
    usuario: editingKardex?.usuario || "Usuario Actual",
    observaciones: editingKardex?.observaciones || "",
    producto: "",
    costoUnitario: 0,
    valorTotal: 0,
  })

  const handleSave = () => {
    if (!formData.tipoMovimiento || !formData.documento) {
      toast.error("Por favor complete todos los campos obligatorios")
      return
    }

    // Validación de cantidades según el tipo de movimiento
    if (formData.tipoMovimiento === "Entrada" && formData.cantidadEntrada <= 0) {
      toast.error("La cantidad de entrada debe ser mayor a 0")
      return
    }

    if (formData.tipoMovimiento === "Salida" && formData.cantidadSalida <= 0) {
      toast.error("La cantidad de salida debe ser mayor a 0")
      return
    }

    const kardexData = {
      ...formData,
      fecha: new Date().toISOString().slice(0, 10),
      cantidadEntrada: parseFloat(formData.cantidadEntrada.toString()) || 0,
      cantidadSalida: parseFloat(formData.cantidadSalida.toString()) || 0,
      saldo: parseFloat(formData.saldo.toString()) || 0,
      costoUnitario: parseFloat(formData.costoUnitario.toString()) || 0,
      valorTotal: parseFloat(formData.valorTotal.toString()) || 0,
    }

    onSave(kardexData)
    onClose()
    setFormData({
      tipoMovimiento: "Entrada",
      documento: "",
      cantidadEntrada: 0,
      cantidadSalida: 0,
      saldo: 0,
      usuario: "Usuario Actual",
      observaciones: "",
      producto: "",
      costoUnitario: 0,
      valorTotal: 0,
    })
    toast.success(editingKardex ? "Movimiento actualizado exitosamente" : "Movimiento creado exitosamente")
  }

  const handleCancel = () => {
    onClose()
    setFormData({
      tipoMovimiento: "Entrada",
      documento: "",
      cantidadEntrada: 0,
      cantidadSalida: 0,
      saldo: 0,
      usuario: "Usuario Actual",
      observaciones: "",
      producto: "",
      costoUnitario: 0,
      valorTotal: 0,
    })
  }

  // Calcular valor total automáticamente
  const handleQuantityChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      if (field === 'cantidadEntrada' || field === 'cantidadSalida' || field === 'costoUnitario') {
        const quantity = field === 'cantidadEntrada' ? numValue :
                        field === 'cantidadSalida' ? numValue :
                        (updated.tipoMovimiento === 'Entrada' ? updated.cantidadEntrada : updated.cantidadSalida)
        const cost = field === 'costoUnitario' ? numValue : updated.costoUnitario
        updated.valorTotal = quantity * cost
      }

      return updated
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingKardex ? "Editar Movimiento de Kardex" : "Agregar Nuevo Movimiento de Kardex"}</DialogTitle>
          <DialogDescription>
            {editingKardex ? "Actualiza la información del movimiento de inventario" : "Registra un nuevo movimiento de inventario"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tipoMovimiento">Tipo de Movimiento *</Label>
            <Select
              value={formData.tipoMovimiento}
              onValueChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  tipoMovimiento: value,
                  cantidadEntrada: value === 'Entrada' ? prev.cantidadEntrada : 0,
                  cantidadSalida: value === 'Salida' ? prev.cantidadSalida : 0
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Entrada">Entrada</SelectItem>
                <SelectItem value="Salida">Salida</SelectItem>
                <SelectItem value="Ajuste">Ajuste</SelectItem>
                <SelectItem value="Transferencia">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="documento">Documento de Referencia *</Label>
            <Input
              id="documento"
              value={formData.documento}
              onChange={(e) => setFormData(prev => ({ ...prev, documento: e.target.value }))}
              placeholder="FC-001, GD-002, etc."
            />
          </div>

          <div>
            <Label htmlFor="producto">Producto</Label>
            <Input
              id="producto"
              value={formData.producto}
              onChange={(e) => setFormData(prev => ({ ...prev, producto: e.target.value }))}
              placeholder="Nombre o código del producto"
            />
          </div>

          <div>
            <Label htmlFor="usuario">Usuario Responsable</Label>
            <Input
              id="usuario"
              value={formData.usuario}
              onChange={(e) => setFormData(prev => ({ ...prev, usuario: e.target.value }))}
              placeholder="Usuario responsable del movimiento"
            />
          </div>

          {formData.tipoMovimiento === "Entrada" && (
            <div>
              <Label htmlFor="cantidadEntrada">Cantidad de Entrada *</Label>
              <Input
                id="cantidadEntrada"
                type="number"
                min="0"
                step="0.01"
                value={formData.cantidadEntrada}
                onChange={(e) => handleQuantityChange('cantidadEntrada', e.target.value)}
                placeholder="0"
              />
            </div>
          )}

          {formData.tipoMovimiento === "Salida" && (
            <div>
              <Label htmlFor="cantidadSalida">Cantidad de Salida *</Label>
              <Input
                id="cantidadSalida"
                type="number"
                min="0"
                step="0.01"
                value={formData.cantidadSalida}
                onChange={(e) => handleQuantityChange('cantidadSalida', e.target.value)}
                placeholder="0"
              />
            </div>
          )}

          {(formData.tipoMovimiento === "Ajuste" || formData.tipoMovimiento === "Transferencia") && (
            <>
              <div>
                <Label htmlFor="cantidadEntrada">Cantidad Entrada</Label>
                <Input
                  id="cantidadEntrada"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cantidadEntrada}
                  onChange={(e) => handleQuantityChange('cantidadEntrada', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="cantidadSalida">Cantidad Salida</Label>
                <Input
                  id="cantidadSalida"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cantidadSalida}
                  onChange={(e) => handleQuantityChange('cantidadSalida', e.target.value)}
                  placeholder="0"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="costoUnitario">Costo Unitario</Label>
            <Input
              id="costoUnitario"
              type="number"
              min="0"
              step="0.01"
              value={formData.costoUnitario}
              onChange={(e) => handleQuantityChange('costoUnitario', e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="valorTotal">Valor Total</Label>
            <Input
              id="valorTotal"
              type="number"
              step="0.01"
              value={formData.valorTotal}
              onChange={(e) => setFormData(prev => ({ ...prev, valorTotal: e.target.value }))}
              placeholder="0.00"
              className="bg-gray-50"
              readOnly
            />
          </div>

          <div>
            <Label htmlFor="saldo">Saldo Resultante</Label>
            <Input
              id="saldo"
              type="number"
              step="0.01"
              value={formData.saldo}
              onChange={(e) => setFormData(prev => ({ ...prev, saldo: e.target.value }))}
              placeholder="Saldo actual después del movimiento"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              placeholder="Detalles adicionales sobre el movimiento"
              rows={3}
            />
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg mt-4">
          <h4 className="font-medium mb-2 text-amber-800">Tipos de Movimiento:</h4>
          <div className="text-sm text-amber-700 space-y-1">
            <p><strong>Entrada:</strong> Ingreso de productos al inventario</p>
            <p><strong>Salida:</strong> Salida de productos del inventario</p>
            <p><strong>Ajuste:</strong> Corrección de inventario por diferencias físicas</p>
            <p><strong>Transferencia:</strong> Movimiento entre ubicaciones</p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {editingKardex ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}