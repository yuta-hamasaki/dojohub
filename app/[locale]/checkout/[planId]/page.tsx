"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import { t } from "@/lib/i18n/translations"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  billing_period: string
  trainer: {
    user: {
      full_name: string
    }
  }
}

export default function CheckoutPage() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const params = useParams()
  const planId = params.planId as string
  const locale = (params.locale as Locale) || "en"

  useEffect(() => {
    loadPlan()
  }, [planId])

  const loadPlan = async () => {
    try {
      // This would need an API endpoint to fetch a single plan
      // For now, we'll show a simplified version
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error loading plan:", error)
      setLoading(false)
    }
  }

  const handleCheckout = async () => {
    setProcessing(true)
    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (error: any) {
      console.error("[v0] Checkout error:", error)
      alert(error.message || "Failed to create checkout session")
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-2xl">{t(locale, "checkout.title")}</CardTitle>
          <CardDescription>{t(locale, "checkout.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-secondary p-6 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">{t(locale, "checkout.stripe_description")}</p>
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>{t(locale, "checkout.secure_payment")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>{t(locale, "checkout.cancel_anytime")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>{t(locale, "checkout.instant_access")}</span>
              </div>
            </div>
          </div>

          <Button onClick={handleCheckout} disabled={processing} size="lg" className="w-full">
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t(locale, "checkout.processing")}
              </>
            ) : (
              t(locale, "checkout.proceed_payment")
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {t(locale, "checkout.terms_agreement")}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
