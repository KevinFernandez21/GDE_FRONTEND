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
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
      console.log(`[ApiClient] Token added to headers`);
    }

    // Create abort controller with timeout
    const abortController = new AbortController()
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    
    try {
      timeoutId = setTimeout(() => abortController.abort(), 30000) // 30 second timeout
      
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
      console.log(`[ApiClient] Response data:`, data);

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
      if (data.status === 'success') {
        return { 
          data: data.data || data,
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
    return this.request<{
      access_token: string; 
      token_type: string;
      expires_in: number;
      user: any;
    }>('/auth/login-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username, 
        password, 
        remember_me: false 
      }),
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

  async searchProductByCode(code: string) {
    return this.request<any>(`/inventory/products/search/${encodeURIComponent(code)}`);
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