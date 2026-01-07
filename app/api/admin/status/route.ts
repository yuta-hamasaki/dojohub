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

    // Get platform stats
    const [trainersResult, clientsResult, subscriptionsResult, contentResult, revenueResult] = await Promise.all([
      supabase.from("users").select("id", { count: "exact" }).eq("role", "trainer"),
      supabase.from("users").select("id", { count: "exact" }).eq("role", "client"),
      supabase.from("subscriptions").select("id", { count: "exact" }).eq("status", "active"),
      supabase.from("content").select("id", { count: "exact" }),
      supabase.from("subscriptions").select("amount").eq("status", "active"),
    ])

    // Calculate total revenue and platform s
    const totalRevenue = revenueResult.data?.reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0
    const platformFees = totalRevenue * 0.07 // Assuming 7% platform fee

    // Get monthly revenue data for chart (mock data for now)
    const monthlyRevenue = [
      { month: "Jan", revenue: 12000 },
      { month: "Feb", revenue: 15000 },
      { month: "Mar", revenue: 18000 },
      { month: "Apr", revenue: 22000 },
      { month: "May", revenue: 28000 },
      { month: "Jun", revenue: 35000 },
    ]

    // Get user growth data (mock data for now)
    const userGrowth = [
      { month: "Jan", users: 50 },
      { month: "Feb", users: 75 },
      { month: "Mar", users: 120 },
      { month: "Apr", users: 180 },
      { month: "May", users: 250 },
      { month: "Jun", users: 340 },
    ]

    return NextResponse.json({
      stats: {
        totalRevenue,
        platformFees,
        totalTrainers: trainersResult.count || 0,
        totalClients: clientsResult.count || 0,
        activeSubscriptions: subscriptionsResult.count || 0,
        totalContent: contentResult.count || 0,
      },
      charts: {
        monthlyRevenue,
        userGrowth,
      },
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 })
  }
}
