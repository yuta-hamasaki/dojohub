import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Users, Trophy, DollarSign } from "lucide-react"
import { redirect } from "next/navigation"
import { t } from "@/lib/i18n/translations"
import type { Locale } from "@/lib/i18n/config" 


export default async function RootPage() {
  redirect("/ja")
  const params = { locale: "ja" as Locale } // Default locale
  const locale = (params.locale as Locale) || "en"

  function HomePage() {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/combat-sports-training-octagon.jpg')",
              filter: "brightness(0.4)",
            }}
          />
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 text-balance">
              {t(locale, "home.hero_title")}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 text-pretty">
              {t(locale, "home.hero_subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/explore">{t(locale, "home.cta_explore")}</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 backdrop-blur" asChild>
                <Link href="/auth/signup">{t(locale, "home.cta_become_trainer")}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Why Choose Our Platform</h2>
              <p className="text-xl text-muted-foreground">The ultimate destination for combat sports training</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-2 hover:border-primary transition-colors">
                <CardContent className="pt-6">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Elite Trainers</h3>
                  <p className="text-muted-foreground">Learn from world champions and professional fighters</p>
                </CardContent>
              </Card>
              <Card className="border-2 hover:border-primary transition-colors">
                <CardContent className="pt-6">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Play className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Exclusive Content</h3>
                  <p className="text-muted-foreground">Access premium techniques, drills, and training programs</p>
                </CardContent>
              </Card>
              <Card className="border-2 hover:border-primary transition-colors">
                <CardContent className="pt-6">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Community</h3>
                  <p className="text-muted-foreground">Connect with fellow martial artists and train together</p>
                </CardContent>
              </Card>
              <Card className="border-2 hover:border-primary transition-colors">
                <CardContent className="pt-6">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Flexible Plans</h3>
                  <p className="text-muted-foreground">Subscribe to multiple trainers at affordable rates</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-secondary text-secondary-foreground">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Level Up Your Training?</h2>
            <p className="text-xl mb-8 opacity-90">Join thousands of athletes training with world-class instructors</p>
            <Button size="lg" variant="default" className="text-lg px-8" asChild>
              <Link href="/explore">Start Training Today</Link>
            </Button>
          </div>
        </section>
      </div>
    )
  }
}
