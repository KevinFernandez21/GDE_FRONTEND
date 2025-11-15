'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: any) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  search: (code: string) => [...productKeys.all, 'search', code] as const,
  alerts: () => [...productKeys.all, 'alerts'] as const,
};

// Types
export interface Product {
  id: string;
  code?: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  proveedor?: string;
  provider?: string;
  model?: string;
  unit_of_measure: string;
  cost_price?: number;
  purchase_price?: number;
  sale_price: number;
  price?: number;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  location?: string;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  status?: string;
  is_active?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ProductFilters {
  page?: number;
  page_size?: number;
  q?: string;
  sku?: string;
  category?: string;
  provider?: string;
  min_stock?: number;
  max_stock?: number;
  sort_by?: string;
  active_only?: boolean;
}

// Hooks
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      console.log('[useProducts] Fetching products with filters:', filters);
      const response = await apiClient.getProducts(filters);
      console.log('[useProducts] API response:', response);
      
      if (response.error) {
        console.error('[useProducts] API error:', response.error);
        throw new Error(response.error.message || response.error);
      }
      
      // Handle paginated response
      if (response.data?.items !== undefined) {
        console.log('[useProducts] Paginated response - items:', response.data.items?.length, 'total:', response.data.total);
        return response.data as ProductsResponse;
      }
      
      // Fallback for non-paginated response
      console.warn('[useProducts] Non-paginated response, using fallback');
      const fallback = {
        items: Array.isArray(response.data) ? response.data : [],
        total: response.meta?.total || 0,
        page: response.meta?.page || 1,
        size: response.meta?.page_size || 20,
        pages: 0,
      };
      console.log('[useProducts] Fallback response:', fallback);
      return fallback;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: productKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.getProduct(id);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data as Product;
    },
    enabled: !!id,
  });
}

export function useSearchProduct(code: string | null) {
  return useQuery({
    queryKey: productKeys.search(code || ''),
    queryFn: async () => {
      if (!code) return null;
      const response = await apiClient.searchProductByCode(code);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data as Product;
    },
    enabled: !!code && code.length > 0,
    retry: 1,
  });
}

export function useStockAlerts() {
  return useQuery({
    queryKey: productKeys.alerts(),
    queryFn: async () => {
      const response = await apiClient.getStockAlerts();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useStockMetrics() {
  return useQuery({
    queryKey: ['stock-metrics'],
    queryFn: async () => {
      const response = await apiClient.getStockMetrics();
      if (response.error) {
        throw new Error(response.error.message);
      }
      // Extract stock_metrics from the response
      const stockMetrics = response.data?.data?.stock_metrics || response.data?.stock_metrics || {};
      return {
        totalProducts: stockMetrics.total_productos || 0,
        totalStock: stockMetrics.stock_total || 0,
        lowStock: stockMetrics.productos_bajo || 0,
        outOfStock: stockMetrics.productos_agotados || 0,
        categories: stockMetrics.categorias || 0
      };
    },
    staleTime: 30 * 1000, // 30 seconds - refresh frequently for accurate metrics
    refetchOnWindowFocus: true,
  });
}

// Mutations
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Partial<Product>) => {
      const response = await apiClient.createProduct(product);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data as Product;
    },
    onSuccess: (data) => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      // Invalidate alerts
      queryClient.invalidateQueries({ queryKey: productKeys.alerts() });
      // Invalidate stock metrics
      queryClient.invalidateQueries({ queryKey: ['stock-metrics'] });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear producto: ${error.message}`);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, product }: { id: string; product: Partial<Product> }) => {
      console.log('[useUpdateProduct] Updating product:', id, 'with data:', product);
      const response = await apiClient.updateProduct(id, product);
      console.log('[useUpdateProduct] API response:', response);
      if (response.error) {
        console.error('[useUpdateProduct] API error:', response.error);
        throw new Error(response.error.message || response.error);
      }
      return response.data as Product;
    },
    onSuccess: (data, variables) => {
      // OPTIMIZED: Update cache optimistically instead of invalidating everything
      // This prevents unnecessary refetches and makes UI feel instant
      
      // 1. Update specific product cache
      queryClient.setQueryData(productKeys.detail(variables.id), data);
      
      // 2. Update product in all lists (optimistic update)
      queryClient.setQueriesData(
        { queryKey: productKeys.lists() },
        (old: ProductsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map(item => 
              item.id === variables.id ? { ...item, ...data } : item
            ),
          };
        }
      );
      
      // 3. Only invalidate alerts and metrics (they need fresh data)
      // Use refetchType: 'none' to prevent immediate refetch
      queryClient.invalidateQueries({ 
        queryKey: productKeys.alerts(),
        refetchType: 'none' // Don't refetch immediately
      });
      queryClient.invalidateQueries({ 
        queryKey: ['stock-metrics'],
        refetchType: 'none' // Don't refetch immediately
      });
      
      toast.success('Producto actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar producto: ${error.message}`);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.deleteProduct(id);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return id;
    },
    onSuccess: () => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      // Invalidate alerts
      queryClient.invalidateQueries({ queryKey: productKeys.alerts() });
      // Invalidate stock metrics
      queryClient.invalidateQueries({ queryKey: ['stock-metrics'] });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar producto: ${error.message}`);
    },
  });
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await apiClient.bulkDeleteProducts(ids);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return ids;
    },
    onSuccess: (ids) => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      // Invalidate alerts
      queryClient.invalidateQueries({ queryKey: productKeys.alerts() });
      // Invalidate stock metrics
      queryClient.invalidateQueries({ queryKey: ['stock-metrics'] });
      // Invalidate individual product queries
      ids.forEach((id) => {
        queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      });
      toast.success(`${ids.length} productos eliminados exitosamente`);
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar productos: ${error.message}`);
    },
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movement: {
      product_id: string;
      movement_type: 'in' | 'out' | 'adjustment' | 'transfer';
      quantity: number;
      unit_cost?: number;
      reference_type?: string;
      reference_id?: string;
      notes?: string;
    }) => {
      const response = await apiClient.createStockMovement(movement);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate product detail (stock changed)
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.product_id) });
      // Invalidate products list (stock changed)
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      // Invalidate alerts
      queryClient.invalidateQueries({ queryKey: productKeys.alerts() });
      toast.success('Movimiento de inventario registrado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al registrar movimiento: ${error.message}`);
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adjustment: {
      product_id: string;
      new_quantity: number;
      reason: string;
    }) => {
      const response = await apiClient.adjustStock(adjustment);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate product detail
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.product_id) });
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      // Invalidate alerts
      queryClient.invalidateQueries({ queryKey: productKeys.alerts() });
      toast.success('Stock ajustado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al ajustar stock: ${error.message}`);
    },
  });
}

