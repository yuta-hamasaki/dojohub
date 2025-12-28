"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Video, FileText, Edit, Trash2, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Content } from "@/lib/types/database"

const CATEGORIES = ["Technique", "Conditioning", "Nutrition", "Mental", "Strategy", "Fundamentals", "Advanced"]

export default function TrainerContentPage() {
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "video" | "article">("all")

  // Form state
  const [type, setType] = useState<"video" | "article">("video")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [articleBody, setArticleBody] = useState("")
  const [category, setCategory] = useState("")
  const [isFree, setIsFree] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      const response = await fetch("/api/content")
      const data = await response.json()
      setContent(data.content || [])
    } catch (error) {
      console.error("[v0] Error loading content:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContent = async () => {
    if (!title || !category) return
    if (type === "video" && !youtubeUrl) return
    if (type === "article" && !articleBody) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description,
          youtube_url: youtubeUrl,
          article_body: articleBody,
          category,
          is_free: isFree,
        }),
      })

      if (!response.ok) throw new Error("Failed to create content")

      await loadContent()
      resetForm()
      setDialogOpen(false)
    } catch (error: any) {
      alert(error.message || "Failed to create content")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateContent = async () => {
    if (!editingContent) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/content/${editingContent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          youtube_url: youtubeUrl,
          article_body: articleBody,
          category,
          is_free: isFree,
        }),
      })

      if (!response.ok) throw new Error("Failed to update content")

      await loadContent()
      resetForm()
      setDialogOpen(false)
    } catch (error: any) {
      alert(error.message || "Failed to update content")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return

    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete content")

      await loadContent()
    } catch (error: any) {
      alert(error.message || "Failed to delete content")
    }
  }

  const openEditDialog = (item: Content) => {
    setEditingContent(item)
    setType(item.type)
    setTitle(item.title)
    setDescription(item.description || "")
    setYoutubeUrl(item.youtube_url || "")
    setArticleBody(item.article_body || "")
    setCategory(item.category || "")
    setIsFree(item.is_free)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingContent(null)
    setType("video")
    setTitle("")
    setDescription("")
    setYoutubeUrl("")
    setArticleBody("")
    setCategory("")
    setIsFree(false)
  }

  const filteredContent = content.filter((item) => {
    if (activeTab === "all") return true
    return item.type === activeTab
  })

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Content Library</h1>
          <p className="text-muted-foreground mt-1">Manage your training videos and articles</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContent ? "Edit Content" : "Add New Content"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!editingContent && (
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Tabs value={type} onValueChange={(v) => setType(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="video">Video</TabsTrigger>
                      <TabsTrigger value="article">Article</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="content-title">Title</Label>
                <Input
                  id="content-title"
                  placeholder="e.g., The Perfect Jab Technique"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content-description">Description</Label>
                <Textarea
                  id="content-description"
                  placeholder="Brief overview of the content"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              {type === "video" && (
                <div className="space-y-2">
                  <Label htmlFor="youtube-url">YouTube URL</Label>
                  <Input
                    id="youtube-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Use unlisted or public YouTube videos</p>
                </div>
              )}
              {type === "article" && (
                <div className="space-y-2">
                  <Label htmlFor="article-body">Article Content</Label>
                  <Textarea
                    id="article-body"
                    placeholder="Write your article content here..."
                    value={articleBody}
                    onChange={(e) => setArticleBody(e.target.value)}
                    rows={8}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="content-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="content-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="content-free">Free Content</Label>
                  <p className="text-xs text-muted-foreground">Make this available to everyone</p>
                </div>
                <Switch id="content-free" checked={isFree} onCheckedChange={setIsFree} />
              </div>
            </div>
            <Button
              onClick={editingContent ? handleUpdateContent : handleCreateContent}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? "Saving..." : editingContent ? "Update Content" : "Add Content"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Content</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="article">Articles</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="text-center py-12">Loading content...</div>
      ) : filteredContent.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {activeTab === "video" ? (
              <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            ) : activeTab === "article" ? (
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            ) : (
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            )}
            <h3 className="text-lg font-semibold mb-2">No content yet</h3>
            <p className="text-muted-foreground mb-4">Start building your content library</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.type === "video" ? (
                      <Video className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-primary" />
                    )}
                    <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">{item.category}</Badge>
                  {item.is_free && <Badge variant="outline">Free</Badge>}
                </div>
                <CardDescription className="mt-2 line-clamp-2">{item.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Eye className="h-4 w-4" />
                  <span>{item.view_count} views</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(item)} className="flex-1">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteContent(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
