export interface Project {
  _id: string
  name: string
  description?: string
  company: string
  status: string
  created_at: string
}

export interface Budget {
  _id: string
  company: string
  project: string
  service_name: string
  budget_amount: number
  budget_period: string
  alert_threshold: number
  budget_status: string
  created_at: string
  updated_at: string
}

export interface CostBreakdown {
  _id: string
  total_cost: number
  total_usage: number
  average_daily_cost: number
}

export interface BudgetUtilization {
  service_name: string
  total_cost: number
  budget_amount: number
  utilization_percentage: number
}

export interface UsageTrend {
  _id: {
    service: string
    day: string
  }
  daily_usage: number
  daily_cost: number
}

export interface ProjectDetails {
  project: Project
  current_month_stats: {
    total_cost: number
    active_budgets: number
    services_count: number
  }
  budget_utilization: BudgetUtilization[]
  usage_trends: UsageTrend[]
  cost_breakdown: CostBreakdown[]
}

export interface Alert {
  _id: string
  company: string
  project: string
  service_name: string
  alert_type: string
  message: string
  status: string
  threshold?: number
  current_value?: number
  created_at: string
  resolved_at?: string
}
