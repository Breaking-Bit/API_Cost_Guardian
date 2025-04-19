import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ServiceCardProps {
  name: string;
  config: {
    requiresApiKey: boolean;
    defaultModel: string;
    unit: string;
  };
}

export function ServiceCard({ name, config }: ServiceCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {name}
          <Badge variant="outline">{config.unit}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Default Model: {config.defaultModel}</p>
          <p>API Key Required: {config.requiresApiKey ? "Yes" : "No"}</p>
        </div>
      </CardContent>
    </Card>
  )
}