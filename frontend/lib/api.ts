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
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_in: string;
}

export interface Item {
  name: string;
  unit: string;
  quantity: number | '';
  price: number | '';
  section?: string;
}

export interface CompanyBank {
  account?: string;
  bankName?: string;
  bik?: string;
  corrAccount?: string;
}

export interface Company {
  name: string;
  shortName?: string;
  logo?: string; // base64 data URL, embedded directly into the template
  inn?: string;
  kpp?: string;
  ogrn?: string;
  address?: string;
  phone?: string;
  email?: string;
  bank?: CompanyBank;
}

export interface Signer {
  fullName?: string;
  position?: string;
  signatureImage?: string; // base64 data URL
  stampImage?: string; // base64 data URL
}

export interface TemplateData {
  company?: Company;
  signer?: Signer;
  items?: Item[];
  terms?: string;
  footer?: string;
}

export interface Recipient {
  position?: string;
  org?: string;
  fullName?: string;
}

export interface ProposalData {
  number?: string;
  date?: string;
  recipient?: Recipient;
  description?: string;
  items?: Item[];
  validDays?: number | '';
  vatNote?: string;
  includeSignature?: boolean; // whether to embed the template's signature scan in the PDF (default true)
  includeStamp?: boolean; // whether to embed the template's stamp scan in the PDF (default true)
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  version: number;
  data: TemplateData;
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
  data: ProposalData;
}

export interface ProposalVersion {
  id: string;
  proposal_id: string;
  version_number: number;
  data: ProposalData;
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
        let authNotice: string | null = null;

        if (refreshToken) {
          try {
            const refreshed = await this.refreshToken(refreshToken);
            if (refreshed.success && refreshed.data?.access_token) {
              this.setToken(refreshed.data.access_token);
              return this.request<T>(endpoint, { ...options, _isRetry: true });
            }
            authNotice = refreshed.error?.message || null;
          } catch {
            // refresh failed — fall through to redirect
          }
        }

        if (!authNotice) {
          try {
            const body = await response.json();
            authNotice = body?.error?.message || null;
          } catch {
            // ignore — response body already consumed or not JSON
          }
        }

        if (authNotice) {
          sessionStorage.setItem('auth_notice', authNotice);
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

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  }

  // User management endpoints (admin-only)
  async getUsers(opts: { limit?: number; offset?: number; search?: string } = {}): Promise<ApiResponse<{ users: User[]; pagination: { total: number } }>> {
    const { limit = 10, offset = 0, search } = opts;
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (search) params.set('search', search);
    return this.request(`/users?${params.toString()}`, { method: 'GET' });
  }

  async createUser(payload: { email: string; first_name?: string; last_name?: string; role?: string; password?: string }): Promise<ApiResponse<{ user: User; temp_password: string }>> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateUser(id: string, payload: { is_active?: boolean; role?: string }): Promise<ApiResponse<{ user: User }>> {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async resetUserPassword(id: string): Promise<ApiResponse<{ temp_password: string }>> {
    return this.request(`/users/${id}/reset-password`, { method: 'POST' });
  }

  // Template endpoints
  async createTemplate(name: string, description: string, data: Record<string, any>): Promise<ApiResponse<{ template: Template }>> {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify({ name, description, data }),
    });
  }

  async getTemplates(opts: { limit?: number; offset?: number; search?: string } = {}): Promise<ApiResponse<{ templates: Template[]; pagination: { total: number } }>> {
    const { limit = 10, offset = 0, search } = opts;
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (search) params.set('search', search);
    return this.request(`/templates?${params.toString()}`, { method: 'GET' });
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

  async getProposals(opts: { limit?: number; offset?: number; search?: string; status?: 'draft' | 'final' | 'archived' } = {}): Promise<ApiResponse<{ proposals: Proposal[]; pagination: { total: number } }>> {
    const { limit = 10, offset = 0, search, status } = opts;
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    return this.request(`/proposals?${params.toString()}`, { method: 'GET' });
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
