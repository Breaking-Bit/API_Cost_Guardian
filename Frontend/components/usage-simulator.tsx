"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Loader2, Zap } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { API_SERVICES, SERVICE_CONFIGS } from '@/config/services';

interface UsageSimulatorProps {
  onSimulate: (serviceName: string, usageQuantity: number) => Promise<void>
  services: string[]
}

export default function UsageSimulator({ onSimulate, services }: UsageSimulatorProps) {
  const [selectedService, setSelectedService] = useState(services[0])
  const [usageQuantity, setUsageQuantity] = useState(100)
  const [isSimulating, setIsSimulating] = useState(false)

  const handleSimulate = async () => {
    setIsSimulating(true)
    try {
      await onSimulate(selectedService, usageQuantity)
    } finally {
      setIsSimulating(false)
    }
  }

  // Update the calculateCost function
  const calculateCost = (service: string, quantity: number): number => {
    const rates: Record<string, number> = {
      [API_SERVICES.GPT4]: 0.03,
      [API_SERVICES.DALLE]: 0.02,
      [API_SERVICES.GEMINI]: 0.01,
      [API_SERVICES.CLAUDE]: 0.015,
    };
    return quantity * (rates[service] || 0.01);
  };

  const estimatedCost = calculateCost(selectedService, usageQuantity)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Usage Simulator</CardTitle>
          <CardDescription>Simulate API usage to see how it affects your costs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="service">Select Service</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger id="service">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="usage">Usage Quantity (API Calls)</Label>
              <span className="text-sm font-medium">{usageQuantity}</span>
            </div>
            <Slider
              id="usage"
              min={1}
              max={1000}
              step={1}
              value={[usageQuantity]}
              onValueChange={(value) => setUsageQuantity(value[0])}
            />
            <Input
              type="number"
              value={usageQuantity}
              onChange={(e) => setUsageQuantity(Number(e.target.value))}
              min={1}
              max={10000}
              className="mt-2"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm">
            Estimated cost: <span className="font-bold">${estimatedCost.toFixed(2)}</span>
          </div>
          <Button onClick={handleSimulate} disabled={isSimulating}>
            {isSimulating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Simulate Usage
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Rate Information</CardTitle>
          <CardDescription>Current pricing for different API services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => {
              const rate = calculateCost(service, 1)
              return (
                <div key={service} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div className="font-medium">{service}</div>
                  <div className="text-sm">
                    <span className="font-bold">${rate.toFixed(3)}</span> per API call
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500">
            These rates are used for simulation purposes only and may not reflect actual pricing.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
