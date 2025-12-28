import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

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

    const { data: trainer, error: trainerError } = await supabase
      .from("trainers")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (trainerError || !trainer) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 })
    }

    // Accept terms of service
    await supabase
      .from("trainers")
      .update({
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
      })
      .eq("id", trainer.id)

    // Log compliance check
    await supabase.from("compliance_checks").insert({
      trainer_id: trainer.id,
      check_type: "terms_acceptance",
      status: "passed",
      details: {
        accepted_at: new Date().toISOString(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Terms acceptance error:", error)
    return NextResponse.json({ error: error.message || "Failed to accept terms" }, { status: 500 })
  }
}
