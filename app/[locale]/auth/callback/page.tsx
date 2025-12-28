"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { localePath } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/config"

export default function AuthCallbackPage() {
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as Locale) || "en"
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError
        if (!session) throw new Error("No session found")

        // Check if user exists in database
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single()

          console.log("User data:", userData)
          console.log("Debug - Session User ID:", session.user.id)
console.log("Debug - UserData:", userData)
console.log("Debug - UserError:", userError)

        // If user doesn't exist, create profile
        if (userError && userError.code === "PGRST116") {
          // User not found, create new user profile
          const { error: createError } = await supabase.from("users").insert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata.full_name || session.user.user_metadata.name,
            avatar_url: session.user.user_metadata.avatar_url,
            role: "client", // Default to client
          })

          if (createError) throw createError

          // Redirect to role selection page with locale
          router.push(localePath("/auth/setup-role", locale))
        } else if (userData) {
          if (userData.role === "trainer") {
            router.push(localePath("/trainer/dashboard", locale))
          } else {
            router.push(localePath("/dashboard", locale))
          }
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        // Redirect to login page with locale
        router.push(localePath("/auth/login", locale))
      }
    }

    handleCallback()
  }, [router, supabase, locale])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
