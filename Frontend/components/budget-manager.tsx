"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { fetchBudgets, createBudget, updateBudget, deactivateBudget } from "@/lib/api"
import type { Budget, BudgetUtilization } from "@/lib/types"

interface BudgetManagerProps {
  projectId: string
  token: string
  onUpdate: () => void
  existingBudgets: BudgetUtilization[]
}

export default function BudgetManager({ projectId, token, onUpdate, existingBudgets }: BudgetManagerProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newBudget, setNewBudget] = useState({
    service_name: "",
    budget_amount: 100,
    budget_period: "monthly",
    alert_threshold: 80,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadBudgets()
  }, [projectId, token])

  const loadBudgets = async () => {
    setIsLoading(true)
    try {
      const data = await fetchBudgets(token, projectId)
      setBudgets(data)
    } catch (error) {
      toast({
        title: "Error loading budgets",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createBudget(token, projectId, newBudget)
      setNewBudget({
        service_name: "",
        budget_amount: 100,
        budget_period: "monthly",
        alert_threshold: 80,
      })
      setDialogOpen(false)
      await loadBudgets()
      onUpdate()
      toast({
        title: "Budget created",
        description: "Your budget has been created successfully",
      })
    } catch (error) {
      toast({
        title: "Error creating budget",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateBudget = async (budgetId: string, updates: Partial<Budget>) => {
    try {
      await updateBudget(token, budgetId, updates)
      await loadBudgets()
      onUpdate()
      toast({
        title: "Budget updated",
        description: "Your budget has been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error updating budget",
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  const handleDeactivateBudget = async (budgetId: string) => {
    try {
      await deactivateBudget(token, budgetId)
      await loadBudgets()
      onUpdate()
      toast({
        title: "Budget deactivated",
        description: "Your budget has been deactivated successfully",
      })
    } catch (error) {
      toast({
        title: "Error deactivating budget",
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  const services = ["GPT-4", "DALL-E", "Gemini", "Claude"]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Budget Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateBudget}>
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
                <DialogDescription>
                  Set a budget for a specific API service to monitor and control costs.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="service_name">Service</Label>
                  <Select
                    value={newBudget.service_name}
                    onValueChange={(value) => setNewBudget({ ...newBudget, service_name: value })}
                    required
                  >
                    <SelectTrigger id="service_name">
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
                  <Label htmlFor="budget_amount">Budget Amount ($)</Label>
                  <Input
                    id="budget_amount"
                    type="number"
                    value={newBudget.budget_amount}
                    onChange={(e) => setNewBudget({ ...newBudget, budget_amount: Number(e.target.value) })}
                    min={1}
                    step={1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_period">Budget Period</Label>
                  <Select
                    value={newBudget.budget_period}
                    onValueChange={(value) => setNewBudget({ ...newBudget, budget_period: value })}
                  >
                    <SelectTrigger id="budget_period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert_threshold">Alert Threshold (%)</Label>
                  <Input
                    id="alert_threshold"
                    type="number"
                    value={newBudget.alert_threshold}
                    onChange={(e) => setNewBudget({ ...newBudget, alert_threshold: Number(e.target.value) })}
                    min={1}
                    max={100}
                    step={1}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    You'll receive alerts when usage reaches this percentage of your budget.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Budget"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-4">No budgets set up yet</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((budget) => {
            const utilization = existingBudgets.find((b) => b.service_name === budget.service_name)
            const utilizationPercentage = utilization ? utilization.utilization_percentage : 0

            return (
              <Card key={budget._id}>
                <CardHeader>
                  <CardTitle>{budget.service_name}</CardTitle>
                  <CardDescription>
                    {budget.budget_period.charAt(0).toUpperCase() + budget.budget_period.slice(1)} budget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Budget Amount:</span>
                    <span className="font-bold">${budget.budget_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Alert Threshold:</span>
                    <span>{budget.alert_threshold}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Current Usage:</span>
                    <span>${utilization?.total_cost.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilization:</span>
                      <span
                        className={`font-medium ${
                          utilizationPercentage > 90
                            ? "text-red-500"
                            : utilizationPercentage > 70
                              ? "text-yellow-500"
                              : "text-green-500"
                        }`}
                      >
                        {utilizationPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          utilizationPercentage > 90
                            ? "bg-red-500"
                            : utilizationPercentage > 70
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => handleDeactivateBudget(budget._id)}>
                    <Trash className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      // Open edit dialog or implement inline editing
                      toast({
                        title: "Edit functionality",
                        description: "This would open an edit dialog in a complete implementation",
                      })
                    }}
                  >
                    Edit
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
