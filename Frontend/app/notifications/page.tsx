"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import DashboardLayout from "@/components/dashboard-layout"
import { useAuth } from "@/hooks/use-auth"
import { fetchNotificationSettings, updateNotificationSettings } from "@/lib/api"
import type { NotificationSettings } from "@/lib/types"

export default function NotificationsPage() {
  const { token } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    budgetAlerts: true,
    usageAlerts: true,
    weeklyReports: true
  })

  useEffect(() => {
    const loadSettings = async () => {
      if (!token) return
      
      setIsLoading(true)
      try {
        const data = await fetchNotificationSettings(token)
        setSettings(data)
      } catch (error) {
        toast({
          title: "Error loading settings",
          description: "Failed to load notification settings. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [token, toast])

  const handleToggle = async (setting: keyof NotificationSettings) => {
    const newSettings = { ...settings, [setting]: !settings[setting] }
    setSettings(newSettings)
    try {
      await updateNotificationSettings(token, newSettings)
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      })
    } catch (error) {
      // Revert the setting if the update failed
      setSettings(settings)
      toast({
        title: "Error updating settings",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Notification Settings</h1>
          <div className="animate-pulse">
            <Card>
              <CardHeader>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      <div className="h-3 w-48 bg-gray-100 rounded"></div>
                    </div>
                    <div className="h-6 w-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Notification Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Budget Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when you reach budget thresholds
                </p>
              </div>
              <Switch
                checked={settings.budgetAlerts}
                onCheckedChange={() => handleToggle('budgetAlerts')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Usage Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about unusual API usage patterns
                </p>
              </div>
              <Switch
                checked={settings.usageAlerts}
                onCheckedChange={() => handleToggle('usageAlerts')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Reports</p>
                <p className="text-sm text-muted-foreground">
                  Receive weekly usage and cost summaries
                </p>
              </div>
              <Switch
                checked={settings.weeklyReports}
                onCheckedChange={() => handleToggle('weeklyReports')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}