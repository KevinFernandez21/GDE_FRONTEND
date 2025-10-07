"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, Download, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import QRCode from "qrcode"

interface DispatchGuide {
  id: string
  guide_number: string
  client_name: string
  status: string
}

export default function QRGenerator() {
  const [guideId, setGuideId] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [scanUrl, setScanUrl] = useState("")
  const [loading, setLoading] = useState(false)

  const generateQR = async () => {
    if (!guideId.trim()) {
      toast.error("Por favor ingresa un ID de guía válido")
      return
    }

    setLoading(true)
    try {
      const baseUrl = window.location.origin
      const url = `${baseUrl}/scan/${guideId}`
      setScanUrl(url)
      
      const qrOptions = {
        errorCorrectionLevel: 'M' as const,
        type: 'image/png' as const,
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256,
      }

      const qrDataUrl = await QRCode.toDataURL(url, qrOptions)
      setQrDataUrl(qrDataUrl)
      
      toast.success("Código QR generado exitosamente")
    } catch (error) {
      console.error('Error generating QR:', error)
      toast.error("Error al generar el código QR")
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = () => {
    if (!qrDataUrl) return

    const link = document.createElement('a')
    link.download = `qr-guia-${guideId}.png`
    link.href = qrDataUrl
    link.click()
    
    toast.success("Código QR descargado")
  }

  const copyUrl = async () => {
    if (!scanUrl) return

    try {
      await navigator.clipboard.writeText(scanUrl)
      toast.success("URL copiada al portapapeles")
    } catch (error) {
      toast.error("Error al copiar la URL")
    }
  }

  const openUrl = () => {
    if (!scanUrl) return
    window.open(scanUrl, '_blank')
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <QrCode className="mr-2 h-5 w-5" />
          Generador de QR
        </CardTitle>
        <CardDescription className="text-slate-400">
          Genera códigos QR para el seguimiento de guías de despacho
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="guideId" className="text-slate-300">
            ID de Guía de Despacho
          </Label>
          <div className="flex space-x-2">
            <Input
              id="guideId"
              placeholder="Ej: GD-2024-001"
              value={guideId}
              onChange={(e) => setGuideId(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              onKeyPress={(e) => e.key === 'Enter' && generateQR()}
            />
            <Button 
              onClick={generateQR}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <QrCode className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {qrDataUrl && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={qrDataUrl} 
                  alt="QR Code" 
                  className="max-w-full h-auto"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">URL de Escaneo:</Label>
              <div className="flex space-x-2">
                <Input
                  value={scanUrl}
                  readOnly
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyUrl}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openUrl}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={downloadQR}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar QR
              </Button>
            </div>
          </div>
        )}

        <div className="bg-slate-700/50 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-2">¿Cómo funciona?</h4>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• Ingresa el ID de la guía de despacho</li>
            <li>• Se genera un QR con link único de seguimiento</li>
            <li>• Al escanear, redirige a la página de seguimiento móvil</li>
            <li>• Permite escaneo en tiempo real desde cualquier dispositivo</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}