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

    // Get high-risk accounts
    const { data: riskAccounts } = await supabase
      .from("stripe_risk_monitoring")
      .select(
        `
        *,
        trainers!inner(full_name)
      `,
      )
      .gte("risk_score", 50)
      .order("risk_score", { ascending: false })
      .limit(10)

    const accounts =
      riskAccounts?.map((account: any) => ({
        id: account.trainer_id,
        name: account.trainers.full_name,
        riskLevel: account.risk_level,
        riskScore: account.risk_score,
        issues: `${account.failed_payouts} failed payouts, ${account.disputes} disputes`,
      })) || []

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error("Risk accounts error:", error)
    return NextResponse.json({ error: "Failed to fetch risk accounts" }, { status: 500 })
  }
}
