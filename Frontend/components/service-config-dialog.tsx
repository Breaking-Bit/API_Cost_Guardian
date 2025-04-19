"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ServiceConfigProps {
  service: string
  projectId: string
  onUpdate: () => void
}

export function ServiceConfigDialog({ service, projectId, onUpdate }: ServiceConfigProps) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState({
    apiKey: "",
    maxTokens: "4000",
    temperature: "0.7",
  })
  const { toast } = useToast()

  const handleSave = async () => {
    try {
      // API call to save configuration
      await fetch(`/api/projects/${projectId}/services/${service}/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      toast({
        title: "Configuration saved",
        description: `${service} configuration has been updated successfully.`,
      })
      onUpdate()
      setOpen(false)
    } catch (error) {
      toast({
        title: "Error saving configuration",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center">
          <Settings2 className="h-4 w-4 mr-1" />
          Configure
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{service} Configuration</DialogTitle>
          <DialogDescription>
            Configure your API settings for {service}. These settings will be used for all API calls.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="Enter your API key"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              value={config.maxTokens}
              onChange={(e) => setConfig({ ...config, maxTokens: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="temperature">Temperature</Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}