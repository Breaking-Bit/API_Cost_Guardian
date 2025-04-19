"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, RefreshCw, AlertTriangle, DollarSign } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { useAuth } from "@/hooks/use-auth"
import { fetchProjectDetails, syncProjectData, simulateApiUsage } from "@/lib/api"
import type { ProjectDetails } from "@/lib/types"
import CostChart from "@/components/cost-chart"
import UsageSimulator from "@/components/usage-simulator"
import BudgetManager from "@/components/budget-manager"
import AlertsList from "@/components/alerts-list"
import "@/styles/components/project-card.css"

export default function ProjectDetailsPage() {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
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
  }, [isAuthenticated, projectId, router, token])

  const loadProjectDetails = async () => {
    setIsLoading(true)
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

  const handleSyncData = async () => {
    setIsSyncing(true)
    try {
      await syncProjectData(token, projectId)
      await loadProjectDetails()
      toast({
        title: "Data synced successfully",
        description: "Your project data has been updated",
      })
    } catch (error) {
      toast({
        title: "Error syncing data",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSimulateUsage = async (serviceName: string, usageQuantity: number) => {
    try {
      await simulateApiUsage(token, projectId, {
        service_name: serviceName,
        usage_quantity: usageQuantity,
        cost: calculateCost(serviceName, usageQuantity),
        unit: "API_CALLS",
        region: "us-east-1",
      })

      await loadProjectDetails()
      toast({
        title: "Usage simulated",
        description: `Added ${usageQuantity} calls to ${serviceName}`,
      })
    } catch (error) {
      toast({
        title: "Error simulating usage",
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  const calculateCost = (service: string, quantity: number): number => {
    const rates: Record<string, number> = {
      "GPT-4": 0.03,
      "DALL-E": 0.02,
      Gemini: 0.01,
      Claude: 0.015,
    }
    return quantity * (rates[service] || 0.01)
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
        <Button onClick={handleSyncData} disabled={isSyncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync Data"}
        </Button>
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
          description="With recorded usage"
          icon={<Plus className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          title="Active Budgets"
          value={projectDetails.current_month_stats.active_budgets.toString()}
          description="With monitoring"
          icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="simulator">Usage Simulator</TabsTrigger>
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
                {projectDetails.usage_trends.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No usage data recorded yet</p>
                    <Button variant="outline" onClick={() => setActiveTab("simulator")}>
                      Simulate Usage
                    </Button>
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Cost Analysis</CardTitle>
              <CardDescription>Breakdown of costs by service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <CostChart data={projectDetails.cost_breakdown} />

                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Usage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Avg. Daily Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {projectDetails.cost_breakdown.map((service) => (
                        <tr key={service._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{service._id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">${service.total_cost.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{service.total_usage} calls</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            ${service.average_daily_cost.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets">
          <BudgetManager
            projectId={projectId}
            token={token}
            onUpdate={loadProjectDetails}
            existingBudgets={projectDetails.budget_utilization}
          />
        </TabsContent>

        <TabsContent value="simulator">
          <UsageSimulator onSimulate={handleSimulateUsage} services={["GPT-4", "DALL-E", "Gemini", "Claude"]} />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsList projectId={projectId} token={token} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

function StatCard({
  title,
  value,
  description,
  icon,
}: { title: string; value: string; description: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
