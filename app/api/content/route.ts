import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// Get trainer's content
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    const url = new URL(request.url)
    const type = url.searchParams.get("type")

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

    let query = supabase
      .from("content")
      .select("*")
      .eq("trainer_id", trainer.id)
      .order("created_at", { ascending: false })

    if (type) {
      query = query.eq("type", type)
    }

    const { data: content, error } = await query

    if (error) throw error

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error("[v0] Get content error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch content" }, { status: 500 })
  }
}

// Create new content
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

    const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user.id).single()

    if (!trainer) {
      return NextResponse.json({ error: "Trainer not found" }, { status: 404 })
    }

    const body = await request.json()
    const { type, title, description, youtube_url, article_body, category, is_free } = body

    const { data: content, error } = await supabase
      .from("content")
      .insert({
        trainer_id: trainer.id,
        type,
        title,
        description,
        youtube_url: type === "video" ? youtube_url : null,
        article_body: type === "article" ? article_body : null,
        category,
        is_free,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error("[v0] Create content error:", error)
    return NextResponse.json({ error: error.message || "Failed to create content" }, { status: 500 })
  }
}
