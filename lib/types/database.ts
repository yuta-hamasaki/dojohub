export type UserRole = "trainer" | "client"

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Trainer {
  id: string
  user_id: string
  bio: string | null
  specialties: string[]
  stripe_connect_id: string | null
  stripe_onboarded: boolean
  total_subscribers: number
  rating: number
  created_at: string
  updated_at: string
  user?: User
}

export interface SubscriptionPlan {
  id: string
  trainer_id: string
  name: string
  description: string | null
  price: number
  currency: string
  billing_period: "monthly" | "yearly"
  stripe_product_id: string | null
  stripe_price_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  trainer?: Trainer
}

export interface Content {
  id: string
  trainer_id: string
  type: "video" | "article"
  title: string
  description: string | null
  youtube_url: string | null
  article_body: string | null
  thumbnail_url: string | null
  category: string | null
  is_free: boolean
  view_count: number
  created_at: string
  updated_at: string
  trainer?: Trainer
}

export interface Subscription {
  id: string
  client_id: string
  trainer_id: string
  plan_id: string
  stripe_subscription_id: string | null
  status: "active" | "canceled" | "past_due" | "trialing"
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
  trainer?: Trainer
  plan?: SubscriptionPlan
}

export interface Comment {
  id: string
  content_id: string
  user_id: string
  comment_text: string
  created_at: string
  updated_at: string
  user?: User
}
