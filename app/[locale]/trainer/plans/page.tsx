"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, DollarSign } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import type { SubscriptionPlan } from "@/lib/types/database"

export default function TrainerPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await fetch("/api/subscription-plans")
      const data = await response.json()
      setPlans(data.plans || [])
    } catch (error) {
      console.error("[v0] Error loading plans:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async () => {
    if (!name || !price) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/subscription-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: Number.parseFloat(price),
          billing_period: billingPeriod,
        }),
      })

      if (!response.ok) throw new Error("Failed to create plan")

      await loadPlans()
      resetForm()
      setDialogOpen(false)
    } catch (error: any) {
      alert(error.message || "Failed to create plan")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdatePlan = async () => {
    if (!editingPlan) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/subscription-plans/${editingPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          is_active: isActive,
        }),
      })

      if (!response.ok) throw new Error("Failed to update plan")

      await loadPlans()
      resetForm()
      setDialogOpen(false)
    } catch (error: any) {
      alert(error.message || "Failed to update plan")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return

    try {
      const response = await fetch(`/api/subscription-plans/${planId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      await loadPlans()
    } catch (error: any) {
      alert(error.message || "Failed to delete plan")
    }
  }

  const openEditDialog = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setName(plan.name)
    setDescription(plan.description || "")
    setPrice(plan.price.toString())
    setBillingPeriod(plan.billing_period)
    setIsActive(plan.is_active)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingPlan(null)
    setName("")
    setDescription("")
    setPrice("")
    setBillingPeriod("monthly")
    setIsActive(true)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground mt-1">Manage your pricing and subscription offerings</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  placeholder="e.g., Elite Training Program"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-description">Description</Label>
                <Textarea
                  id="plan-description"
                  placeholder="What's included in this plan?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              {!editingPlan && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="plan-price">Price (USD)</Label>
                    <Input
                      id="plan-price"
                      type="number"
                      step="0.01"
                      placeholder="29.99"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Period</Label>
                    <RadioGroup value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as any)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" />
                        <Label htmlFor="monthly" className="font-normal cursor-pointer">
                          Monthly
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yearly" id="yearly" />
                        <Label htmlFor="yearly" className="font-normal cursor-pointer">
                          Yearly
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}
              {editingPlan && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="plan-active">Active</Label>
                  <Switch id="plan-active" checked={isActive} onCheckedChange={setIsActive} />
                </div>
              )}
            </div>
            <Button
              onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading plans...</div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No plans yet</h3>
            <p className="text-muted-foreground mb-4">Create your first subscription plan to start earning</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/{plan.billing_period === "monthly" ? "mo" : "yr"}</span>
                    </div>
                  </div>
                  {plan.is_active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <CardDescription className="mt-2">{plan.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(plan)} className="flex-1">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
