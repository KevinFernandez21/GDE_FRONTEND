"use client"

/**
 * Universal Export Button
 * Reusable component for exporting data across all modules
 * Supports CSV and Excel formats
 */

import { useState } from "react"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface ExportButtonProps {
  /** API endpoint for export (e.g., "/inventory/export") */
  exportEndpoint: string
  /** Base filename for downloaded file */
  filename: string
  /** Additional query parameters */
  params?: Record<string, any>
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary"
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon"
  /** Show label or icon only */
  showLabel?: boolean
}

export default function ExportButton({
  exportEndpoint,
  filename,
  params = {},
  variant = "outline",
  size = "default",
  showLabel = true
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(true)
    try {
      const token = localStorage.getItem('gde_token')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      
      // Build query string
      const queryParams = new URLSearchParams({
        format,
        ...params
      })
      
      const response = await fetch(`${API_BASE_URL}${exportEndpoint}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.success(`Archivo ${format.toUpperCase()} descargado exitosamente`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.detail || "Error al exportar datos")
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error("Error al conectar con el servidor")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {showLabel && (isExporting ? "Exportando..." : "Exportar")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar como CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar como Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

