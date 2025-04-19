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
import { Textarea } from "@/components/ui/textarea"
import { ArrowUpRight, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ApiTestProps {
  service: string
  projectId: string
}

export function ApiTestDialog({ service, projectId }: ApiTestProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleTest = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/services/${service}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      })
      
      const data = await response.json()
      setOutput(data.output)
    } catch (error) {
      toast({
        title: "Error testing API",
        description: "Please check your configuration and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center">
          <ArrowUpRight className="h-4 w-4 mr-1" />
          Try API
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Test {service} API</DialogTitle>
          <DialogDescription>
            Try out the API with your current configuration.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Input</label>
            <Textarea
              placeholder="Enter your test input..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={handleTest} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Processing...
              </>
            ) : (
              "Test API"
            )}
          </Button>
          {output && (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Output</label>
              <Textarea value={output} readOnly rows={4} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}