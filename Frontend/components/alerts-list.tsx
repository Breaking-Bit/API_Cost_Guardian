"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchAlerts, resolveAlert, checkBudgetAlerts } from "@/lib/api"
import type { Alert } from "@/lib/types"

interface AlertsListProps {
  projectId: string
  token: string
}

export default function AlertsList({ projectId, token }: AlertsListProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAlerts()
  }, [projectId, token])

  const loadAlerts = async () => {
    setIsLoading(true)
    try {
      const data = await fetchAlerts(token, projectId)
      // Sort alerts by creation date, newest first
      const sortedAlerts = data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setAlerts(sortedAlerts)
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

  const handleCheckAlerts = async () => {
    setIsChecking(true);
    try {
        // Check both budget and usage alerts
        const [budgetResult, usageResult] = await Promise.all([
            checkBudgetAlerts(token, projectId),
            checkGeminiUsageSpike(token, projectId)
        ]);

        const totalAlerts = 
            (budgetResult.alerts_generated || 0) + 
            (usageResult.alert_generated ? 1 : 0);

        if (totalAlerts > 0) {
            await loadAlerts();
        }

        toast({
            title: `${totalAlerts} new alert(s) generated`,
            description: totalAlerts > 0
                ? "New alerts have been generated"
                : "No new alerts were generated",
        });
    } catch (error) {
        toast({
            title: "Error checking alerts",
            description: "Please try again later",
            variant: "destructive",
        });
    } finally {
        setIsChecking(false);
    }
};

  // Add auto-refresh for alerts
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isChecking && !isLoading) {
        loadAlerts()
      }
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [isChecking, isLoading])

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(token, alertId)
      setAlerts(alerts.filter((alert) => alert._id !== alertId))
      toast({
        title: "Alert resolved",
        description: "The alert has been marked as resolved",
      })
    } catch (error) {
      toast({
        title: "Error resolving alert",
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "budget_threshold":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "cost_spike":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Alerts</h2>
        <Button onClick={handleCheckAlerts} disabled={isChecking}>
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Check for New Alerts"
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-xl font-medium mb-2">All Clear!</p>
            <p className="text-gray-500 text-center max-w-md">
              No active alerts at the moment. Your API usage is within expected parameters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert._id} className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    {getAlertTypeIcon(alert.alert_type)}
                    <CardTitle className="ml-2">{alert.service_name}</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleResolveAlert(alert._id)}>
                    Resolve
                  </Button>
                </div>
                <CardDescription>{new Date(alert.created_at).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{alert.message}</p>
                {alert.current_value && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Current value: </span>
                    {alert.current_value.toFixed(2)}%
                  </div>
                )}
                {alert.threshold && (
                  <div className="text-sm">
                    <span className="font-medium">Threshold: </span>
                    {alert.threshold}%
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
