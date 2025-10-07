"use client"

import { useState } from "react"
import { BarChart3, TrendingUp, Package, AlertTriangle, Download, Calendar, X, Eye, Target, Box, Layers, Activity, Archive } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ReportsModule() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [reportsOrder, setReportsOrder] = useState([
    {
      id: 'inventario-general',
      title: 'Inventario General',
      description: 'Estado completo del inventario por categorías, valores y rotación',
      color: 'blue',
      icon: 'Package'
    },
    {
      id: 'rotacion-detallada', 
      title: 'Análisis de Rotación',
      description: 'Rotación detallada por producto, días de venta y clasificación ABC',
      color: 'green',
      icon: 'TrendingUp'
    },
    {
      id: 'stock-critico',
      title: 'Stock Crítico',
      description: 'Productos con stock bajo, crítico y recomendaciones de reposición',
      color: 'red', 
      icon: 'AlertTriangle'
    },
    {
      id: 'analisis-abc',
      title: 'Análisis ABC',
      description: 'Clasificación de productos por valor y estrategias de gestión',
      color: 'purple',
      icon: 'Target'
    },
    {
      id: 'proveedores-inventario',
      title: 'Análisis de Proveedores', 
      description: 'Desempeño de proveedores, tiempos de entrega y optimización',
      color: 'orange',
      icon: 'Box'
    },
    {
      id: 'valorizacion-detallada',
      title: 'Valorización Detallada',
      description: 'Valorización completa del inventario con métodos FIFO, LIFO y promedio',
      color: 'indigo',
      icon: 'Archive'
    },
    {
      id: 'producto-detallado',
      title: 'Reporte Producto por Producto',
      description: 'Análisis exhaustivo individual de cada producto con toda su información detallada',
      color: 'teal',
      icon: 'Package'
    }
  ])

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedItem === null) return

    const newOrder = [...reportsOrder]
    const draggedReport = newOrder[draggedItem]
    
    // Remove the dragged item
    newOrder.splice(draggedItem, 1)
    // Insert it at the new position
    newOrder.splice(dropIndex, 0, draggedReport)
    
    setReportsOrder(newOrder)
    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const getIconComponent = (iconName: string) => {
    const icons = {
      Package,
      TrendingUp, 
      AlertTriangle,
      Target,
      Box,
      Archive
    }
    const IconComponent = icons[iconName as keyof typeof icons] || Package
    return IconComponent
  }

  // Datos del inventario actual
  const inventoryReportData = [
    {
      categoria: "Electrónicos",
      productos: 45,
      valorTotal: "$128,500.00",
      stockDisponible: 312,
      stockBajo: 8,
      stockOptimo: 420,
      rotacion: "Alta",
      valorUnitarioPromedio: 285.56,
      costoPromedio: 198.89,
      margenPromedio: 30.3
    },
    {
      categoria: "Accesorios", 
      productos: 23,
      valorTotal: "$15,750.00",
      stockDisponible: 187,
      stockBajo: 3,
      stockOptimo: 250,
      rotacion: "Media",
      valorUnitarioPromedio: 84.22,
      costoPromedio: 59.95,
      margenPromedio: 28.8
    },
    {
      categoria: "Oficina",
      productos: 31,
      valorTotal: "$22,890.00",
      stockDisponible: 156,
      stockBajo: 12,
      stockOptimo: 200,
      rotacion: "Baja",
      valorUnitarioPromedio: 146.73,
      costoPromedio: 108.22,
      margenPromedio: 26.2
    },
    {
      categoria: "Herramientas",
      productos: 18,
      valorTotal: "$8,340.00",
      stockDisponible: 89,
      stockBajo: 5,
      stockOptimo: 120,
      rotacion: "Media",
      valorUnitarioPromedio: 93.71,
      costoPromedio: 71.18,
      margenPromedio: 24.0
    }
  ]

  // Análisis de rotación por producto
  const rotacionReportData = [
    {
      producto: "Laptop Dell Inspiron",
      codigo: "LDI-001",
      categoria: "Electrónicos",
      rotacion: 12.5,
      ventasUltimoMes: 25,
      stockPromedio: 48,
      stockActual: 45,
      clasificacion: "Rápida",
      diasVenta: 29,
      puntoPedido: 35,
      valorInventario: 38250
    },
    {
      producto: "Mouse Logitech MX",
      codigo: "MLX-002",
      categoria: "Accesorios",
      rotacion: 8.3,
      ventasUltimoMes: 42,
      stockPromedio: 125,
      stockActual: 120,
      clasificacion: "Rápida",
      diasVenta: 44,
      puntoPedido: 65,
      valorInventario: 7800
    },
    {
      producto: 'Monitor Samsung 24"',
      codigo: "MSM-003",
      categoria: "Electrónicos",
      rotacion: 2.1,
      ventasUltimoMes: 8,
      stockPromedio: 15,
      stockActual: 8,
      clasificacion: "Lenta",
      diasVenta: 174,
      puntoPedido: 12,
      valorInventario: 2240
    },
    {
      producto: "Teclado Mecánico RGB",
      codigo: "TCL-004",
      categoria: "Accesorios",
      rotacion: 6.8,
      ventasUltimoMes: 18,
      stockPromedio: 32,
      stockActual: 25,
      clasificacion: "Media",
      diasVenta: 54,
      puntoPedido: 20,
      valorInventario: 3000
    }
  ]

  // Análisis ABC del inventario
  const abcAnalysisData = [
    { categoria: "A", productos: 23, porcentaje: 19.7, valorTotal: "$110,280", descripcion: "Alto valor y rotación" },
    { categoria: "B", productos: 47, porcentaje: 40.2, valorTotal: "$48,650", descripcion: "Valor medio y rotación media" },
    { categoria: "C", productos: 47, porcentaje: 40.1, valorTotal: "$16,550", descripcion: "Bajo valor pero necesarios" }
  ]

  // Tendencia mensual del inventario
  const monthlyInventoryTrend = [
    { mes: 'Ene', entradas: 1250, salidas: 980, valorTotal: 165000, rotacion: 7.8 },
    { mes: 'Feb', entradas: 1380, salidas: 1120, valorTotal: 168500, rotacion: 8.2 },
    { mes: 'Mar', entradas: 950, salidas: 1340, valorTotal: 159800, rotacion: 8.9 },
    { mes: 'Abr', entradas: 1580, salidas: 1180, valorTotal: 170200, rotacion: 8.1 },
    { mes: 'May', entradas: 1220, salidas: 1450, valorTotal: 163400, rotacion: 9.3 },
    { mes: 'Jun', entradas: 1650, salidas: 1280, valorTotal: 175800, rotacion: 8.7 },
    { mes: 'Jul', entradas: 1450, salidas: 1520, valorTotal: 172100, rotacion: 9.1 },
    { mes: 'Ago', entradas: 1320, salidas: 1380, valorTotal: 169800, rotacion: 8.9 },
    { mes: 'Sep', entradas: 1520, salidas: 1250, rotacion: 8.4, valorTotal: 173500 },
    { mes: 'Oct', entradas: 1680, salidas: 1420, valorTotal: 178200, rotacion: 8.8 },
    { mes: 'Nov', entradas: 1420, salidas: 1580, valorTotal: 174600, rotacion: 9.2 },
    { mes: 'Dic', entradas: 1850, salidas: 1680, valorTotal: 175480, rotacion: 8.9 }
  ]

  // Productos con stock crítico
  const stockCriticoData = [
    {
      producto: "Webcam HD 1080p",
      codigo: "WCH-005",
      stockActual: 4,
      stockMinimo: 10,
      stockOptimo: 25,
      diasSinVenta: 0,
      proximoPedido: "Inmediato",
      proveedor: "TechSupply",
      estado: "Crítico"
    },
    {
      producto: 'Monitor Samsung 24"',
      codigo: "MSM-003",
      stockActual: 8,
      stockMinimo: 12,
      stockOptimo: 30,
      diasSinVenta: 3,
      proximoPedido: "2 días",
      proveedor: "Samsung Dist",
      estado: "Crítico"
    },
    {
      producto: "Impresora HP LaserJet",
      codigo: "IHP-006",
      stockActual: 6,
      stockMinimo: 8,
      stockOptimo: 20,
      diasSinVenta: 1,
      proximoPedido: "5 días",
      proveedor: "HP Direct",
      estado: "Bajo"
    }
  ]

  // Análisis de proveedores por inventario
  const proveedorAnalysisData = [
    {
      proveedor: "Dell Inc",
      productos: 12,
      valorTotal: "$85,400",
      tiempoEntrega: "5-7 días",
      confiabilidad: "Alta",
      descuentoPromedio: "8%",
      ultimaCompra: "2024-01-15"
    },
    {
      proveedor: "Logitech Corp", 
      productos: 8,
      valorTotal: "$24,600",
      tiempoEntrega: "3-5 días", 
      confiabilidad: "Alta",
      descuentoPromedio: "12%",
      ultimaCompra: "2024-01-20"
    },
    {
      proveedor: "Samsung Electronics",
      productos: 6,
      valorTotal: "$31,200",
      tiempoEntrega: "7-10 días",
      confiabilidad: "Media",
      descuentoPromedio: "5%",
      ultimaCompra: "2024-01-10"
    }
  ]

  // Reporte detallado producto por producto
  const productDetailData = [
    {
      id: 1,
      sku: "LDI-001",
      nombre: "Laptop Dell Inspiron",
      categoria: "Electrónicos",
      stockActual: 45,
      stockMinimo: 35,
      stockOptimo: 60,
      puntoReorden: 40,
      rotacionAnual: 12.5,
      diasInventario: 29,
      ventasAcumuladas: 1285, // Total desde inicio
      ubicacionAlmacen: "A-15-B",
      proveedor: "Dell Inc",
      ultimaCompra: "2024-01-15",
      proximaRevision: "2024-02-10",
      estado: "Activo",
      observaciones: "Producto estrella, alta demanda",
      fechaIngreso: "2023-05-10",
      fechaUltimaVenta: "2024-01-22",
      garantia: "2 años",
      peso: "2.5 kg",
      dimensiones: "35.6 x 25.1 x 2.3 cm"
    },
    {
      id: 2,
      sku: "MLX-002",
      nombre: "Mouse Logitech MX",
      categoria: "Accesorios",
      stockActual: 120,
      stockMinimo: 65,
      stockOptimo: 150,
      puntoReorden: 80,
      rotacionAnual: 8.3,
      diasInventario: 44,
      ventasAcumuladas: 2847, // Total desde inicio
      ubicacionAlmacen: "B-08-C",
      proveedor: "Logitech Corp",
      ultimaCompra: "2024-01-20",
      proximaRevision: "2024-02-15",
      estado: "Activo",
      observaciones: "Buena rotación, stock estable",
      fechaIngreso: "2023-08-15",
      fechaUltimaVenta: "2024-01-23",
      garantia: "3 años",
      peso: "0.11 kg",
      dimensiones: "12.5 x 6.6 x 4.2 cm"
    },
    {
      id: 3,
      sku: "MSM-003",
      nombre: 'Monitor Samsung 24"',
      categoria: "Electrónicos",
      stockActual: 8,
      stockMinimo: 12,
      stockOptimo: 30,
      puntoReorden: 15,
      rotacionAnual: 2.1,
      diasInventario: 174,
      ventasAcumuladas: 156, // Total desde inicio
      ubicacionAlmacen: "A-22-A",
      proveedor: "Samsung Electronics",
      ultimaCompra: "2024-01-10",
      proximaRevision: "2024-02-05",
      estado: "Stock Crítico",
      observaciones: "Baja rotación, evaluar descontinuar",
      fechaIngreso: "2023-11-20",
      fechaUltimaVenta: "2024-01-18",
      garantia: "1 año",
      peso: "3.8 kg",
      dimensiones: "53.9 x 32.3 x 6.8 cm"
    },
    {
      id: 4,
      sku: "TCL-004",
      nombre: "Teclado Mecánico RGB",
      categoria: "Accesorios",
      stockActual: 25,
      stockMinimo: 20,
      stockOptimo: 40,
      puntoReorden: 25,
      rotacionAnual: 6.8,
      diasInventario: 54,
      ventasAcumuladas: 892, // Total desde inicio
      ubicacionAlmacen: "B-12-D",
      proveedor: "TechKeys Ltd",
      ultimaCompra: "2024-01-18",
      proximaRevision: "2024-02-12",
      estado: "Activo",
      observaciones: "Demanda estacional, incrementa en diciembre",
      fechaIngreso: "2023-07-30",
      fechaUltimaVenta: "2024-01-21",
      garantia: "2 años",
      peso: "1.2 kg",
      dimensiones: "44 x 13.8 x 4.5 cm"
    },
    {
      id: 5,
      sku: "WCH-005",
      nombre: "Webcam HD 1080p",
      categoria: "Electrónicos",
      stockActual: 4,
      stockMinimo: 10,
      stockOptimo: 25,
      puntoReorden: 12,
      rotacionAnual: 15.2,
      diasInventario: 24,
      ventasAcumuladas: 1547, // Total desde inicio
      ubicacionAlmacen: "C-05-A",
      proveedor: "TechSupply",
      ultimaCompra: "2023-12-20",
      proximaRevision: "2024-01-25",
      estado: "Stock Crítico",
      observaciones: "URGENTE: Reabastecer inmediatamente",
      fechaIngreso: "2023-04-12",
      fechaUltimaVenta: "2024-01-23",
      garantia: "1 año",
      peso: "0.15 kg",
      dimensiones: "9.4 x 2.7 x 2.7 cm"
    },
    {
      id: 6,
      sku: "IHP-006",
      nombre: "Impresora HP LaserJet",
      categoria: "Oficina",
      stockActual: 6,
      stockMinimo: 8,
      stockOptimo: 20,
      puntoReorden: 10,
      rotacionAnual: 4.5,
      diasInventario: 81,
      ventasAcumuladas: 287, // Total desde inicio
      ubicacionAlmacen: "D-10-B",
      proveedor: "HP Direct",
      ultimaCompra: "2024-01-08",
      proximaRevision: "2024-02-20",
      estado: "Stock Bajo",
      observaciones: "Producto corporativo, ventas B2B",
      fechaIngreso: "2023-09-05",
      fechaUltimaVenta: "2024-01-19",
      garantia: "3 años",
      peso: "7.2 kg",
      dimensiones: "38.5 x 33.6 x 18.3 cm"
    }
  ]

  const categoryDistributionData = [
    { name: 'Electrónicos', value: 68.5, color: '#3B82F6', productos: 45 },
    { name: 'Oficina', value: 12.2, color: '#10B981', productos: 31 },
    { name: 'Accesorios', value: 8.4, color: '#F59E0B', productos: 23 },
    { name: 'Herramientas', value: 4.4, color: '#EF4444', productos: 18 },
    { name: 'Otros', value: 6.5, color: '#8B5CF6', productos: 12 }
  ]

  const inventoryKPIs = {
    totalProductos: 117,
    valorTotalInventario: 175480,
    rotacionPromedio: 8.9,
    diasInventarioPromedio: 41,
    stockCritico: 15,
    eficienciaAlmacen: 87.5,
    precisicionInventario: 98.2,
    costoPorUnidad: 142.75,
    margenPromedioCategoria: 27.8
  }

  const renderReportModal = () => {
    if (!selectedReport) return null

    let reportContent = null
    let reportTitle = ""

    switch (selectedReport) {
      case "inventario-general":
        reportTitle = "Reporte General de Inventario"
        reportContent = (
          <div className="space-y-6">
            {/* KPIs principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Total Productos</h3>
                <p className="text-2xl font-bold text-blue-600">{inventoryKPIs.totalProductos}</p>
                <p className="text-sm text-blue-600">SKUs activos</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Valor Total</h3>
                <p className="text-2xl font-bold text-green-600">${inventoryKPIs.valorTotalInventario.toLocaleString()}</p>
                <p className="text-sm text-green-600">Valorización actual</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800">Rotación Promedio</h3>
                <p className="text-2xl font-bold text-purple-600">{inventoryKPIs.rotacionPromedio}x</p>
                <p className="text-sm text-purple-600">Veces por año</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800">Stock Crítico</h3>
                <p className="text-2xl font-bold text-red-600">{inventoryKPIs.stockCritico}</p>
                <p className="text-sm text-red-600">Productos críticos</p>
              </div>
            </div>

            {/* Tabla por categorías */}
            <Card>
              <CardHeader>
                <CardTitle>Inventario por Categorías</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Stock Disponible</TableHead>
                      <TableHead>Stock Óptimo</TableHead>
                      <TableHead>Rotación</TableHead>
                      <TableHead>Margen %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryReportData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.categoria}</TableCell>
                        <TableCell>{item.productos}</TableCell>
                        <TableCell>{item.valorTotal}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{item.stockDisponible}</span>
                            <Badge variant={item.stockDisponible < item.stockOptimo * 0.7 ? "destructive" : "default"}>
                              {((item.stockDisponible / item.stockOptimo) * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{item.stockOptimo}</TableCell>
                        <TableCell>
                          <Badge variant={
                            item.rotacion === "Alta" ? "default" : 
                            item.rotacion === "Media" ? "secondary" : "destructive"
                          }>
                            {item.rotacion}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.margenPromedio}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución del Inventario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={categoryDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          dataKey="value"
                        >
                          {categoryDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`${value}%`, 'Valor del Inventario']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendencia de Rotación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer>
                      <LineChart data={monthlyInventoryTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="rotacion" stroke="#3B82F6" strokeWidth={3} name="Rotación" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
        break

      case "rotacion-detallada":
        reportTitle = "Análisis de Rotación de Inventario"
        reportContent = (
          <div className="space-y-6">
            {/* Métricas clave */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Rotación Alta</h3>
                <p className="text-2xl font-bold text-green-600">
                  {rotacionReportData.filter(p => p.clasificacion === "Rápida").length}
                </p>
                <p className="text-sm text-green-600">productos</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800">Rotación Media</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {rotacionReportData.filter(p => p.clasificacion === "Media").length}
                </p>
                <p className="text-sm text-yellow-600">productos</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800">Rotación Lenta</h3>
                <p className="text-2xl font-bold text-red-600">
                  {rotacionReportData.filter(p => p.clasificacion === "Lenta").length}
                </p>
                <p className="text-sm text-red-600">productos</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Días Prom. Venta</h3>
                <p className="text-2xl font-bold text-blue-600">{inventoryKPIs.diasInventarioPromedio}</p>
                <p className="text-sm text-blue-600">días</p>
              </div>
            </div>

            {/* Tabla detallada */}
            <Card>
              <CardHeader>
                <CardTitle>Análisis Detallado por Producto</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Rotación Anual</TableHead>
                      <TableHead>Ventas/Mes</TableHead>
                      <TableHead>Stock Actual</TableHead>
                      <TableHead>Días Venta</TableHead>
                      <TableHead>Punto Pedido</TableHead>
                      <TableHead>Clasificación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rotacionReportData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.producto}</TableCell>
                        <TableCell className="font-mono">{item.codigo}</TableCell>
                        <TableCell>{item.rotacion}x</TableCell>
                        <TableCell>{item.ventasUltimoMes}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{item.stockActual}</span>
                            {item.stockActual <= item.puntoPedido && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.diasVenta} días</TableCell>
                        <TableCell>{item.puntoPedido}</TableCell>
                        <TableCell>
                          <Badge variant={
                            item.clasificacion === "Rápida" ? "default" : 
                            item.clasificacion === "Media" ? "secondary" : "destructive"
                          }>
                            {item.clasificacion}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Gráfico de rotación */}
            <Card>
              <CardHeader>
                <CardTitle>Rotación Mensual del Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: '400px' }}>
                  <ResponsiveContainer>
                    <AreaChart data={monthlyInventoryTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="entradas" 
                        stackId="1" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        name="Entradas"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="salidas" 
                        stackId="2" 
                        stroke="#EF4444" 
                        fill="#EF4444" 
                        name="Salidas"
                      />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )
        break

      case "stock-critico":
        reportTitle = "Reporte de Stock Crítico"
        reportContent = (
          <div className="space-y-6">
            {/* Alertas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-800">Stock Crítico</h3>
                <p className="text-2xl font-bold text-red-600">
                  {stockCriticoData.filter(p => p.estado === "Crítico").length}
                </p>
                <p className="text-sm text-red-600">Requiere acción inmediata</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-800">Stock Bajo</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {stockCriticoData.filter(p => p.estado === "Bajo").length}
                </p>
                <p className="text-sm text-yellow-600">Monitorear de cerca</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800">Total Revisados</h3>
                <p className="text-2xl font-bold text-blue-600">{stockCriticoData.length}</p>
                <p className="text-sm text-blue-600">productos analizados</p>
              </div>
            </div>

            {/* Tabla de productos críticos */}
            <Card>
              <CardHeader>
                <CardTitle>Productos con Stock Crítico/Bajo</CardTitle>
                <CardDescription>Productos que requieren reposición urgente</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Stock Actual</TableHead>
                      <TableHead>Stock Mínimo</TableHead>
                      <TableHead>Stock Óptimo</TableHead>
                      <TableHead>Días sin Venta</TableHead>
                      <TableHead>Próximo Pedido</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockCriticoData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.producto}</TableCell>
                        <TableCell className="font-mono">{item.codigo}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={item.estado === "Crítico" ? "text-red-600 font-bold" : "text-yellow-600 font-bold"}>
                              {item.stockActual}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{item.stockMinimo}</TableCell>
                        <TableCell>{item.stockOptimo}</TableCell>
                        <TableCell>
                          {item.diasSinVenta === 0 ? (
                            <Badge variant="destructive">En venta</Badge>
                          ) : (
                            <span>{item.diasSinVenta} días</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.proximoPedido === "Inmediato" ? "destructive" : "secondary"}>
                            {item.proximoPedido}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.proveedor}</TableCell>
                        <TableCell>
                          <Badge variant={item.estado === "Crítico" ? "destructive" : "secondary"}>
                            {item.estado}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recomendaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Recomendadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-3">⚠️ Acción Inmediata</h4>
                    <ul className="text-sm text-red-700 space-y-2">
                      {stockCriticoData.filter(p => p.estado === "Crítico").map((item, index) => (
                        <li key={index}>• Pedir {item.producto} - Stock: {item.stockActual}/{item.stockOptimo}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-3">📋 Programar Pedidos</h4>
                    <ul className="text-sm text-yellow-700 space-y-2">
                      {stockCriticoData.filter(p => p.estado === "Bajo").map((item, index) => (
                        <li key={index}>• {item.producto} en {item.proximoPedido}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
        break

      case "analisis-abc":
        reportTitle = "Análisis ABC del Inventario"
        reportContent = (
          <div className="space-y-6">
            {/* Resumen ABC */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {abcAnalysisData.map((item, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  item.categoria === 'A' ? 'bg-green-50 border-green-200' :
                  item.categoria === 'B' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <h3 className={`font-semibold text-lg ${
                    item.categoria === 'A' ? 'text-green-800' :
                    item.categoria === 'B' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>Categoría {item.categoria}</h3>
                  <p className={`text-2xl font-bold ${
                    item.categoria === 'A' ? 'text-green-600' :
                    item.categoria === 'B' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>{item.productos} productos</p>
                  <p className="text-sm text-gray-600">{item.porcentaje}% del inventario</p>
                  <p className="text-sm font-medium">{item.valorTotal}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.descripcion}</p>
                </div>
              ))}
            </div>

            {/* Estrategias por categoría */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800">Estrategia Categoría A</CardTitle>
                  <CardDescription>Productos de alto valor y rotación</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-green-700">
                    <li>• Control estricto de inventario</li>
                    <li>• Revisión semanal de stock</li>
                    <li>• Negociación directa con proveedores</li>
                    <li>• Sistema de reposición automática</li>
                    <li>• Análisis diario de demanda</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-yellow-800">Estrategia Categoría B</CardTitle>
                  <CardDescription>Productos de valor medio</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-yellow-700">
                    <li>• Control moderado</li>
                    <li>• Revisión quincenal</li>
                    <li>• Pedidos programados</li>
                    <li>• Análisis mensual de tendencias</li>
                    <li>• Optimización de lotes</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">Estrategia Categoría C</CardTitle>
                  <CardDescription>Productos de bajo valor</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-blue-700">
                    <li>• Control básico</li>
                    <li>• Revisión mensual</li>
                    <li>• Pedidos por volumen</li>
                    <li>• Stocks de seguridad amplios</li>
                    <li>• Simplificar manejo</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico ABC */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución ABC del Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: '400px' }}>
                  <ResponsiveContainer>
                    <BarChart data={abcAnalysisData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoria" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'productos') return [value, 'Productos']
                        if (name === 'porcentaje') return [value + '%', 'Porcentaje']
                        return [value, name]
                      }} />
                      <Legend />
                      <Bar dataKey="productos" fill="#3B82F6" name="Productos" />
                      <Bar dataKey="porcentaje" fill="#10B981" name="Porcentaje del Total" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )
        break

      case "proveedores-inventario":
        reportTitle = "Análisis de Proveedores e Inventario"
        reportContent = (
          <div className="space-y-6">
            {/* Métricas de proveedores */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Proveedores Activos</h3>
                <p className="text-2xl font-bold text-blue-600">{proveedorAnalysisData.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Valor Total Compras</h3>
                <p className="text-2xl font-bold text-green-600">$141,200</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800">Tiempo Prom. Entrega</h3>
                <p className="text-2xl font-bold text-purple-600">6.3 días</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800">Descuento Prom.</h3>
                <p className="text-2xl font-bold text-orange-600">8.3%</p>
              </div>
            </div>

            {/* Tabla de proveedores */}
            <Card>
              <CardHeader>
                <CardTitle>Análisis Detallado de Proveedores</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Tiempo Entrega</TableHead>
                      <TableHead>Confiabilidad</TableHead>
                      <TableHead>Descuento Prom.</TableHead>
                      <TableHead>Última Compra</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proveedorAnalysisData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.proveedor}</TableCell>
                        <TableCell>{item.productos}</TableCell>
                        <TableCell>{item.valorTotal}</TableCell>
                        <TableCell>{item.tiempoEntrega}</TableCell>
                        <TableCell>
                          <Badge variant={
                            item.confiabilidad === "Alta" ? "default" :
                            item.confiabilidad === "Media" ? "secondary" : "destructive"
                          }>
                            {item.confiabilidad}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.descuentoPromedio}</TableCell>
                        <TableCell>{item.ultimaCompra}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recomendaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Optimización de Proveedores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-3">✅ Proveedores Recomendados</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Dell Inc: Alta confiabilidad y buen volumen</li>
                      <li>• Logitech Corp: Mejor tiempo de entrega</li>
                      <li>• Evaluar más descuentos por volumen</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-3">⚠️ Áreas de Mejora</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Samsung: Mejorar tiempos de entrega</li>
                      <li>• Diversificar proveedores categoría A</li>
                      <li>• Negociar mejores términos de pago</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
        break

      case "producto-detallado":
        reportTitle = "Reporte Detallado Producto por Producto"
        reportContent = (
          <div className="space-y-6">
            {/* Resumen general */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">Total Productos</h3>
                <p className="text-2xl font-bold text-blue-600">{productDetailData.length}</p>
                <p className="text-sm text-blue-600">en análisis detallado</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Ventas Acumuladas</h3>
                <p className="text-2xl font-bold text-green-600">
                  {productDetailData.reduce((sum, p) => sum + p.ventasAcumuladas, 0).toLocaleString()}
                </p>
                <p className="text-sm text-green-600">unidades hasta el momento</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800">Stock Total</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {productDetailData.reduce((sum, p) => sum + p.stockActual, 0)}
                </p>
                <p className="text-sm text-orange-600">unidades en inventario</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800">Productos Críticos</h3>
                <p className="text-2xl font-bold text-red-600">
                  {productDetailData.filter(p => p.estado.includes('Crítico')).length}
                </p>
                <p className="text-sm text-red-600">requieren atención</p>
              </div>
            </div>

            {/* Filtros para el reporte */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Búsqueda</CardTitle>
                <CardDescription>Filtra los productos para análisis específico</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input placeholder="Buscar por SKU o nombre..." />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      <SelectItem value="electronicos">Electrónicos</SelectItem>
                      <SelectItem value="accesorios">Accesorios</SelectItem>
                      <SelectItem value="oficina">Oficina</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="critico">Stock Crítico</SelectItem>
                      <SelectItem value="bajo">Stock Bajo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="dell">Dell Inc</SelectItem>
                      <SelectItem value="logitech">Logitech Corp</SelectItem>
                      <SelectItem value="samsung">Samsung Electronics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabla detallada producto por producto */}
            <Card>
              <CardHeader>
                <CardTitle>Detalle Completo por Producto</CardTitle>
                <CardDescription>Información exhaustiva de cada producto en inventario</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Rotación</TableHead>
                        <TableHead>Días Inv.</TableHead>
                        <TableHead>Ventas Totales</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Última Venta</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productDetailData.map((product, index) => (
                        <TableRow key={index} className="hover:bg-gray-50">
                          <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                          <TableCell className="font-medium max-w-[150px]">
                            <div>
                              <p className="font-semibold truncate">{product.nombre}</p>
                              <p className="text-xs text-gray-500">ID: {product.id}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.categoria}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <p className="font-bold text-lg">{product.stockActual}</p>
                              <div className="flex justify-center gap-1 text-xs">
                                <span className="text-gray-500">Min: {product.stockMinimo}</span>
                                <span className="text-blue-600">Opt: {product.stockOptimo}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div 
                                  className={`h-1 rounded-full ${
                                    product.stockActual <= product.stockMinimo ? 'bg-red-500' :
                                    product.stockActual <= product.puntoReorden ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min((product.stockActual / product.stockOptimo) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <p className="font-bold">{product.rotacionAnual}x</p>
                              <Badge variant={
                                product.rotacionAnual > 10 ? "default" :
                                product.rotacionAnual > 5 ? "secondary" : "destructive"
                              } className="text-xs">
                                {product.rotacionAnual > 10 ? "Alta" : product.rotacionAnual > 5 ? "Media" : "Baja"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {product.diasInventario} días
                          </TableCell>
                          <TableCell className="text-center">
                            <div>
                              <p className="font-bold text-lg text-blue-600">{product.ventasAcumuladas.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">unidades totales</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm font-bold text-blue-600">
                            {product.ubicacionAlmacen}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>
                              <p className="font-medium">{product.proveedor}</p>
                              <p className="text-xs text-gray-500">Última: {product.ultimaCompra}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>
                              <p className="font-medium">{product.fechaUltimaVenta}</p>
                              <p className="text-xs text-gray-500">última venta</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              product.estado === "Activo" ? "default" :
                              product.estado.includes("Crítico") ? "destructive" : "secondary"
                            }>
                              {product.estado}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Sección de productos individuales expandidos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {productDetailData.slice(0, 4).map((product) => (
                <Card key={product.id} className={`${
                  product.estado.includes('Crítico') ? 'border-red-300 bg-red-50' :
                  product.estado.includes('Bajo') ? 'border-yellow-300 bg-yellow-50' : 
                  'border-gray-200'
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{product.nombre}</span>
                      <Badge variant={
                        product.estado === "Activo" ? "default" :
                        product.estado.includes("Crítico") ? "destructive" : "secondary"
                      }>
                        {product.estado}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="font-mono">{product.sku}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold mb-2 text-green-700">📦 Stock & Almacén</h4>
                        <p><strong>Stock Actual:</strong> <span className={product.stockActual <= product.stockMinimo ? 'text-red-600 font-bold' : 'font-semibold'}>{product.stockActual}</span></p>
                        <p><strong>Stock Mínimo:</strong> {product.stockMinimo}</p>
                        <p><strong>Stock Óptimo:</strong> {product.stockOptimo}</p>
                        <p><strong>Ubicación:</strong> <span className="font-mono text-blue-600">{product.ubicacionAlmacen}</span></p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-purple-700">📈 Rendimiento & Ventas</h4>
                        <p><strong>Rotación:</strong> {product.rotacionAnual}x/año</p>
                        <p><strong>Días Inventario:</strong> {product.diasInventario}</p>
                        <p><strong>Ventas Totales:</strong> <span className="text-blue-600 font-bold">{product.ventasAcumuladas.toLocaleString()}</span></p>
                        <p><strong>Última Venta:</strong> {product.fechaUltimaVenta}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-orange-700">🏢 Proveedor & Fechas</h4>
                        <p><strong>Proveedor:</strong> {product.proveedor}</p>
                        <p><strong>Última Compra:</strong> {product.ultimaCompra}</p>
                        <p><strong>Próx. Revisión:</strong> {product.proximaRevision}</p>
                        <p><strong>Garantía:</strong> {product.garantia}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-blue-700">📋 Especificaciones</h4>
                        <p><strong>Peso:</strong> {product.peso}</p>
                        <p><strong>Dimensiones:</strong> {product.dimensiones}</p>
                        <p><strong>Ingreso:</strong> {product.fechaIngreso}</p>
                        <p><strong>Categoría:</strong> {product.categoria}</p>
                      </div>
                    </div>
                    {product.observaciones && (
                      <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                        <p className="text-sm"><strong>📝 Observaciones:</strong></p>
                        <p className="text-sm text-gray-700 mt-1">{product.observaciones}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Análisis y recomendaciones */}
            <Card>
              <CardHeader>
                <CardTitle>🎯 Análisis y Recomendaciones por Producto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-3">⚠️ Acción Inmediata</h4>
                    <ul className="text-sm text-red-700 space-y-2">
                      {productDetailData.filter(p => p.estado.includes('Crítico')).map((product, index) => (
                        <li key={index} className="border-b border-red-200 pb-2">
                          <p className="font-semibold">{product.nombre}</p>
                          <p>Stock: {product.stockActual}/{product.stockOptimo} - Ubicación: {product.ubicacionAlmacen}</p>
                          <p className="text-xs">Proveedor: {product.proveedor}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-3">📋 Monitoreo Cercano</h4>
                    <ul className="text-sm text-yellow-700 space-y-2">
                      {productDetailData.filter(p => p.estado.includes('Bajo')).map((product, index) => (
                        <li key={index} className="border-b border-yellow-200 pb-2">
                          <p className="font-semibold">{product.nombre}</p>
                          <p>Stock: {product.stockActual}/{product.stockOptimo} - Rotación: {product.rotacionAnual}x</p>
                          <p className="text-xs">Próxima revisión: {product.proximaRevision}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3">✅ Productos Destacados</h4>
                    <ul className="text-sm text-green-700 space-y-2">
                      {productDetailData.filter(p => p.rotacionAnual > 10).map((product, index) => (
                        <li key={index} className="border-b border-green-200 pb-2">
                          <p className="font-semibold">{product.nombre}</p>
                          <p>Rotación: {product.rotacionAnual}x - Ventas: {product.ventasAcumuladas.toLocaleString()}</p>
                          <p className="text-xs">Ubicación: {product.ubicacionAlmacen} - Stock: {product.stockActual}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
        break

      default:
        reportContent = <div className="text-center py-8">Reporte en desarrollo...</div>
        break
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-7xl max-h-[90vh] overflow-auto w-full mx-4">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-2xl font-bold">{reportTitle}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4 text-sm text-gray-500">
              Generado el: {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES')}
            </div>
            {reportContent}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* KPIs del inventario */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Productos</p>
                <p className="text-2xl font-bold text-blue-600">{inventoryKPIs.totalProductos}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Valor Inventario</p>
                <p className="text-2xl font-bold text-green-600">${inventoryKPIs.valorTotalInventario.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Rotación Promedio</p>
                <p className="text-2xl font-bold text-purple-600">{inventoryKPIs.rotacionPromedio}x</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Stock Crítico</p>
                <p className="text-2xl font-bold text-red-600">{inventoryKPIs.stockCritico}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reportes de inventario disponibles - Con Drag & Drop */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Reportes Disponibles</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Arrastra para reorganizar</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportsOrder.map((report, index) => {
          const IconComponent = getIconComponent(report.icon)
          const colorClasses = {
            blue: { border: 'border-blue-200 hover:border-blue-400', title: 'text-blue-700', button: 'bg-blue-600 hover:bg-blue-700' },
            green: { border: 'border-green-200 hover:border-green-400', title: 'text-green-700', button: 'bg-green-600 hover:bg-green-700' },
            red: { border: 'border-red-200 hover:border-red-400', title: 'text-red-700', button: 'bg-red-600 hover:bg-red-700' },
            purple: { border: 'border-purple-200 hover:border-purple-400', title: 'text-purple-700', button: 'bg-purple-600 hover:bg-purple-700' },
            orange: { border: 'border-orange-200 hover:border-orange-400', title: 'text-orange-700', button: 'bg-orange-600 hover:bg-orange-700' },
            indigo: { border: 'border-indigo-200 hover:border-indigo-400', title: 'text-indigo-700', button: 'bg-indigo-600 hover:bg-indigo-700' },
            teal: { border: 'border-teal-200 hover:border-teal-400', title: 'text-teal-700', button: 'bg-teal-600 hover:bg-teal-700' }
          }
          const colors = colorClasses[report.color as keyof typeof colorClasses]
          
          return (
            <Card 
              key={report.id}
              className={`cursor-move hover:shadow-lg transition-all duration-200 ${colors.border} ${
                draggedItem === index ? 'opacity-50 scale-105 rotate-2' : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={`flex items-center gap-2 ${colors.title}`}>
                    <IconComponent className="w-5 h-5" />
                    {report.title}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-gray-400">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className={`w-full ${colors.button}`} 
                  onClick={() => setSelectedReport(report.id)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Reporte
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Sección de reportes personalizados */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-600" />
            Reportes Personalizados de Inventario
          </CardTitle>
          <CardDescription>Crea reportes específicos con filtros avanzados para tu inventario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las categorías</SelectItem>
                <SelectItem value="electronicos">Electrónicos</SelectItem>
                <SelectItem value="accesorios">Accesorios</SelectItem>
                <SelectItem value="oficina">Oficina</SelectItem>
                <SelectItem value="herramientas">Herramientas</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Rotación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alta">Alta rotación</SelectItem>
                <SelectItem value="media">Media rotación</SelectItem>
                <SelectItem value="baja">Baja rotación</SelectItem>
                <SelectItem value="todas">Todas</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input type="date" placeholder="Fecha inicio" />
              <Input type="date" placeholder="Fecha fin" />
            </div>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 bg-slate-600 hover:bg-slate-700">
              <Download className="w-4 h-4 mr-2" />
              Generar Reporte Personalizado
            </Button>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Programar Reporte
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {renderReportModal()}
    </div>
  )
}