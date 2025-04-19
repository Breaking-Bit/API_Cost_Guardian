"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertTriangle, CheckCircle, Bell } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import DashboardLayout from "@/components/dashboard-layout"
import { fetchProjects, checkBudgetAlerts } from "@/lib/api"
import type { Project } from "@/lib/types"

interface Alert {
  project_id: string
  service_name: string
  message: string
  type: "warning" | "critical" | "info"
  timestamp: string
}

export default function NotificationsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [alerts, setAlerts] = useState<Record<string, Alert[]>>({})
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
      
      const alertsData: Record<string, Alert[]> = {}
      for (const project of projectsData) {
        const projectAlerts = await checkBudgetAlerts(token, project._id)
        alertsData[project._id] = projectAlerts.alerts || []
      }
      setAlerts(alertsData)
    } catch (error) {
      toast({
        title: "Error loading alerts",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "warning":
        return <Bell className="h-5 w-5 text-yellow-500" />
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Notifications</h1>

        <div className="grid grid-cols-1 gap-6">
          {projects.map((project) => (
            <Card key={project._id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {project.name}
                  <span className="text-sm font-normal text-gray-500">
                    {alerts[project._id]?.length || 0} alerts
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alerts[project._id]?.length ? (
                  <div className="space-y-4">
                    {alerts[project._id].map((alert, index) => (
                      <div
                        key={index}
                        className={`flex items-start space-x-4 p-4 rounded-lg ${
                          alert.type === "critical"
                            ? "bg-red-50 dark:bg-red-900/10"
                            : alert.type === "warning"
                            ? "bg-yellow-50 dark:bg-yellow-900/10"
                            : "bg-green-50 dark:bg-green-900/10"
                        }`}
                      >
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <h4 className="font-medium">{alert.service_name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No alerts for this project</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}