"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Video, FileText } from "lucide-react"
import { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/translations'

interface ContentItem {
  id: string
  type: "video" | "article"
  title: string
  description: string
  youtube_url: string | null
  article_body: string | null
  category: string
  view_count: number
  is_free: boolean
  trainer: {
    user: {
      full_name: string
    }
  }
}

export default function ContentPage() {
  const [content, setContent] = useState<ContentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const contentId = params.id as string
  const locale = params.locale as Locale

  useEffect(() => {
    loadContent()
  }, [contentId])

  const loadContent = async () => {
    try {
      const response = await fetch(`/api/content/${contentId}`)
      const data = await response.json()
      setContent(data.content)
    } catch (error) {
      console.error("[v0] Error loading content:", error)
    } finally {
      setLoading(false)
    }
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t(locale, "content.no_content_found")}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {content.type === "video" ? (
                    <Video className="h-5 w-5 text-primary" />
                  ) : (
                    <FileText className="h-5 w-5 text-primary" />
                  )}
                  <Badge variant="secondary">{content.category}</Badge>
                  {content.is_free && <Badge variant="outline">{t(locale, "content.free_badge")}</Badge>}
                </div>
                <CardTitle className="text-3xl mb-2">{content.title}</CardTitle>
                <p className="text-muted-foreground">By {content.trainer?.user?.full_name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Eye className="h-4 w-4" />
                  <span>{content.view_count} views</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {content.description && <p className="text-muted-foreground">{content.description}</p>}

            {content.type === "video" && content.youtube_url && (
              <div className="aspect-video">
                <iframe
                  src={getYouTubeEmbedUrl(content.youtube_url) || ""}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {content.type === "article" && content.article_body && (
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap">{content.article_body}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
