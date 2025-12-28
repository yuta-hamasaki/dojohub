import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { createStripeProduct } from "@/lib/stripe/server"

// Get trainer's subscription plans
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).single()

    if (!trainer) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 })
    }

    const { data: plans, error } = await supabase.from("subscription_plans").select("*").eq("trainer_id", trainer.id)

    if (error) throw error

    return NextResponse.json({ plans })
  } catch (error: any) {
    console.error("[v0] Get plans error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch plans" }, { status: 500 })
  }
}

// Create new subscription plan
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: trainer } = await supabase
      .from("trainers")
      .select("id, stripe_connect_id, stripe_onboarded")
      .eq("user_id", user.id)
      .single()

    if (!trainer || !trainer.stripe_onboarded) {
      return NextResponse.json({ error: "Please complete Stripe onboarding first" }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, price, billing_period } = body

    // Create Stripe product and price
    const { product, price: priceObj } = await createStripeProduct(
      name,
      description,
      price,
      "usd",
      billing_period === "monthly" ? "month" : "year",
      trainer.stripe_connect_id,
    )

    // Save to database
    const { data: plan, error } = await supabase
      .from("subscription_plans")
      .insert({
        trainer_id: trainer.id,
        name,
        description,
        price,
        billing_period,
        stripe_product_id: product.id,
        stripe_price_id: priceObj.id,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error("[v0] Create plan error:", error)
    return NextResponse.json({ error: error.message || "Failed to create plan" }, { status: 500 })
  }
}
