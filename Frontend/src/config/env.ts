export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  
  // Project endpoints
  GET_PROJECTS: `${API_BASE_URL}/api/projects`,
  GET_PROJECT_DETAILS: (projectId: string) => `${API_BASE_URL}/api/projects/${projectId}`,
  
  // Cost data endpoints
  GET_COST_DATA: (projectId: string) => `${API_BASE_URL}/api/projects/${projectId}/costs`,
  SYNC_DATA: (projectId: string) => `${API_BASE_URL}/api/sync/data`,
  GET_SYNC_STATUS: (projectId: string) => `${API_BASE_URL}/api/sync/status`,
  
  // Simulation endpoints
  SIMULATE_USAGE: (projectId: string) => `${API_BASE_URL}/api/simulate/usage`
};

export const AUTH_CONFIG = {
  TOKEN_KEY: 'auth_token',
  COMPANY_KEY: 'company_data'
};

export const SERVICES = [
  { id: 'GPT-4', name: 'GPT-4', color: '#10B981' },
  { id: 'DALL-E', name: 'DALL-E', color: '#3B82F6' },
  { id: 'Gemini', name: 'Gemini', color: '#8B5CF6' },
  { id: 'Claude', name: 'Claude', color: '#EC4899' }
];