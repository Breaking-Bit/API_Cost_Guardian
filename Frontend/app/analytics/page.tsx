"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { fetchCostSummary, fetchProjects } from "@/lib/api"
import { CostBreakdown, Project } from "@/lib/types"
import CostChart from "@/components/cost-chart"
import UsageSimulator from "@/components/usage-simulator"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, BarChart3 } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalyticsPage() {
  const { token, isAuthenticated } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsCostData, setProjectsCostData] = useState<Record<string, CostBreakdown[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const loadProjects = async () => {
    try {
      const projectsData = await fetchProjects(token)
      setProjects(projectsData)
      return projectsData
    } catch (error) {
      toast({
        title: "Error loading projects",
        description: "Could not fetch projects.",
        variant: "destructive",
      })
      return []
    }
  }

  const loadAllProjectsCostData = async (projects: Project[]) => {
    const costData: Record<string, CostBreakdown[]> = {}
    for (const project of projects) {
      try {
        const summary = await fetchCostSummary(token, project._id)
        costData[project._id] = summary.top_3_apis || []
      } catch (error) {
        console.error(`Error loading cost data for project ${project._id}:`, error)
      }
    }
    return costData
  }

  useEffect(() => {
    const initializeData = async () => {
      if (isAuthenticated && token) {
        setIsLoading(true)
        const projectsData = await loadProjects()
        const costData = await loadAllProjectsCostData(projectsData)
        setProjectsCostData(costData)
        setIsLoading(false)
      }
    }

    initializeData()
  }, [isAuthenticated, token])

  const services = ["GPT-4", "DALL-E", "Gemini", "Claude"]

  const calculateCost = (service: string, quantity: number): number => {
    const rates: Record<string, number> = {
      "GPT-4": 0.03,
      "DALL-E": 0.02,
      Gemini: 0.01,
      Claude: 0.015,
    }
    return quantity * (rates[service] || 0.01)
  }

  return (
    <DashboardLayout>
      <div className="analytics-container p-6">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>
        
        {/* Project Overview Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Projects Overview</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Card key={project._id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {project.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div style={{ height: "300px" }}>
                      <CostChart
                        data={projectsCostData[project._id] || []}
                        type="pie"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Usage Simulator Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Usage Simulator</h2>
          <UsageSimulator
            onSimulate={async (serviceName: string, usageQuantity: number) => {
              // Handle simulation for selected project
              toast({
                title: "Please select a project",
                description: "Select a project from the dashboard to simulate usage",
              })
            }}
            services={services}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}