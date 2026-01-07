"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { localePath } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/config"

export default function TrainerOnboardingPage() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [onboarded, setOnboarded] = useState(false)
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as Locale) || "en"

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/stripe/account-status")
      const data = await response.json()
      setOnboarded(data.onboarded)

      if (data.onboarded) {
        // Already onboarded, redirect to setup
        setTimeout(() => router.push(localePath("/trainer/onboarding/complete", locale)), 2000)
      }
    } catch (error) {
      console.error("[v0] Error checking status:", error)
    } finally {
      setChecking(false)
    }
  }

  const handleStartOnboarding = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("Failed to create onboarding link")
      }
    } catch (error) {
      console.error("[v0] Onboarding error:", error)
      alert("Failed to start onboarding. Please try again.")
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (onboarded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle>Already Connected!</CardTitle>
            </div>
            <CardDescription>Redirecting you to complete your profile...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Setup Your Trainer Account</CardTitle>
          <CardDescription className="text-base">
            Connect your Stripe account to start receiving payments from your subscribers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge className="mt-1">1</Badge>
              <div>
                <h3 className="font-semibold mb-1">Connect Stripe Account</h3>
                <p className="text-sm text-muted-foreground">
                  You'll be redirected to Stripe to create or connect your account. This is secure and takes just a few
                  minutes.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-1">2</Badge>
              <div>
                <h3 className="font-semibold mb-1">Complete Your Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Add your bio, specialties, and what makes your training unique
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-1">3</Badge>
              <div>
                <h3 className="font-semibold mb-1">Create Subscription Plans</h3>
                <p className="text-sm text-muted-foreground">
                  Set your pricing and what subscribers will get access to
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-1">4</Badge>
              <div>
                <h3 className="font-semibold mb-1">Start Sharing Content</h3>
                <p className="text-sm text-muted-foreground">Upload videos and articles to grow your subscriber base</p>
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Payment Processing</p>
              <p>Platform fee: 7% per transaction. Payments are automatically transferred to your account.</p>
            </div>
          </div>

          <Button onClick={handleStartOnboarding} disabled={loading} size="lg" className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to Stripe...
              </>
            ) : (
              "Connect Stripe Account"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
