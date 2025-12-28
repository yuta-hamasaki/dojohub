"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Shield, TrendingUp, DollarSign, Activity } from "lucide-react"

interface ComplianceData {
  trainer: {
    verification_status: string
    risk_level: string
    terms_accepted: boolean
    suspicious_activity_count: number
    last_payout_at: string | null
  }
  compliance_checks: any[]
  activity_logs: any[]
  payout_logs: any[]
  metrics: {
    high_severity_count: number
    failed_payouts_count: number
    total_payouts: number
  }
}

export default function CompliancePage() {
  const [data, setData] = useState<ComplianceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [acceptingTerms, setAcceptingTerms] = useState(false)

  useEffect(() => {
    fetchComplianceData()
  }, [])

  async function fetchComplianceData() {
    try {
      const response = await fetch("/api/trainer/compliance")
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("Failed to fetch compliance data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function acceptTerms() {
    setAcceptingTerms(true)
    try {
      await fetch("/api/trainer/terms", { method: "POST" })
      await fetchComplianceData()
    } catch (error) {
      console.error("Failed to accept terms:", error)
    } finally {
      setAcceptingTerms(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading compliance data...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Failed to load compliance data</div>
      </div>
    )
  }

  const getRiskBadge = (level: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      low: "default",
      medium: "secondary",
      high: "destructive",
    }
    return <Badge variant={variants[level] || "default"}>{level.toUpperCase()}</Badge>
  }

  const getVerificationBadge = (status: string) => {
    return status === "verified" ? (
      <Badge className="bg-success text-success-foreground">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Verified
      </Badge>
    ) : (
      <Badge variant="secondary">
        <AlertCircle className="mr-1 h-3 w-3" />
        Pending
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Compliance & Security</h1>
        <p className="text-muted-foreground">Monitor your account status and security metrics</p>
      </div>

      {!data.trainer.terms_accepted && (
        <Card className="mb-6 border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Action Required: Accept Terms of Service
            </CardTitle>
            <CardDescription>
              You must accept the platform terms of service to continue receiving payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={acceptTerms} disabled={acceptingTerms}>
              {acceptingTerms ? "Accepting..." : "Accept Terms of Service"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="mt-2">{getVerificationBadge(data.trainer.verification_status)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="mt-2">{getRiskBadge(data.trainer.risk_level)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.total_payouts}</div>
            {data.metrics.failed_payouts_count > 0 && (
              <p className="text-xs text-destructive mt-1">{data.metrics.failed_payouts_count} failed</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.high_severity_count}</div>
            <p className="text-xs text-muted-foreground mt-1">High priority</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest security and compliance events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.activity_logs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start gap-4 border-b pb-3 last:border-0">
                  <div
                    className={`h-2 w-2 rounded-full mt-2 ${
                      log.severity === "high"
                        ? "bg-destructive"
                        : log.severity === "medium"
                          ? "bg-warning"
                          : "bg-success"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.activity_type.replace(/_/g, " ").toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">{log.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {data.activity_logs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No activity recorded</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>Recent payment transfers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.payout_logs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      ${log.amount.toFixed(2)} {log.currency.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={log.status === "paid" ? "default" : "destructive"}>{log.status}</Badge>
                </div>
              ))}
              {data.payout_logs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No payouts yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
