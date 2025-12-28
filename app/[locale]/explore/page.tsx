"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { localePath } from "@/lib/i18n/navigation"
import type { Locale } from "@/lib/i18n/config"

const SPECIALTIES = ["All", "MMA", "Boxing", "BJJ", "Muay Thai", "Wrestling", "Judo", "Kickboxing", "Fitness"]

interface Trainer {
  id: string
  bio: string
  specialties: string[]
  subscriber_count: number
  user: {
    full_name: string
    avatar_url: string
  }
  subscription_plans: Array<{
    id: string
    name: string
    price: number
    billing_period: string
  }>
}

export default function ExplorePage() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("All")
  const params = useParams()
  const locale = (params.locale as Locale) || "en"

  useEffect(() => {
    loadTrainers()
  }, [selectedSpecialty])

  const loadTrainers = async () => {
    try {
      const specialty = selectedSpecialty === "All" ? "" : selectedSpecialty
      const response = await fetch(`/api/trainers?specialty=${specialty}`)
      const data = await response.json()
      setTrainers(data.trainers || [])
    } catch (error) {
      console.error("[v0] Error loading trainers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTrainers = trainers.filter((trainer) =>
    trainer.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-secondary py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold mb-4">Explore Elite Trainers</h1>
          <p className="text-xl text-muted-foreground mb-8">Find the perfect coach for your combat sports journey</p>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trainers by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Trainers Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {loading ? (
            <div className="text-center py-12">Loading trainers...</div>
          ) : filteredTrainers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">No trainers found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrainers.map((trainer) => (
                <Card key={trainer.id} className="hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={trainer.user.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{trainer.user.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl truncate">{trainer.user.full_name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Users className="h-4 w-4" />
                          <span>{trainer.subscriber_count} subscribers</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {trainer.specialties?.slice(0, 3).map((specialty) => (
                        <Badge key={specialty} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    <CardDescription className="mt-3 line-clamp-2">{trainer.bio || "No bio available"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trainer.subscription_plans?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">Plans starting at:</p>
                        <p className="text-2xl font-bold">
                          ${Math.min(...trainer.subscription_plans.map((p) => p.price))}
                          <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </p>
                      </div>
                    )}
                    <Button className="w-full" asChild>
                      <Link href={localePath(`/trainers/${trainer.id}`, locale)}>View Profile</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

