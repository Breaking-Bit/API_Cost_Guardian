import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAPIService } from "@/hooks/use-api-service"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface ServiceUsageProps {
  projectId: string
  service: string
}

export function ServiceUsage({ projectId, service }: ServiceUsageProps) {
  const [usageData, setUsageData] = useState([])
  const { getUsageStats } = useAPIService(projectId, { service })

  useEffect(() => {
    const fetchUsage = async () => {
      const data = await getUsageStats()
      setUsageData(data)
    }
    fetchUsage()

    // Set up real-time updates
    const interval = setInterval(fetchUsage, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [projectId, service])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{service} Usage Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={usageData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_cost" fill="#0ea5e9" name="Cost ($)" />
              <Bar dataKey="usage_quantity" fill="#4ade80" name="API Calls" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}