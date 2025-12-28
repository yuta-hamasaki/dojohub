import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// Update content
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
    const { title, description, youtube_url, article_body, category, is_free } = body

    const { data: content, error } = await supabase
      .from("content")
      .update({ title, description, youtube_url, article_body, category, is_free })
      .eq("id", id)
      .eq("trainer_id", trainer.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error("[v0] Update content error:", error)
    return NextResponse.json({ error: error.message || "Failed to update content" }, { status: 500 })
  }
}

// Delete content
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

    const { error } = await supabase.from("content").delete().eq("id", id).eq("trainer_id", trainer.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Delete content error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete content" }, { status: 500 })
  }
}
