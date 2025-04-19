import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

export default function DocumentationPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Documentation</h1>
      
      <Tabs defaultValue="getting-started">
        <TabsList>
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="api-integration">API Integration</TabsTrigger>
          <TabsTrigger value="cost-management">Cost Management</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started">
          <Card>
            <CardContent className="prose dark:prose-invert max-w-none pt-6">
              <h2>Getting Started</h2>
              <p>Our platform provides a secure way to manage and monitor your AI API usage:</p>
              <ol>
                <li>Register an account</li>
                <li>Create a project</li>
                <li>Add your API keys</li>
                <li>Set up budgets and alerts</li>
                <li>Start making API calls through our proxy</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-integration">
          <Card>
            <CardContent className="prose dark:prose-invert max-w-none pt-6">
              <h2>API Integration</h2>
              <p>Integrate with our proxy using standard REST calls:</p>
              <pre>{`
POST /api/proxy/{service}
Headers:
  Authorization: Bearer {your_token}
  X-Project-ID: {project_id}
  X-{Service}-Key: {your_api_key}
              `}</pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost-management">
          <Card>
            <CardContent className="prose dark:prose-invert max-w-none pt-6">
              <h2>Cost Management</h2>
              <p>Monitor and control your API usage costs:</p>
              <ul>
                <li>Set monthly budgets per service</li>
                <li>Configure alert thresholds</li>
                <li>View detailed usage analytics</li>
                <li>Export cost reports</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}