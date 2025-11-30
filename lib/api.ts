/**
 * API Client for GDE Backend
 */

import { config } from './config';

const API_BASE_URL = config.apiBaseUrl;

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface BackendSuccessResponse<T> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  timestamp?: string;
}

interface BackendErrorResponse {
  detail: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;

    // Debug log
    console.log('ApiClient initialized with baseUrl:', this.baseUrl);

    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('gde_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gde_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gde_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`[ApiClient] Request to ${endpoint}, URL: ${url}`);
    console.log(`[ApiClient] Has token:`, !!this.token);
    
    const headers: HeadersInit = {
      ...options.headers,
    };
    
    // Only set Content-Type for JSON, not for FormData (browser will set it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
      console.log(`[ApiClient] Token added to headers`);
    }

    // Create abort controller with timeout
    const abortController = new AbortController()
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    
    // OPTIMIZED: Increase timeout for heavy endpoints (dashboard, alerts)
    const isHeavyEndpoint = endpoint.includes('/realtime-metrics') || endpoint.includes('/alerts')
    const timeoutMs = isHeavyEndpoint ? 60000 : 30000 // 60s for heavy endpoints, 30s for others
    
    try {
      timeoutId = setTimeout(() => abortController.abort(), timeoutMs)
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: abortController.signal
      });
      
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      console.log(`[ApiClient] Response status: ${response.status}`);
      const data = await response.json();
      console.log(`[ApiClient] Response data (raw):`, JSON.stringify(data, null, 2).substring(0, 2000));
      console.log(`[ApiClient] Response data keys:`, Object.keys(data || {}));
      console.log(`[ApiClient] Response data.data keys:`, data.data ? Object.keys(data.data) : 'no data.data');

      if (!response.ok) {
        // Handle FastAPI error response
        let errorMessage = 'An error occurred';
        
        if (data.detail) {
          // Handle array of validation errors (422 Unprocessable Entity)
          if (Array.isArray(data.detail)) {
            errorMessage = data.detail
              .map((err: any) => {
                if (typeof err === 'string') return err;
                if (err.msg) {
                  const loc = err.loc ? err.loc.join('.') : '';
                  return `${loc ? `${loc}: ` : ''}${err.msg}`;
                }
                return JSON.stringify(err);
              })
              .join(', ');
          } else if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else {
            errorMessage = JSON.stringify(data.detail);
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        console.log(`[ApiClient] Error response:`, errorMessage);
        return {
          error: errorMessage,
        };
      }

      // Handle backend success response format
      // Support both "status": "success" and "success": true formats
      if (data.status === 'success' || data.success === true) {
        // For login responses, data.data contains the login response
        if (data.data && (data.data.access_token || data.data.token)) {
          return { 
            data: data.data,
            message: data.message 
          };
        }
        // ✅ CORRECCIÓN: Para ImportResponse, data.data contiene el validation_result
        // Si data.data existe, usarlo; si no, usar data directamente
        const extractedData = data.data || data;
        console.log(`[ApiClient] Processing success response:`, {
          originalDataKeys: Object.keys(data || {}),
          hasDataField: !!data.data,
          dataDataType: typeof data.data,
          extractedDataKeys: Object.keys(extractedData || {}),
          fileInfo: extractedData?.file_info,
          fileInfoType: typeof extractedData?.file_info,
          fileInfoRows: extractedData?.file_info?.rows,
          fileInfoRowsType: typeof extractedData?.file_info?.rows,
          fileInfoColumns: extractedData?.file_info?.columns,
          fileInfoColumnsType: typeof extractedData?.file_info?.columns,
          fullExtractedData: JSON.stringify(extractedData, null, 2).substring(0, 500)
        });
        return { 
          data: extractedData,
          message: data.message 
        };
      }

      // If it's a direct data response (like /me endpoint)
      // Check if it looks like user data (has id, username, role)
      if (data.id && data.username && data.role) {
        return { data };
      }

      // Handle PaginatedResponse format (has items, total, page, size, pages)
      if (data.items !== undefined && data.total !== undefined) {
        return { data };
      }

      // For other direct responses
      return { data };
    } catch (error: any) {
      // Clear timeout if still running
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      if (error.name === 'AbortError') {
        console.warn(`[ApiClient] Request timeout for ${endpoint}`);
        return {
          error: 'Request timeout. Please try again.',
        };
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.warn(`[ApiClient] Network error for ${endpoint} - backend may be unavailable`);
        return {
          error: 'Network error. Please check your connection and try again.',
        };
      }
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints
  async login(username: string, password: string) {
    // Clean username and password to remove any control characters and whitespace
    const cleanUsername = username.trim().replace(/[\x00-\x1F\x7F]/g, '')
    const cleanPassword = password.trim().replace(/[\x00-\x1F\x7F]/g, '')
    
    // Create the request body object
    const requestBody = { 
      username: cleanUsername, 
      password: cleanPassword, 
      remember_me: false 
    }
    
    // Stringify with error handling
    let bodyString: string
    try {
      bodyString = JSON.stringify(requestBody)
    } catch (error) {
      console.error('[ApiClient] Error stringifying login request:', error)
      return {
        error: 'Error al preparar la solicitud de login'
      }
    }
    
    console.log('[ApiClient] Login request body:', bodyString)
    
    return this.request<{
      access_token: string; 
      token_type: string;
      expires_in: number;
      user: any;
    }>('/auth/login-simple', {
      method: 'POST',
      body: bodyString,
    });
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  async logout() {
    return this.request<any>('/auth/logout', {
      method: 'POST',
    });
  }

  // Inventory endpoints
  async getInventory() {
    return this.request<any[]>('/inventory/products');
  }

  async getProducts(params?: {
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
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.q) queryParams.append('q', params.q);
    if (params?.sku) queryParams.append('sku', params.sku);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.provider) queryParams.append('provider', params.provider);
    if (params?.min_stock !== undefined) queryParams.append('min_stock', params.min_stock.toString());
    if (params?.max_stock !== undefined) queryParams.append('max_stock', params.max_stock.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.active_only !== undefined) queryParams.append('active_only', params.active_only.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/inventory/products${queryString ? `?${queryString}` : ''}`;
    console.log('[ApiClient] getProducts - endpoint:', endpoint, 'params:', params);
    const response = await this.request<any>(endpoint);
    console.log('[ApiClient] getProducts - response:', response);
    return response;
  }

  async createProduct(product: any) {
    return this.request<any>('/inventory/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, product: any) {
    return this.request<any>(`/inventory/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string) {
    return this.request<any>(`/inventory/products/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkDeleteProducts(ids: string[]) {
    return this.request<any>('/inventory/products/bulk-delete', {
      method: 'POST',
      body: JSON.stringify(ids),
    });
  }

  async searchProductByCode(code: string) {
    return this.request<any>(`/inventory/products/search/${encodeURIComponent(code)}`);
  }

  async validateImport(file: File) {
    console.log("🔍 [API DEBUG] Validating file:", file.name, file.size);
    const formData = new FormData();
    formData.append('file', file);
    
    // ✅ CORRECCIÓN: Usar el método request para mantener consistencia con el resto del código
    return this.request<any>('/inventory/import/validate', {
      method: 'POST',
      body: formData,
    });
  }

  async importProducts(file: File, options?: { import_only_valid?: boolean; update_existing?: boolean }) {
    console.log("🔍 [API DEBUG] Importing file:", file.name, "Options:", options);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('update_existing', (options?.update_existing !== false).toString());
    formData.append('dry_run', 'false');
    
    if (options?.import_only_valid !== undefined) {
      formData.append('import_only_valid', options.import_only_valid.toString());
    }
    
    try {
      const token = this.token || (typeof window !== 'undefined' ? localStorage.getItem('gde_token') : null);
      const url = `${this.baseUrl}/inventory/import`;
      
      console.log("🔍 [API DEBUG] Import URL:", url);
      console.log("🔍 [API DEBUG] Has token:", !!token);
      console.log("🔍 [API DEBUG] FormData entries:");
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `${value.name} (${value.size} bytes)` : value);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      console.log("🔍 [API DEBUG] Import response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("🔍 [API DEBUG] Import error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("🔍 [API DEBUG] Import response data:", data);
      
      return { data, error: undefined as string | undefined };
    } catch (error) {
      console.error("🔍 [API DEBUG] Import error:", error);
      return { 
        data: undefined, 
        error: (error instanceof Error ? error.message : "Error desconocido") as string
      };
    }
  }

  // Users endpoints
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async createUser(user: any) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  // Accounting endpoints
  async getTransactions() {
    return this.request<any[]>('/accounting/transactions');
  }

  async createTransaction(transaction: any) {
    return this.request<any>('/accounting/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // Kardex endpoints
  async getKardexReport(filters: any = {}) {
    const params = new URLSearchParams(filters);
    return this.request<any>(`/kardex/report?${params}`);
  }

  // Delivery Guides endpoints
  async getDeliveryGuides() {
    return this.request<any[]>('/delivery-guides');
  }

  async createDeliveryGuide(guide: any) {
    return this.request<any>('/delivery-guides', {
      method: 'POST',
      body: JSON.stringify(guide),
    });
  }

  // Reports endpoints
  async generateReport(type: string, filters: any = {}) {
    return this.request<any>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ type, filters }),
    });
  }

  // Dashboard endpoints
  async getStockMetrics() {
    return this.request<any>('/dashboard/realtime-metrics');
  }

  // Health check
  async healthCheck() {
    return this.request<any>('/health', {
      method: 'GET',
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types
export type { ApiResponse };
export default ApiClient;