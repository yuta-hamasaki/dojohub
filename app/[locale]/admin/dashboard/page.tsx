"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Users, TrendingUp, FileText, AlertTriangle } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { t } from "@/lib/i18n/translations"
import type { Locale } from "@/lib/i18n/config"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboard({ params }: { params: { locale: Locale } }) {
  const { locale } = params
  const [stats, setStats] = useState<any>(null)
  const [topTrainers, setTopTrainers] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [riskAccounts, setRiskAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, trainersRes, activitiesRes, riskRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/top-trainers"),
        fetch("/api/admin/activities"),
        fetch("/api/admin/risk-accounts"),
      ])

      const statsData = await statsRes.json()
      const trainersData = await trainersRes.json()
      const activitiesData = await activitiesRes.json()
      const riskData = await riskRes.json()

      setStats(statsData)
      setTopTrainers(trainersData.topTrainers || [])
      setActivities(activitiesData.activities || [])
      setRiskAccounts(riskData.accounts || [])
    } catch (error) {
      console.error("Failed to load admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t(locale, "common.loading")}</div>
      </div>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "new_trainer":
        return "👤"
      case "new_subscription":
        return "💳"
      case "content_published":
        return "📹"
      case "payout":
        return "💰"
      default:
        return "📋"
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "destructive"
      case "medium":
        return "warning"
      default:
        return "secondary"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t(locale, "admin.title")}</h1>
        <p className="text-muted-foreground">{t(locale, "admin.platform_overview")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t(locale, "admin.total_revenue")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.stats?.totalRevenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t(locale, "admin.platform_fees")}: ${stats?.stats?.platformFees?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t(locale, "admin.total_trainers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats?.totalTrainers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t(locale, "admin.total_clients")}: {stats?.stats?.totalClients || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t(locale, "admin.active_subscriptions")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t(locale, "admin.total_content")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats?.totalContent || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Videos & Articles</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "admin.revenue_trend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: t(locale, "admin.monthly_revenue"),
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.charts?.monthlyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    name={t(locale, "admin.revenue")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "admin.user_growth")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                users: {
                  label: t(locale, "admin.users"),
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.charts?.userGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="var(--color-users)" name={t(locale, "admin.users")} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Trainers */}
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "admin.top_trainers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topTrainers.map((trainer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{trainer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {trainer.subscribers} {t(locale, "admin.subscribers")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${trainer.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t(locale, "admin.revenue")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "admin.recent_activities")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString(locale === "ja" ? "ja-JP" : "en-US")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Monitoring */}
      {riskAccounts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {t(locale, "admin.risk_monitoring")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-muted-foreground">{account.issues}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* <Badge variant={getRiskColor(account.riskLevel) as any}>
                      {t(locale, `compliance.risk_${account.riskLevel}`)}
                    </Badge> */}
                    <Button size="sm" variant="outline">
                      {t(locale, "admin.review")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
