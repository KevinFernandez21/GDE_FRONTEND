"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, CameraOff, RotateCcw, Package, DollarSign, TrendingUp, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import QrScanner from 'qr-scanner'

interface ScannedProduct {
  id: string
  code: string
  sku?: string
  name: string
  sale_price: number
  cost_price?: number
  current_stock: number
  min_stock?: number
  category?: string
  brand?: string
  proveedor?: string
  location?: string
}

export default function ProductQRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<ScannedProduct[]>([])
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef<number>(0)

  useEffect(() => {
    checkCameraAvailability()
    return () => {
      stopScanning()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const checkCameraAvailability = async () => {
    try {
      const hasCamera = await QrScanner.hasCamera()
      setHasCamera(hasCamera)
    } catch (error) {
      console.error('Error checking camera:', error)
      setHasCamera(false)
    }
  }

  const startScanning = async () => {
    try {
      // Esperar un momento para asegurar que el elemento video esté en el DOM
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!videoRef.current) {
        console.error('[QR Scanner] Video element no disponible después de esperar')
        toast.error("Error: No se pudo acceder al elemento de video. Por favor, recarga la página.")
        return
      }

      setError(null)
      setIsScanning(true) // Cambiar el estado primero para que el video se renderice
      
      // Esperar un frame más para que React actualice el DOM
      await new Promise(resolve => requestAnimationFrame(resolve))
      
      if (!videoRef.current) {
        console.error('[QR Scanner] Video element aún no disponible')
        setIsScanning(false)
        toast.error("Error: No se pudo inicializar el video. Por favor, intenta de nuevo.")
        return
      }

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          await handleQRScanned(result.data)
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 2, // Limitar escaneos para evitar múltiples llamadas
        }
      )

      await qrScannerRef.current.start()
      toast.success("Cámara activada - Escanea un código QR")
    } catch (error) {
      console.error('[QR Scanner] Error starting camera:', error)
      setIsScanning(false)
      const errorMessage = error instanceof Error ? error.message : 'Error al acceder a la cámara'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
      qrScannerRef.current.destroy()
      qrScannerRef.current = null
    }
    setIsScanning(false)
  }

  // Validate product payload structure
  const validateProductPayload = (product: any): product is ScannedProduct => {
    if (!product) return false
    // Must have at least id or code/sku, and name
    const hasId = !!product.id
    const hasCode = !!(product.code || product.sku)
    const hasName = !!product.name
    return (hasId || hasCode) && hasName
  }

  // Search product with retry and backoff
  const searchProductWithRetry = async (code: string, maxRetries: number = 3): Promise<ScannedProduct | null> => {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Exponential backoff: 100ms, 200ms, 400ms
        if (attempt > 0) {
          const delay = 100 * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
        console.log(`[QR Scanner] Intento ${attempt + 1}/${maxRetries} para código:`, code)
        
        const response = await apiClient.searchProductByCode(code)
        
        // Handle both response formats: {data: {...}} or direct product object
        const product = response.data || response
        
        // Validate payload structure
        if (!validateProductPayload(product)) {
          throw new Error("Respuesta inválida del servidor: estructura de datos incorrecta")
        }
        
        // Build product data
        const productData: ScannedProduct = {
          id: product.id || '',
          code: product.code || product.sku || code,
          sku: product.sku || product.code || code,
          name: product.name || 'Producto sin nombre',
          sale_price: typeof product.sale_price === 'number' ? product.sale_price : (product.price || 0),
          cost_price: typeof product.cost_price === 'number' ? product.cost_price : (product.cost || 0),
          current_stock: typeof product.current_stock === 'number' ? product.current_stock : 0,
          min_stock: typeof product.min_stock === 'number' ? product.min_stock : 0,
          category: product.category,
          brand: product.brand,
          proveedor: product.proveedor || product.provider,
          location: product.location,
        }
        
        retryCountRef.current = 0 // Reset retry count on success
        return productData
        
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`[QR Scanner] Intento ${attempt + 1} falló:`, lastError.message)
        
        // Don't retry on 404 (product not found)
        if (error.error?.code === '404' || error.response?.status === 404) {
          throw new Error("Producto no encontrado")
        }
      }
    }
    
    // All retries failed
    throw lastError || new Error("Error al buscar producto después de múltiples intentos")
  }

  const handleQRScanned = useCallback(async (code: string) => {
    if (!code || code.trim() === '') return

    const trimmedCode = code.trim()
    
    // Debounce: ignore if same code scanned within 300ms
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // Check if same code was just scanned
    if (lastScannedCode === trimmedCode) {
      console.log('[QR Scanner] Código duplicado (debounce), ignorando...')
      return
    }
    
    // Set debounce timer
    debounceTimerRef.current = setTimeout(async () => {
      // Check again after debounce period
      if (lastScannedCode === trimmedCode) {
        return
      }
      
      setLastScannedCode(trimmedCode)
      
      // Check if product already in history
      if (scannedProduct && (scannedProduct.code === trimmedCode || scannedProduct.sku === trimmedCode)) {
        console.log('[QR Scanner] Producto ya mostrado, ignorando...')
        return
      }

      // Detener el escáner temporalmente mientras procesamos
      if (qrScannerRef.current) {
        qrScannerRef.current.stop()
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log('[QR Scanner] Buscando producto con código:', trimmedCode)
        
        // Search with retry and backoff
        const productData = await searchProductWithRetry(trimmedCode, 3)
        
        if (productData) {
          setScannedProduct(productData)
          
          // Agregar al historial (máximo 10)
          setScanHistory(prev => {
            const newHistory = [productData, ...prev.filter(p => p.id !== productData.id && p.code !== productData.code)]
            return newHistory.slice(0, 10)
          })
          
          toast.success(`Producto encontrado: ${productData.name}`)
          
          // Reiniciar el escáner después de un breve delay para permitir otro escaneo
          setTimeout(() => {
            if (qrScannerRef.current && isScanning) {
              qrScannerRef.current.start()
            }
          }, 1000)
        }
      } catch (error: any) {
        console.error('[QR Scanner] Error:', error)
        const errorMessage = error.error?.message || error.message || "Producto no encontrado"
        setError(`No se encontró producto con código: ${trimmedCode}`)
        setScannedProduct(null)
        toast.error(`No se encontró producto con código: ${trimmedCode}`)
        
        // Reiniciar el escáner después del error
        setTimeout(() => {
          if (qrScannerRef.current && isScanning) {
            qrScannerRef.current.start()
          }
        }, 2000)
      } finally {
        setIsLoading(false)
        // Clear lastScannedCode after processing
        setTimeout(() => {
          setLastScannedCode(null)
        }, 300)
      }
    }, 300) // 300ms debounce
  }, [scannedProduct, isScanning, lastScannedCode])

  const clearScanned = () => {
    setScannedProduct(null)
    setError(null)
  }

  const clearHistory = () => {
    setScanHistory([])
    toast.success("Historial limpiado")
  }

  const formatPrice = (price: number | undefined): string => {
    if (!price && price !== 0) return '0.00'
    return price.toFixed(2)
  }

  const getStockStatus = (current: number, min: number = 0) => {
    if (current === 0) return { label: 'Sin Stock', variant: 'destructive' as const }
    if (current <= min) return { label: 'Stock Bajo', variant: 'destructive' as const }
    return { label: 'En Stock', variant: 'default' as const }
  }

  return (
    <div className="space-y-6">
      {/* Scanner Section */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Camera Controls */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Escáner de Códigos QR</h3>
                <p className="text-sm text-gray-600">Escanea el código QR del estante para buscar el producto</p>
              </div>
              <div className="flex gap-2">
                {!isScanning ? (
                  <Button
                    onClick={startScanning}
                    disabled={!hasCamera}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Iniciar Escáner
                  </Button>
                ) : (
                  <Button
                    onClick={stopScanning}
                    variant="destructive"
                  >
                    <CameraOff className="w-4 h-4 mr-2" />
                    Detener
                  </Button>
                )}
              </div>
            </div>

            {/* Camera Video - Siempre renderizado pero oculto cuando no está escaneando */}
            <div className={`relative bg-black rounded-lg overflow-hidden ${isScanning ? '' : 'hidden'}`}>
              <video
                ref={videoRef}
                className="w-full h-64 sm:h-96 object-cover"
                playsInline
                muted
                autoPlay
              />
              {isScanning && (
                <>
                  <div className="absolute inset-0 border-4 border-blue-500 border-dashed pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-blue-500/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                        <p className="text-white text-sm font-medium">Enfoca el código QR aquí</p>
                      </div>
                    </div>
                  </div>
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <p className="text-sm font-medium">Buscando producto...</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* No Camera Message */}
            {!hasCamera && !isScanning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <CameraOff className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-yellow-800 text-sm">
                  Cámara no disponible. Permite el acceso a la cámara en la configuración de tu navegador.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scanned Product Display */}
      {scannedProduct && (
        <Card className="border-2 border-blue-500">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-blue-600">Producto Encontrado</h3>
                <Button
                  onClick={clearScanned}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Limpiar
                </Button>
              </div>

              {/* Product Info Grid - SKU, Stock y Cantidad destacados */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* SKU/Code - Destacado */}
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">SKU</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 font-mono">
                    {scannedProduct.sku || scannedProduct.code || 'N/A'}
                  </p>
                </div>

                {/* Stock Actual - Destacado */}
                <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">Stock Actual</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold text-purple-900">
                      {scannedProduct.current_stock}
                    </p>
                    <Badge variant={getStockStatus(scannedProduct.current_stock, scannedProduct.min_stock).variant}>
                      {getStockStatus(scannedProduct.current_stock, scannedProduct.min_stock).label}
                    </Badge>
                  </div>
                </div>

                {/* Cantidad de Productos (Total en inventario) */}
                <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600">Cantidad</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-900">
                    {scannedProduct.current_stock} unidades
                  </p>
                  {scannedProduct.min_stock && (
                    <p className="text-xs text-gray-500 mt-1">
                      Mínimo: {scannedProduct.min_stock}
                    </p>
                  )}
                </div>
              </div>

              {/* Precio y Nombre del Producto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Price */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Precio Unitario</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    ${formatPrice(scannedProduct.sale_price)}
                  </p>
                </div>

                {/* Product Name */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium text-gray-600">Nombre del Producto</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{scannedProduct.name}</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
                {scannedProduct.category && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Categoría</p>
                    <p className="text-sm font-medium">{scannedProduct.category}</p>
                  </div>
                )}
                {scannedProduct.brand && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Marca</p>
                    <p className="text-sm font-medium">{scannedProduct.brand}</p>
                  </div>
                )}
                {scannedProduct.proveedor && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Proveedor</p>
                    <p className="text-sm font-medium">{scannedProduct.proveedor}</p>
                  </div>
                )}
                {scannedProduct.location && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ubicación</p>
                    <p className="text-sm font-medium">{scannedProduct.location}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Historial de Escaneos</h3>
              <Button
                onClick={clearHistory}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpiar Historial
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {scanHistory.map((product, index) => (
                <div
                  key={`${product.id}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => setScannedProduct(product)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 font-mono">{product.code || product.sku}</span>
                      <span className="text-xs text-gray-500">Stock: {product.current_stock}</span>
                      <span className="text-xs text-gray-500">${formatPrice(product.sale_price)}</span>
                    </div>
                  </div>
                  <Badge variant={getStockStatus(product.current_stock, product.min_stock).variant} className="ml-2">
                    {getStockStatus(product.current_stock, product.min_stock).label}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!scannedProduct && !isScanning && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 sm:p-6">
            <h4 className="font-semibold mb-3 text-blue-900">Instrucciones de Uso:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Haz clic en "Iniciar Escáner" para activar la cámara</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Enfoca el código QR que está en el estante del producto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>La información del producto aparecerá automáticamente en tiempo real</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">4.</span>
                <span>Verás el SKU, precio unitario y stock actual del producto</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

