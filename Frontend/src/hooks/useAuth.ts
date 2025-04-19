import { useState, useEffect } from 'react';
import { API_ENDPOINTS, AUTH_CONFIG } from '@/config/env';

interface Company {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  company: Company | null;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    company: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const companyData = localStorage.getItem(AUTH_CONFIG.COMPANY_KEY);

    if (token && companyData) {
      setAuthState({
        isAuthenticated: true,
        company: JSON.parse(companyData),
        isLoading: false,
        error: null,
      });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_CONFIG.COMPANY_KEY, JSON.stringify(data.company));

      setAuthState({
        isAuthenticated: true,
        company: data.company,
        isLoading: false,
        error: null,
      });

      return data;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.COMPANY_KEY);
    
    setAuthState({
      isAuthenticated: false,
      company: null,
      isLoading: false,
      error: null,
    });
  };

  return {
    ...authState,
    login,
    logout,
  };
};