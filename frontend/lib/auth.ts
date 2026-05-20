/**
 * Authentication utilities for JWT token management
 * Handles token storage, retrieval, and validation
 */

import { apiClient } from './api';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

class AuthManager {
  private user: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadUserFromStorage();
    }
  }

  private loadUserFromStorage() {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.user = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
    }
  }

  setUser(user: AuthUser) {
    this.user = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    this.notifyListeners();
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  setTokens(accessToken: string, refreshToken: string) {
    if (typeof window !== 'undefined') {
      if (accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      }
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    }
    if (accessToken) {
      apiClient.setToken(accessToken);
    }
  }

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  }

  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('user');
    }
    apiClient.clearToken();
    this.user = null;
    this.notifyListeners();
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null && this.user !== null;
  }

  subscribe(callback: (user: AuthUser | null) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.user));
  }

  async logout() {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }
}

export const authManager = new AuthManager();

export async function handleAuthError(statusCode: number) {
  if (statusCode === 401) {
    // Token expired or invalid
    const refreshToken = authManager.getRefreshToken();
    if (refreshToken) {
      try {
        const response = await apiClient.refreshToken(refreshToken);
        if (response.success && response.data?.access_token) {
          authManager.setTokens(response.data.access_token, refreshToken);
          return true;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }
    // Clear auth and redirect to login
    authManager.clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return false;
  }
  return true;
}
