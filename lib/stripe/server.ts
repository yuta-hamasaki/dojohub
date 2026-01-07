import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export { stripe }

// Create Stripe Connect Standard Account
export async function createConnectAccount(email: string, trainerId: string) {
  try {
    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        trainer_id: trainerId,
      },
      // Enhanced settings for risk mitigation
      settings: {
        payouts: {
          schedule: {
            interval: 'weekly',
           // 毎週何曜日に振り込むか指定（例: 月曜日）
            weekly_anchor: 'monday',
            // Delay payouts to allow for dispute resolution
            delay_days: 7,
          },
        },
      },
    })

    return account
  } catch (error) {
    console.error("[v0] Stripe Connect account creation error:", error)
    throw error
  }
}

// Create account link for onboarding
export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    })

    return accountLink
  } catch (error) {
    console.error("[v0] Stripe account link error:", error)
    throw error
  }
}

// Create Stripe product and price
export async function createStripeProduct(
  name: string,
  description: string,
  price: number,
  currency: string,
  interval: "month" | "year",
  connectedAccountId: string,
) {
  try {
    const product = await stripe.products.create(
      {
        name,
        description,
      },
      {
        stripeAccount: connectedAccountId,
      },
    )

    const priceObj = await stripe.prices.create(
      {
        product: product.id,
        unit_amount: Math.round(price * 100),
        currency,
        recurring: {
          interval,
        },
      },
      {
        stripeAccount: connectedAccountId,
      },
    )

    return { product, price: priceObj }
  } catch (error) {
    console.error("[v0] Stripe product creation error:", error)
    throw error
  }
}

// Create subscription with platform fee
export async function createSubscription(
  customerId: string,
  priceId: string,
  connectedAccountId: string,
  platformFeePercent = 7,
) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      application_fee_percent: platformFeePercent,
      transfer_data: {
        destination: connectedAccountId,
      },
    })

    return subscription
  } catch (error) {
    console.error("[v0] Stripe subscription creation error:", error)
    throw error
  }
}

export async function getAccountVerificationStatus(accountId: string) {
  try {
    const account = await stripe.accounts.retrieve(accountId)

    return {
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        past_due: account.requirements?.past_due || [],
        disabled_reason: account.requirements?.disabled_reason,
      },
    }
  } catch (error) {
    console.error("[v0] Account verification status error:", error)
    throw error
  }
}

export async function getRecentPayouts(accountId: string, limit = 10) {
  try {
    const payouts = await stripe.payouts.list(
      {
        limit,
      },
      {
        stripeAccount: accountId,
      },
    )

    return payouts.data
  } catch (error) {
    console.error("[v0] Payouts retrieval error:", error)
    throw error
  }
}

export async function getAccountDisputes(accountId: string) {
  try {
    const disputes = await stripe.disputes.list(
      {
        limit: 100,
      },
      {
        stripeAccount: accountId,
      },
    )

    return disputes.data
  } catch (error) {
    console.error("[v0] Disputes retrieval error:", error)
    throw error
  }
}