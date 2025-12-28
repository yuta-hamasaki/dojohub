"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { localePath } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/config"

interface Subscription {
  id: string
  status: string
  created_at: string
  plan: {
    name: string
    price: number
    billing_period: string
    trainer: {
      id: string
      user: {
        full_name: string
        avatar_url: string
      }
    }
  }
}

export default function ClientDashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const locale = (params.locale as Locale) || "en"
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("subscriptions")
        .select(
          `
          *,
          plan:subscription_plans(
            name,
            price,
            billing_period,
            trainer:trainers(
              id,
              user:users(full_name, avatar_url)
            )
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setSubscriptions((data as any) || [])
    } catch (error) {
      console.error("[v0] Error loading subscriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your subscriptions and training</p>
        </div>
        <Button asChild>
          <Link href={localePath("/explore", locale)}>Explore Trainers</Link>
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Active Subscriptions</h3>
            <p className="text-muted-foreground mb-4">Start your training journey by subscribing to a trainer</p>
            <Button asChild>
              <Link href={localePath("/explore", locale)}>Browse Trainers</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <CardHeader>
                <div className="flex items-start gap-4 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={subscription.plan.trainer.user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{subscription.plan.trainer.user.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{subscription.plan.trainer.user.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{subscription.plan.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                    {subscription.status}
                  </Badge>
                  <p className="text-sm font-semibold">
                    ${subscription.plan.price}/{subscription.plan.billing_period === "monthly" ? "mo" : "yr"}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>Since {new Date(subscription.created_at).toLocaleDateString()}</span>
                </div>
                <Button className="w-full bg-transparent" variant="outline" asChild>
                  <Link href={localePath(`/trainers/${subscription.plan.trainer.id}`, locale)}>View Content</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
