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

    // Get recent activities from activity_logs table
    const { data: activities } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    // Mock data if no logs exist
    const mockActivities = activities || [
      {
        id: "1",
        type: "new_trainer",
        description: "John Smith",
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "2",
        type: "new_subscription",
        description: "Premium Plan - Mike Tyson",
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: "3",
        type: "content_published",
        description: "Advanced Boxing Techniques",
        created_at: new Date(Date.now() - 10800000).toISOString(),
      },
      {
        id: "4",
        type: "payout",
        description: "$1,250.00 to Anderson Silva",
        created_at: new Date(Date.now() - 14400000).toISOString(),
      },
    ]

    return NextResponse.json({ activities: mockActivities })
  } catch (error) {
    console.error("Activities error:", error)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}
