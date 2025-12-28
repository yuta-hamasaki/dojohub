import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/server"

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

    const { planId } = await request.json()

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select(
        `
        *,
        trainer:trainers!subscription_plans_trainer_id_fkey(stripe_connect_id)
      `,
      )
      .eq("id", planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    if (!plan.trainer?.stripe_connect_id) {
      return NextResponse.json({ error: "Trainer not properly configured" }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: userData } = await supabase.from("users").select("email").eq("id", user.id).single()

    let customerId: string | undefined

    // Search for existing customer
    const customers = await stripe.customers.list({
      email: userData?.email,
      limit: 1,
    })

    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: userData?.email || "",
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripe_price_id!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/trainers/${plan.trainer_id}?subscription=canceled`,
      subscription_data: {
        application_fee_percent: 7,
        transfer_data: {
          destination: plan.trainer.stripe_connect_id,
        },
        metadata: {
          plan_id: planId,
          trainer_id: plan.trainer_id,
          client_id: user.id,
        },
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error("[v0] Checkout error:", error)
    return NextResponse.json({ error: error.message || "Failed to create checkout" }, { status: 500 })
  }
}
