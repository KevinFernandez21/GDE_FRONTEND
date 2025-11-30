import { useState, useCallback, useMemo } from "react"

/**
 * Hook optimizado para manejo de selección de productos
 * Evita re-renders innecesarios usando memoización
 */
export function useProductSelection(products: Array<{ id: string }>) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

  const toggleSelect = useCallback((productId: string) => {
    setSelectedProducts(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(productId)) {
        newSelected.delete(productId)
      } else {
        newSelected.add(productId)
      }
      return newSelected
    })
  }, [])

  const selectAll = useCallback((productIds: string[]) => {
    setSelectedProducts(prev => {
      // Si ya están todos seleccionados, limpiar
      if (productIds.length > 0 && productIds.every(id => prev.has(id)) && prev.size === productIds.length) {
        return new Set()
      }
      // Si no, seleccionar todos
      return new Set(productIds)
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedProducts(new Set())
  }, [])

  // Memoizar el cálculo de isSelectAll para evitar re-renders
  const isSelectAll = useMemo(() => {
    if (products.length === 0) return false
    return products.every(p => selectedProducts.has(p.id)) && 
           selectedProducts.size === products.length &&
           selectedProducts.size > 0
  }, [products, selectedProducts])

  return {
    selectedProducts,
    toggleSelect,
    selectAll,
    isSelectAll,
    clearSelection,
    setSelectedProducts
  }
}

