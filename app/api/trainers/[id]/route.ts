import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    // Get trainer with all details
    const { data: trainer, error: trainerError } = await supabase
      .from("trainers")
      .select(
        `
        *,
        user:users!trainers_user_id_fkey(full_name, avatar_url, email),
        subscription_plans!subscription_plans_trainer_id_fkey(*)
      `,
      )
      .eq("id", id)
      .single()

    if (trainerError) throw trainerError

    // Get trainer's content (only free content if not subscribed)
    const { data: content } = await supabase
      .from("content")
      .select("*")
      .eq("trainer_id", id)
      .order("created_at", { ascending: false })

    // Check if current user is subscribed
    let isSubscribed = false
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("client_id", user.id)
        .eq("trainer_id", id)
        .eq("status", "active")
        .single()

      isSubscribed = !!subscription
    }

    return NextResponse.json({
      trainer,
      content: content || [],
      isSubscribed,
    })
  } catch (error: any) {
    console.error("[v0] Get trainer error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch trainer" }, { status: 500 })
  }
}
