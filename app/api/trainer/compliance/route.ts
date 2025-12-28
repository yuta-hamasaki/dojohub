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

    const { data: trainer, error: trainerError } = await supabase
      .from("trainers")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (trainerError || !trainer) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 })
    }

    // Get recent compliance checks
    const { data: complianceChecks } = await supabase
      .from("compliance_checks")
      .select("*")
      .eq("trainer_id", trainer.id)
      .order("checked_at", { ascending: false })
      .limit(20)

    // Get recent activity logs
    const { data: activityLogs } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("trainer_id", trainer.id)
      .order("created_at", { ascending: false })
      .limit(50)

    // Get payout history
    const { data: payoutLogs } = await supabase
      .from("payout_logs")
      .select("*")
      .eq("trainer_id", trainer.id)
      .order("created_at", { ascending: false })
      .limit(20)

    // Calculate risk metrics
    const highSeverityCount = activityLogs?.filter((log) => log.severity === "high").length || 0
    const failedPayoutsCount = payoutLogs?.filter((log) => log.status === "failed").length || 0

    // console.log(  {trainer: {
    //     verification_status: trainer.verification_status,
    //     risk_level: trainer.risk_level,
    //     terms_accepted: trainer.terms_accepted,
    //     suspicious_activity_count: trainer.suspicious_activity_count,
    //     last_payout_at: trainer.last_payout_at,
    //   },
    //   compliance_checks: complianceChecks || [],
    //   activity_logs: activityLogs || [],
    //   payout_logs: payoutLogs || [],
    //   metrics: {
    //     high_severity_count: highSeverityCount,
    //     failed_payouts_count: failedPayoutsCount,
    //     total_payouts: payoutLogs?.length || 0,
    //   }})
    return NextResponse.json({
      trainer: {
        verification_status: trainer.verification_status,
        risk_level: trainer.risk_level,
        terms_accepted: trainer.terms_accepted,
        suspicious_activity_count: trainer.suspicious_activity_count,
        last_payout_at: trainer.last_payout_at,
      },
      compliance_checks: complianceChecks || [],
      activity_logs: activityLogs || [],
      payout_logs: payoutLogs || [],
      metrics: {
        high_severity_count: highSeverityCount,
        failed_payouts_count: failedPayoutsCount,
        total_payouts: payoutLogs?.length || 0,
      },
    })
  } catch (error: any) {
    console.error("[v0] Compliance data error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch compliance data" }, { status: 500 })
  }
}
