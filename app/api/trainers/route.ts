import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const url = new URL(request.url)
    const specialty = url.searchParams.get("specialty")
    const search = url.searchParams.get("search")

    let query = supabase
      .from("trainers")
      .select(
        `
        *,
        user:users!trainers_user_id_fkey(full_name, avatar_url, email),
        subscription_plans(id, name, price, billing_period, is_active)
      `,
      )
      .eq("stripe_onboarded", true)
      .order("total_subscribers", { ascending: false })

    if (specialty) {
      query = query.contains("specialties", [specialty])
    }

    const { data: trainers, error } = await query

    if (error) throw error

    // Filter by search term if provided
    let filteredTrainers = trainers || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredTrainers = filteredTrainers.filter(
        (trainer) =>
          trainer.user?.full_name?.toLowerCase().includes(searchLower) ||
          trainer.bio?.toLowerCase().includes(searchLower) ||
          trainer.specialties?.some((s: string) => s.toLowerCase().includes(searchLower)),
      )
    }

    return NextResponse.json({ trainers: filteredTrainers })
  } catch (error: any) {
    console.error("[v0] Get trainers error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch trainers" }, { status: 500 })
  }
}
