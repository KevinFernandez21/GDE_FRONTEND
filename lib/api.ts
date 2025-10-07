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
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle FastAPI error response
        const errorMessage = data.detail || data.message || 'An error occurred';
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

      // If it's a direct data response (backward compatibility)
      return { data };
    } catch (error) {
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