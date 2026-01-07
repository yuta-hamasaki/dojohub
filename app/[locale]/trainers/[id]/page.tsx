"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users } from "lucide-react"
import { localePath } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/config"

interface TrainerProfile {
  id: string
  bio: string
  specialties: string[]
  total_subscribers: number
  user: {
    full_name: string
    avatar_url: string
    email: string
  }
  subscription_plans: Array<{
    id: string
    name: string
    description: string
    price: number
    billing_period: string
    is_active: boolean
  }>
}

export default function TrainerProfilePage() {
  const [trainer, setTrainer] = useState<TrainerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as Locale) || "ja"
  const trainerId = params.id as string

  useEffect(() => {
    loadTrainer()
  }, [trainerId])

  const loadTrainer = async () => {
    try {
      const response = await fetch(`/api/trainers/${trainerId}`)
      const data = await response.json()
      setTrainer(data.trainer)
    } catch (error) {
      console.error("[v0] Error loading trainer:", error)
    } finally {
      setLoading(false)
    }
  }
  
  console.log("Trainer data:", trainer)

  const handleSubscribe = (planId: string) => {
    router.push(localePath(`/checkout/${planId}`, locale))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!trainer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Trainer not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-secondary py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={trainer.user.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-4xl">{trainer.user.full_name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{trainer.user.full_name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Users className="h-5 w-5" />
                <span>{trainer.total_subscribers} subscribers</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trainer.specialties?.map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="text-sm">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <Tabs defaultValue="about" className="space-y-6">
            <TabsList>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About {trainer.user.full_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{trainer.bio}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plans" className="space-y-6">
              {trainer.subscription_plans?.filter((p) => p.is_active).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No subscription plans available yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trainer.subscription_plans
                    .filter((plan) => plan.is_active)
                    .map((plan) => (
                      <Card key={plan.id} className="relative">
                        <CardHeader>
                          <CardTitle>{plan.name}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                          <div className="pt-4">
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-bold">${plan.price}</span>
                              <span className="text-muted-foreground">
                                /{plan.billing_period === "monthly" ? "mo" : "yr"}
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button onClick={() => handleSubscribe(plan.id)} className="w-full" size="lg">
                            Subscribe Now
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}
