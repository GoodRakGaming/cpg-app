/**
 * API Client for Commercial Proposal Generator Backend
 * Handles all communication with backend endpoints
 */

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3000/api`;
  }
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    status: number;
    message: string;
  };
  message?: string;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_in: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  version: number;
  data: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Proposal {
  id: string;
  title: string;
  status: 'draft' | 'final' | 'archived';
  template_id: string;
  user_id: string;
  current_version_id: string;
  pdf_hash?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  data: Record<string, any>;
}

export interface ProposalVersion {
  id: string;
  proposal_id: string;
  version_number: number;
  data: Record<string, any>;
  comment?: string;
  changed_by: string;
  pdf_hash?: string;
  created_at: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Initialize token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  private buildHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
    const token = this.token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { throwError?: boolean; _isRetry?: boolean } = {}
  ): Promise<ApiResponse<T>> {
    const { throwError = true, _isRetry = false, ...fetchOptions } = options;

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers: this.buildHeaders(fetchOptions.headers as Record<string, string>),
        credentials: 'include',
      });

      // Try to refresh token on 401, then retry once
      if (response.status === 401 && !_isRetry && typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const refreshed = await this.refreshToken(refreshToken);
            if (refreshed.success && refreshed.data?.access_token) {
              this.setToken(refreshed.data.access_token);
              return this.request<T>(endpoint, { ...options, _isRetry: true });
            }
          } catch {
            // refresh failed — fall through to redirect
          }
        }
        this.clearToken();
        localStorage.removeItem('user');
        window.location.href = '/login';
        return { success: false } as ApiResponse<T>;
      }

      const data = await response.json();

      if (!response.ok && throwError) {
        console.error(`🔴 API Error [${response.status}] ${endpoint}:`, data);
        throw new Error(data.error?.message || data.message || 'API Error');
      }

      return data;
    } catch (error) {
      if (throwError) throw error;
      return {
        success: false,
        error: {
          status: 500,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // Auth endpoints
  async register(email: string, password: string, firstName: string, lastName: string): Promise<ApiResponse<AuthResponse>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
    });
  }

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.access_token) {
      this.setToken(response.data.access_token);
      // Also save refresh token if provided by backend
      if (typeof window !== 'undefined' && response.data?.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
    return response;
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.success && response.data?.access_token) {
      this.setToken(response.data.access_token);
    }

    return response;
  }

  // Template endpoints
  async createTemplate(name: string, description: string, data: Record<string, any>): Promise<ApiResponse<{ template: Template }>> {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify({ name, description, data }),
    });
  }

  async getTemplates(limit: number = 10, offset: number = 0): Promise<ApiResponse<{ templates: Template[]; total: number }>> {
    return this.request(`/templates?limit=${limit}&offset=${offset}`, { method: 'GET' });
  }

  async getTemplate(id: string): Promise<ApiResponse<{ template: Template }>> {
    return this.request(`/templates/${id}`, { method: 'GET' });
  }

  async updateTemplate(id: string, name: string, description: string, data: Record<string, any>): Promise<ApiResponse<{ template: Template }>> {
    return this.request(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description, data }),
    });
  }

  async deleteTemplate(id: string): Promise<ApiResponse> {
    return this.request(`/templates/${id}`, { method: 'DELETE' });
  }

  // Proposal endpoints
  async createProposal(payload: { template_id: string; title: string; status?: string; data?: Record<string, any> }): Promise<ApiResponse<Proposal>> {
    return this.request('/proposals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getProposals(limit: number = 10, offset: number = 0): Promise<ApiResponse<{ proposals: Proposal[]; total: number }>> {
    return this.request(`/proposals?limit=${limit}&offset=${offset}`, { method: 'GET' });
  }

  async getProposal(id: string): Promise<ApiResponse<{ proposal: Proposal }>> {
    return this.request(`/proposals/${id}`, { method: 'GET' });
  }

  async updateProposal(id: string, payload: { title?: string; status?: string; data?: Record<string, any> }): Promise<ApiResponse<{ proposal: Proposal }>> {
    return this.request(`/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteProposal(id: string): Promise<ApiResponse> {
    return this.request(`/proposals/${id}`, { method: 'DELETE' });
  }

  async getProposalVersions(id: string): Promise<ApiResponse<{ versions: ProposalVersion[]; total: number }>> {
    return this.request(`/proposals/${id}/versions`, { method: 'GET' });
  }

  async restoreProposalVersion(proposalId: string, versionId: string): Promise<ApiResponse<{ proposal: Proposal }>> {
    return this.request(`/proposals/${proposalId}/versions/${versionId}/restore`, {
      method: 'POST',
    });
  }

  // PDF endpoints
  async generatePDF(proposalId: string): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request(`/pdf/generate/${proposalId}`, {
      method: 'POST',
    });
  }

  async downloadPDF(proposalId: string): Promise<ApiResponse<{ url: string }>> {
    return this.request(`/pdf/${proposalId}`, {
      method: 'GET',
    });
  }

  async exportPDF(proposalId: string, format: string = 'A4', margin?: any, printBackground: boolean = true): Promise<ApiResponse<{ url: string }>> {
    return this.request(`/pdf/export/${proposalId}`, {
      method: 'POST',
      body: JSON.stringify({ format, margin, printBackground }),
    });
  }

  async getPDFStatus(proposalId: string): Promise<ApiResponse<{ proposal_id: string; pdf_hash: string | null; is_cached: boolean; status: string }>> {
    return this.request(`/pdf/status/${proposalId}`, { method: 'GET' });
  }
}

export const apiClient = new ApiClient();
