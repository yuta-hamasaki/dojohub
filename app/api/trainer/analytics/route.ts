import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

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

    // Get trainer profile
    const { data: trainer, error: trainerError } = await supabase
      .from("trainers")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (trainerError || !trainer) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 })
    }

    // Get subscription stats
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*, plan:subscription_plans(price, billing_period)")
      .eq("trainer_id", trainer.id)
      .eq("status", "active")

    // Calculate revenue
    const monthlyRevenue = (subscriptions || []).reduce((total, sub) => {
      const price = sub.plan?.price || 0
      const billingPeriod = sub.plan?.billing_period || "monthly"
      const monthlyPrice = billingPeriod === "yearly" ? price / 12 : price
      return total + monthlyPrice
    }, 0)

    const platformFee = monthlyRevenue * 0.7 // 7% platform fee
    const netRevenue = monthlyRevenue - platformFee

    // Get content stats
    const { data: contentStats } = await supabase
      .from("content")
      .select("id, type, view_count")
      .eq("trainer_id", trainer.id)

    const totalViews = (contentStats || []).reduce((total, content) => total + content.view_count, 0)
    const videoCount = (contentStats || []).filter((c) => c.type === "video").length
    const articleCount = (contentStats || []).filter((c) => c.type === "article").length

    // Get recent subscribers
    const { data: recentSubscribers } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        client:users!subscriptions_client_id_fkey(full_name, avatar_url),
        plan:subscription_plans(name)
      `,
      )
      .eq("trainer_id", trainer.id)
      .order("created_at", { ascending: false })
      .limit(5)

    // Mock revenue history (in real app, calculate from actual transactions)
    const revenueHistory = [
      { month: "Jan", revenue: netRevenue * 0.7 },
      { month: "Feb", revenue: netRevenue * 0.8 },
      { month: "Mar", revenue: netRevenue * 0.85 },
      { month: "Apr", revenue: netRevenue * 0.9 },
      { month: "May", revenue: netRevenue * 0.95 },
      { month: "Jun", revenue: netRevenue },
    ]

    return NextResponse.json({
      revenue: {
        gross: monthlyRevenue,
        platformFee,
        net: netRevenue,
      },
      subscribers: {
        total: trainer.total_subscribers,
        active: subscriptions?.length || 0,
      },
      content: {
        totalViews,
        videoCount,
        articleCount,
        total: (contentStats || []).length,
      },
      recentSubscribers: recentSubscribers || [],
      revenueHistory,
    })
  } catch (error: any) {
    console.error("[v0] Analytics error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch analytics" }, { status: 500 })
  }
}
