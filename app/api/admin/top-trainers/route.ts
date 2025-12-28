import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("is_admin").eq("id", user.id).single()
    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get top trainers by revenue
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select(
        `
        amount,
        subscription_plans!inner(trainer_id),
        trainers!inner(full_name, avatar_url)
      `,
      )
      .eq("status", "active")

    // Aggregate revenue by trainer (mock calculation)
    const trainerRevenue = new Map()
    subscriptions?.forEach((sub: any) => {
      const trainerId = sub.subscription_plans.trainer_id
      const trainerName = sub.trainers.full_name
      const current = trainerRevenue.get(trainerId) || { name: trainerName, revenue: 0, subscribers: 0 }
      trainerRevenue.set(trainerId, {
        name: trainerName,
        revenue: current.revenue + (sub.amount || 0),
        subscribers: current.subscribers + 1,
      })
    })

    const topTrainers = Array.from(trainerRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return NextResponse.json({ topTrainers })
  } catch (error) {
    console.error("Top trainers error:", error)
    return NextResponse.json({ error: "Failed to fetch top trainers" }, { status: 500 })
  }
}
