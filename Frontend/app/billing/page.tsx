"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import DashboardLayout from "@/components/dashboard-layout"
import CostChart from "@/components/cost-chart"
import { fetchProjects, fetchCostSummary } from "@/lib/api"
import type { Project, CostBreakdown } from "@/lib/types"

export default function BillingPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [costData, setCostData] = useState<Record<string, CostBreakdown[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated, token } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated) return
    loadData()
  }, [isAuthenticated, token])

  const loadData = async () => {
    try {
      const projectsData = await fetchProjects(token)
      setProjects(projectsData)
      
      const costsData: Record<string, CostBreakdown[]> = {}
      for (const project of projectsData) {
        const summary = await fetchCostSummary(token, project._id)
        costsData[project._id] = summary.top_3_apis || []
      }
      setCostData(costsData)
    } catch (error) {
      toast({
        title: "Error loading billing data",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotalCost = (breakdowns: CostBreakdown[]) => {
    return breakdowns.reduce((sum, item) => sum + item.total_cost, 0)
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Billing Overview</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Monthly Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${Object.values(costData).reduce((sum, breakdown) => sum + calculateTotalCost(breakdown), 0).toFixed(2)}
              </div>
              <p className="text-sm text-gray-500">Across all projects</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{projects.length}</div>
              <p className="text-sm text-gray-500">With recorded usage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Service</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.values(costData).flat().length > 0 ? (
                <>
                  <div className="text-3xl font-bold">
                    {Object.values(costData)
                      .flat()
                      .sort((a, b) => b.total_cost - a.total_cost)[0]?._id}
                  </div>
                  <p className="text-sm text-gray-500">Highest cost service</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">No services used yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Cost Overview</TabsTrigger>
            <TabsTrigger value="projects">Project Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Overall Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <CostChart
                  data={Object.values(costData)
                    .flat()
                    .reduce((acc: CostBreakdown[], curr) => {
                      const existing = acc.find((item) => item._id === curr._id)
                      if (existing) {
                        existing.total_cost += curr.total_cost
                        existing.total_usage += curr.total_usage
                      } else {
                        acc.push({ ...curr })
                      }
                      return acc
                    }, [])}
                  type="pie"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Card key={project._id}>
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <CostChart data={costData[project._id] || []} type="bar" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Total Cost:</span>
                        <span className="font-bold">
                          ${calculateTotalCost(costData[project._id] || []).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Active Services:</span>
                        <span>{costData[project._id]?.length || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}