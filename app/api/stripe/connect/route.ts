import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { createConnectAccount, createAccountLink } from "@/lib/stripe/server"

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user details
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get trainer profile
    const { data: trainer, error: trainerError } = await supabase
      .from("trainers")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (trainerError || !trainer) {
      return NextResponse.json({ error: "Trainer profile not found" }, { status: 404 })
    }

    // Create Stripe Connect account if not exists
    let stripeAccountId = trainer.stripe_connect_id

    if (!stripeAccountId) {
      const account = await createConnectAccount(userData.email, trainer.id)
      stripeAccountId = account.id

      // Update trainer with Stripe account ID
      await supabase.from("trainers").update({ stripe_connect_id: stripeAccountId }).eq("id", trainer.id)
    }

    // Create account link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const accountLink = await createAccountLink(
      stripeAccountId,
      `${baseUrl}/trainer/onboarding`,
      `${baseUrl}/trainer/onboarding/complete`,
    )

    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    console.error("Connect account error:", error)
    return NextResponse.json({ error: error.message || "Failed to create Connect account" }, { status: 500 })
  }
}
