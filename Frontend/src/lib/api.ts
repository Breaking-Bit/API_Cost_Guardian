import { API_ENDPOINTS, AUTH_CONFIG } from '@/config/env';

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

const getAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new APIError(response.status, error.message);
  }
  return response.json();
};

export const api = {
  async getProjects() {
    const response = await fetch(API_ENDPOINTS.GET_PROJECTS, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getProjectDetails(projectId: string) {
    const response = await fetch(API_ENDPOINTS.GET_PROJECT_DETAILS(projectId), {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getCostData(projectId: string) {
    const response = await fetch(API_ENDPOINTS.GET_COST_DATA(projectId), {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async syncData(projectId: string) {
    const response = await fetch(API_ENDPOINTS.SYNC_DATA(projectId), {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async simulateUsage(projectId: string, service: string) {
    const response = await fetch(API_ENDPOINTS.SIMULATE_USAGE(projectId), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ service }),
    });
    return handleResponse(response);
  },

  async getSyncStatus(projectId: string) {
    const response = await fetch(API_ENDPOINTS.GET_SYNC_STATUS(projectId), {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};