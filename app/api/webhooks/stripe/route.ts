import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: any

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error("[v0] Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = await getSupabaseServerClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

        await supabase.from("subscriptions").insert({
          client_id: session.metadata.client_id,
          trainer_id: session.metadata.trainer_id,
          plan_id: session.metadata.plan_id,
          stripe_subscription_id: subscription.id,
          status: "active",
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })

        await supabase.rpc("increment_subscriber_count", { trainer_id: session.metadata.trainer_id })

        await supabase.from("activity_logs").insert({
          trainer_id: session.metadata.trainer_id,
          activity_type: "subscription_created",
          description: "New subscription created",
          severity: "low",
          metadata: {
            subscription_id: subscription.id,
            amount: subscription.items.data[0].price.unit_amount,
          },
        })

        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object

        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)

        const { data: subData } = await supabase
          .from("subscriptions")
          .select("trainer_id")
          .eq("stripe_subscription_id", subscription.id)
          .single()

        if (subData) {
          await supabase.rpc("decrement_subscriber_count", { trainer_id: subData.trainer_id })
        }

        break
      }

      case "payout.paid": {
        const payout = event.data.object

        const { data: trainer } = await supabase
          .from("trainers")
          .select("id")
          .eq("stripe_connect_id", event.account)
          .single()

        if (trainer) {
          await supabase.from("payout_logs").insert({
            trainer_id: trainer.id,
            stripe_payout_id: payout.id,
            amount: payout.amount / 100,
            currency: payout.currency,
            status: "paid",
            metadata: {
              arrival_date: payout.arrival_date,
              method: payout.method,
            },
          })

          await supabase.from("trainers").update({ last_payout_at: new Date().toISOString() }).eq("id", trainer.id)
        }

        break
      }

      case "payout.failed": {
        const payout = event.data.object

        const { data: trainer } = await supabase
          .from("trainers")
          .select("id")
          .eq("stripe_connect_id", event.account)
          .single()

        if (trainer) {
          await supabase.from("payout_logs").insert({
            trainer_id: trainer.id,
            stripe_payout_id: payout.id,
            amount: payout.amount / 100,
            currency: payout.currency,
            status: "failed",
            metadata: {
              failure_code: payout.failure_code,
              failure_message: payout.failure_message,
            },
          })

          await supabase.from("activity_logs").insert({
            trainer_id: trainer.id,
            activity_type: "payout_failed",
            description: `Payout failed: ${payout.failure_message}`,
            severity: "high",
            metadata: {
              payout_id: payout.id,
              failure_code: payout.failure_code,
            },
          })
        }

        break
      }

      case "charge.dispute.created": {
        const dispute = event.data.object

        const { data: trainer } = await supabase
          .from("trainers")
          .select("id, suspicious_activity_count")
          .eq("stripe_connect_id", event.account)
          .single()

        if (trainer) {
          await supabase
            .from("trainers")
            .update({
              suspicious_activity_count: (trainer.suspicious_activity_count || 0) + 1,
              risk_level: (trainer.suspicious_activity_count || 0) + 1 > 2 ? "high" : "medium",
            })
            .eq("id", trainer.id)

          await supabase.from("activity_logs").insert({
            trainer_id: trainer.id,
            activity_type: "dispute_created",
            description: `Dispute created: ${dispute.reason}`,
            severity: "high",
            metadata: {
              dispute_id: dispute.id,
              amount: dispute.amount,
              reason: dispute.reason,
            },
          })
        }

        break
      }

      case "charge.dispute.closed": {
        const dispute = event.data.object

        const { data: trainer } = await supabase
          .from("trainers")
          .select("id")
          .eq("stripe_connect_id", event.account)
          .single()

        if (trainer) {
          await supabase.from("activity_logs").insert({
            trainer_id: trainer.id,
            activity_type: "dispute_closed",
            description: `Dispute closed: ${dispute.status}`,
            severity: dispute.status === "won" ? "low" : "medium",
            metadata: {
              dispute_id: dispute.id,
              status: dispute.status,
            },
          })
        }

        break
      }

      case "account.updated": {
        const account = event.data.object

        const { data: trainer } = await supabase
          .from("trainers")
          .select("id")
          .eq("stripe_connect_id", account.id)
          .single()

        if (trainer) {
          const hasIssues =
            account.requirements?.currently_due?.length > 0 || account.requirements?.past_due?.length > 0

          await supabase
            .from("trainers")
            .update({
              verification_status: account.details_submitted ? "verified" : "pending",
              risk_level: hasIssues ? "medium" : "low",
            })
            .eq("id", trainer.id)

          if (hasIssues) {
            await supabase.from("activity_logs").insert({
              trainer_id: trainer.id,
              activity_type: "verification_required",
              description: "Additional verification required",
              severity: "medium",
              metadata: {
                requirements: account.requirements,
              },
            })
          }
        }

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[v0] Webhook processing error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
