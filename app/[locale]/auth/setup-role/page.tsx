"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { localePath } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/config"

export default function SetupRolePage() {
  const [role, setRole] = useState<"client" | "trainer">("client")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as Locale) || "en"
  const supabase = getSupabaseBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Update user role
      const { error: updateError } = await supabase.from("users").update({ role }).eq("id", user.id)

      if (updateError) throw updateError

      // If trainer, create trainer profile
      if (role === "trainer") {
        const { error: trainerError } = await supabase.from("trainers").insert({
          user_id: user.id,
        })

        if (trainerError) throw trainerError
        router.push(localePath("/trainer/onboarding", locale))
      } else {
        router.push(localePath("/dashboard", locale))
      }
    } catch (err: any) {
      setError(err.message || "Failed to set up account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Choose your role</CardTitle>
          <CardDescription>How do you want to use the platform?</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <RadioGroup value={role} onValueChange={(value) => setRole(value as "client" | "trainer")}>
              <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors">
                <RadioGroupItem value="client" id="client" className="mt-1" />
                <Label htmlFor="client" className="flex-1 cursor-pointer">
                  <div className="font-semibold">I'm looking for trainers</div>
                  <div className="text-sm text-muted-foreground">
                    Browse trainers, subscribe to content, and improve your skills
                  </div>
                </Label>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors">
                <RadioGroupItem value="trainer" id="trainer" className="mt-1" />
                <Label htmlFor="trainer" className="flex-1 cursor-pointer">
                  <div className="font-semibold">I'm a trainer</div>
                  <div className="text-sm text-muted-foreground">
                    Share your expertise, build your audience, and earn revenue
                  </div>
                </Label>
              </div>
            </RadioGroup>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Setting up..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
