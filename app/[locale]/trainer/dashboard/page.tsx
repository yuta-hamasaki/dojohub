"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DollarSign, Users, Video, FileText, Eye } from "lucide-react"
import Link from "next/link"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { localePath } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/config"

interface AnalyticsData {
  revenue: {
    gross: number
    platformFee: number
    net: number
  }
  subscribers: {
    total: number
    active: number
  }
  content: {
    totalViews: number
    videoCount: number
    articleCount: number
    total: number
  }
  recentSubscribers: Array<{
    id: string
    created_at: string
    client?: {
      full_name: string
      avatar_url: string | null
    }
    plan?: {
      name: string
    }
  }>
  revenueHistory: Array<{
    month: string
    revenue: number
  }>
}

export default function TrainerDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const locale = (params.locale as Locale) || "en"

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const response = await fetch("/api/trainer/analytics")
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error("[v0] Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Failed to load analytics</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Trainer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your performance and revenue</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={localePath("/trainer/plans", locale)}>Manage Plans</Link>
          </Button>
          <Button asChild>
            <Link href={localePath("/trainer/content", locale)}>Add Content</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.revenue.net.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">After platform fee (7%)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.subscribers.active}</div>
            <p className="text-xs text-muted-foreground">{analytics.subscribers.total} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.content.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Library</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.content.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.content.videoCount} videos, {analytics.content.articleCount} articles
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue after platform fees</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.revenueHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Subscribers */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Subscribers</CardTitle>
            <CardDescription>New members who joined recently</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recentSubscribers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No subscribers yet</p>
            ) : (
              <div className="space-y-4">
                {analytics.recentSubscribers.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={sub.client?.avatar_url || undefined} />
                      <AvatarFallback>{sub.client?.full_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sub.client?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{sub.plan?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href={localePath("/trainer/content", locale)}>
                <Video className="mr-2 h-4 w-4" />
                Add Video
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={localePath("/trainer/content", locale)}>
                <FileText className="mr-2 h-4 w-4" />
                Write Article
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={localePath("/trainer/plans", locale)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Create Plan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
