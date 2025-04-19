"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, DollarSign, AlertTriangle, BarChart2, Shield } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { useAuth } from "@/hooks/use-auth"
import { fetchProjectDetails } from "@/lib/api"
import type { ProjectDetails } from "@/lib/types"
import CostChart from "@/components/cost-chart"
import BudgetManager from "@/components/budget-manager"
import AlertsList from "@/components/alerts-list"
import { ServiceUsage } from "@/components/service-usage"
import { API_SERVICES } from "@/config/services"

import { Activity, Settings2, ArrowUpRight } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ServiceConfigDialog } from "@/components/service-config-dialog"
import { ApiTestDialog } from "@/components/api-test-dialog"

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function ProjectDetailsPage() {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const params = useParams()
  const projectId = params.projectId as string
  const { isAuthenticated, token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    loadProjectDetails()
    // Set up auto-refresh interval
    const interval = setInterval(loadProjectDetails, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [isAuthenticated, projectId, router, token])

  const loadProjectDetails = async () => {
    try {
      const data = await fetchProjectDetails(token, projectId)
      setProjectDetails(data)
    } catch (error) {
      toast({
        title: "Error loading project details",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (!projectDetails) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-gray-500 mb-4">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push("/dashboard")}>Back to Projects</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{projectDetails.project.name}</h1>
          <p className="text-gray-500">{projectDetails.project.description || "No description provided"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Total Cost"
          value={`$${projectDetails.current_month_stats.total_cost.toFixed(2)}`}
          description="Current month"
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
        />
        <StatCard
          title="Active Services"
          value={projectDetails.current_month_stats.services_count.toString()}
          description="With active usage"
          icon={<Shield className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          title="Active Budgets"
          value={projectDetails.current_month_stats.active_budgets.toString()}
          description="With monitoring"
          icon={<BarChart2 className="h-5 w-5 text-yellow-500" />}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>Service usage costs for the current month</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <CostChart data={projectDetails.cost_breakdown} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Utilization</CardTitle>
                <CardDescription>Current spending against budgets</CardDescription>
              </CardHeader>
              <CardContent>
                {projectDetails.budget_utilization.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No budgets set up yet</p>
                    <Button variant="outline" onClick={() => setActiveTab("budgets")}>
                      Set Up Budgets
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projectDetails.budget_utilization.map((budget) => (
                      <div key={budget.service_name} className="space-y-2">
                        <div className="flex justify-between">
                          <span>{budget.service_name}</span>
                          <span className="font-medium">
                            ${budget.total_cost.toFixed(2)} / ${budget.budget_amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              budget.utilization_percentage > 90
                                ? "bg-red-500"
                                : budget.utilization_percentage > 70
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(budget.utilization_percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Usage</CardTitle>
                <CardDescription>API calls in the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectDetails.usage_trends.slice(0, 5).map((usage) => (
                    <div key={`${usage._id.service}-${usage._id.day}`} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{usage._id.service}</div>
                        <div className="text-sm text-gray-500">{usage._id.day}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${usage.daily_cost.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">{usage.daily_usage} calls</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Available Services
                  <Badge variant="outline" className="ml-2">
                    {Object.keys(API_SERVICES).length} Services
                  </Badge>
                </CardTitle>
                <CardDescription>Configure and monitor your API services</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-6">
                    {Object.values(API_SERVICES).map((service) => (
                      <div key={service} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Activity className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">{service}</h3>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ServiceConfigDialog 
                              service={service} 
                              projectId={projectId} 
                              onUpdate={loadProjectDetails} 
                            />
                            <ApiTestDialog 
                              service={service} 
                              projectId={projectId} 
                            />
                          </div>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Monthly Usage</p>
                            <p className="text-2xl font-bold">
                              {projectDetails.usage_trends
                                .filter(u => u._id.service === service)
                                .reduce((acc, curr) => acc + curr.daily_usage, 0)
                                .toLocaleString()} calls
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Total Cost</p>
                            <p className="text-2xl font-bold">
                              ${projectDetails.usage_trends
                                .filter(u => u._id.service === service)
                                .reduce((acc, curr) => acc + curr.daily_cost, 0)
                                .toFixed(2)}
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Budget Status</p>
                            {projectDetails.budget_utilization
                              .find(b => b.service_name === service) ? (
                              <div className="flex items-center space-x-2">
                                <div className={`h-2 w-2 rounded-full ${
                                  projectDetails.budget_utilization.find(b => b.service_name === service)!
                                    .utilization_percentage > 90
                                    ? "bg-red-500"
                                    : projectDetails.budget_utilization.find(b => b.service_name === service)!
                                      .utilization_percentage > 70
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                }`} />
                                <span className="text-sm font-medium">
                                  {projectDetails.budget_utilization.find(b => b.service_name === service)!
                                    .utilization_percentage.toFixed(1)}% used
                                </span>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveTab("budgets")}
                              >
                                Set Budget
                              </Button>
                            )}
                          </div>
                        </div>

                        <ServiceUsage projectId={projectId} service={service} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budgets">
          <BudgetManager
            projectId={projectId}
            token={token}
            onUpdate={loadProjectDetails}
            existingBudgets={projectDetails.budget_utilization}
          />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsList projectId={projectId} token={token} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
