"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { localePath } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/config"

const SPECIALTIES = [
  "MMA",
  "Boxing",
  "BJJ",
  "Muay Thai",
  "Wrestling",
  "Judo",
  "Kickboxing",
  "Fitness",
  "ProWrestling",
  "Bodybuilding",
  "Strength & Conditioning",
  "Others",
]

export default function CompleteProfilePage() {
  const [bio, setBio] = useState("")
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as Locale) || "en"
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    checkStripeStatus()
  }, [])

  const checkStripeStatus = async () => {
    try {
      const response = await fetch("/api/stripe/account-status")
      const data = await response.json()

      if (!data.onboarded) {
        router.push(localePath("/trainer/onboarding", locale))
        return
      }

      // Load existing profile
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: trainer } = await supabase.from("trainers").select("*").eq("user_id", user.id).single()

        if (trainer) {
          setBio(trainer.bio || "")
          setSelectedSpecialties(trainer.specialties || [])
        }
      }
    } catch (error) {
      console.error("[v0] Error checking status:", error)
    } finally {
      setChecking(false)
    }
  }

  const handleSpecialtyToggle = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSpecialties.length === 0) {
      alert("Please select at least one specialty")
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from("trainers")
        .update({
          bio,
          specialties: selectedSpecialties,
        })
        .eq("user_id", user.id)

      if (error) throw error

      router.push(localePath("/trainer/dashboard", locale))
    } catch (error: any) {
      console.error("[v0] Profile update error:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Trainer Profile</CardTitle>
          <CardDescription>Tell potential subscribers about your expertise and training style</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell your story... What makes you unique? What's your fighting background?"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">This will be displayed on your public trainer profile</p>
            </div>

            <div className="space-y-3">
              <Label>Specialties</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SPECIALTIES.map((specialty) => (
                  <div key={specialty} className="flex items-center space-x-2">
                    <Checkbox
                      id={specialty}
                      checked={selectedSpecialties.includes(specialty)}
                      onCheckedChange={() => handleSpecialtyToggle(specialty)}
                    />
                    <Label htmlFor={specialty} className="font-normal cursor-pointer">
                      {specialty}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Profile & Go to Dashboard"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
