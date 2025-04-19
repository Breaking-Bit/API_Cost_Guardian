import type { 
    Project, 
    ProjectDetails, 
    Budget, 
    Alert, 
    UsageTrend, 
    NotificationSettings, 
    BillingDetails,
    APIServiceResponse,
    APIUsageStats 
} from "./types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Helper function for API requests
async function apiRequest(endpoint: string, method = "GET", token: string, data?: any, projectId?: string) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }

  if (projectId) {
    headers["X-Project-ID"] = projectId
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: "include",
  }

  if (data && (method === "POST" || method === "PUT")) {
    config.body = JSON.stringify(data)
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || "API request failed")
  }

  return response.json()
}

// Auth API
export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/companies/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error("Login failed")
  }

  return response.json()
}

export async function register(name: string, email: string, password: string) {
  const response = await fetch(`${API_URL}/api/companies/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  })

  if (!response.ok) {
    throw new Error("Registration failed")
  }

  return response.json()
}

// Projects API
export async function fetchProjects(token: string): Promise<Project[]> {
  return apiRequest("/api/projects", "GET", token)
}

export async function createProject(
  token: string,
  projectData: { name: string; description: string },
): Promise<Project> {
  return apiRequest("/api/projects", "POST", token, projectData)
}

export async function fetchProjectDetails(token: string, projectId: string): Promise<ProjectDetails> {
  return apiRequest(`/api/projects/${projectId}`, "GET", token)
}

// Budgets API
export async function fetchBudgets(token: string, projectId: string): Promise<Budget[]> {
  return apiRequest("/api/budgets", "GET", token, undefined, projectId)
}

export async function createBudget(token: string, projectId: string, budgetData: any): Promise<Budget> {
  return apiRequest("/api/budgets", "POST", token, budgetData, projectId)
}

export async function updateBudget(token: string, budgetId: string, updates: Partial<Budget>): Promise<Budget> {
  return apiRequest(`/api/budgets/${budgetId}`, "PUT", token, updates)
}

export async function deactivateBudget(token: string, budgetId: string): Promise<any> {
  return apiRequest(`/api/budgets/${budgetId}/deactivate`, "PUT", token)
}

// Cost Data API
export async function simulateApiUsage(token: string, projectId: string, usageData: any): Promise<any> {
  return apiRequest("/api/cost-data/usage", "POST", token, usageData, projectId)
}

export async function fetchCostSummary(token: string, projectId: string): Promise<any> {
  return apiRequest("/api/cost-data/summary", "GET", token, undefined, projectId)
}

// Alerts API
export async function fetchAlerts(token: string, projectId: string): Promise<Alert[]> {
  return apiRequest("/api/alerts", "GET", token, undefined, projectId)
}

export async function resolveAlert(token: string, alertId: string): Promise<any> {
  return apiRequest(`/api/alerts/${alertId}/resolve`, "PUT", token)
}

export async function checkBudgetAlerts(token: string, projectId: string): Promise<any> {
  return apiRequest("/api/alerts/check-budget", "POST", token, {}, projectId)
}

export async function checkGeminiUsageSpike(token: string, projectId: string): Promise<any> {
    return apiRequest("/api/alerts/check-gemini-usage", "POST", token, {}, projectId);
}

// Sync API
export async function syncProjectData(token: string, projectId: string): Promise<any> {
  return apiRequest("/api/sync", "POST", token, {}, projectId)
}

export async function getSyncStatus(token: string, projectId: string): Promise<any> {
  return apiRequest("/api/sync/status", "GET", token, undefined, projectId)
}

export async function fetchUsageTrends(token: string, projectId: string): Promise<UsageTrend[]> {
  return apiRequest("/api/analytics/usage-trends", "GET", token, undefined, projectId)
}

export async function fetchBillingDetails(token: string): Promise<BillingDetails> {
  return apiRequest("/api/billing/details", "GET", token)
}

export async function fetchNotificationSettings(token: string): Promise<NotificationSettings> {
  return apiRequest("/api/notifications/settings", "GET", token)
}

export async function updateNotificationSettings(
  token: string, 
  settings: NotificationSettings
): Promise<NotificationSettings> {
  return apiRequest("/api/notifications/settings", "PUT", token, settings)
}

// API Proxy endpoints
export async function callExternalAPI(
  token: string,
  projectId: string,
  service: string,
  payload: any,
  options?: {
    model?: string;
    apiKey?: string;
  }
): Promise<APIServiceResponse> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "X-Project-ID": projectId
  };

  if (options?.apiKey) {
    headers[`X-${service}-Key`] = options.apiKey;
  }

  return apiRequest(
    `/api/proxy/${service.toLowerCase()}`,
    "POST",
    token,
    {
      ...payload,
      model: options?.model
    },
    projectId
  );
}

export async function getServiceUsage(
  token: string,
  projectId: string,
  service: string,
  timeframe?: string
): Promise<APIUsageStats[]> {
  return apiRequest(
    `/api/proxy/${service.toLowerCase()}/usage`,
    "GET",
    token,
    { timeframe },
    projectId
  );
}
