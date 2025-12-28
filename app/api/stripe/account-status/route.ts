import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAccountVerificationStatus, getAccountDisputes } from "@/lib/stripe/server"

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

    const { data: trainer, error: trainerError } = await supabase
      .from("trainers")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (trainerError || !trainer || !trainer.stripe_connect_id) {
      return NextResponse.json({ onboarded: false })
    }

    const verificationStatus = await getAccountVerificationStatus(trainer.stripe_connect_id)
    const onboarded = verificationStatus.charges_enabled && verificationStatus.payouts_enabled

    const disputes = await getAccountDisputes(trainer.stripe_connect_id)
    const hasActiveDisputes = disputes.some((d) => d.status === "needs_response" || d.status === "under_review")

    let riskLevel = "low"
    if (hasActiveDisputes) riskLevel = "high"
    else if (verificationStatus.requirements.past_due.length > 0) riskLevel = "medium"
    else if (disputes.length > 2) riskLevel = "medium"

    await supabase
      .from("trainers")
      .update({
        stripe_onboarded: onboarded,
        verification_status: verificationStatus.details_submitted ? "verified" : "pending",
        risk_level: riskLevel,
      })
      .eq("id", trainer.id)

    await supabase.from("compliance_checks").insert({
      trainer_id: trainer.id,
      check_type: "account_verification",
      status: onboarded ? "passed" : "pending",
      details: {
        verification_status: verificationStatus,
        disputes_count: disputes.length,
        risk_level: riskLevel,
      },
    })

    return NextResponse.json({
      onboarded,
      verification_status: verificationStatus,
      risk_level: riskLevel,
      has_active_disputes: hasActiveDisputes,
      disputes_count: disputes.length,
    })
  } catch (error: any) {
    console.error("[v0] Account status error:", error)
    return NextResponse.json({ error: error.message || "Failed to check account status" }, { status: 500 })
  }
}
