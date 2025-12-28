import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// Update subscription plan
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    const body = await request.json()
    const { name, description, is_active } = body

    // Update plan (price cannot be changed, only name/description/active status)
    const { data: plan, error } = await supabase
      .from("subscription_plans")
      .update({ name, description, is_active })
      .eq("id", id)
      .eq("trainer_id", trainer.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error("[v0] Update plan error:", error)
    return NextResponse.json({ error: error.message || "Failed to update plan" }, { status: 500 })
  }
}

// Delete subscription plan
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Check if plan has active subscriptions
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("plan_id", id)
      .eq("status", "active")

    if (subscriptions && subscriptions.length > 0) {
      return NextResponse.json({ error: "Cannot delete plan with active subscriptions" }, { status: 400 })
    }

    // Delete plan
    const { error } = await supabase.from("subscription_plans").delete().eq("id", id).eq("trainer_id", trainer.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Delete plan error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete plan" }, { status: 500 })
  }
}
