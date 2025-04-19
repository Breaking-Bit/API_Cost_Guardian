import { APIServiceInterface } from "@/components/api-service-interface"
import { API_SERVICES, SERVICE_CONFIGS } from "@/config/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ServicesPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">API Services</h1>
      
      <Tabs defaultValue={API_SERVICES.GEMINI}>
        <TabsList className="grid w-full grid-cols-4">
          {Object.values(API_SERVICES).map((service) => (
            <TabsTrigger key={service} value={service}>
              {service}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(API_SERVICES).map(([key, service]) => (
          <TabsContent key={service} value={service}>
            <Card>
              <CardHeader>
                <CardTitle>{service} Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <APIServiceInterface
                  service={service}
                  {...SERVICE_CONFIGS[key]}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}