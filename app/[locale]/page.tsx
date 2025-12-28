import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Video, Users } from "lucide-react"
import { t } from "@/lib/i18n/translations"
import type { Locale } from "@/lib/i18n/config"
import Image from "next/image"

export default async function HomePage({ params }: { params: { locale: Locale } }) {
  const { locale } = await params

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center">
        <Image
          src="/combat-sports-training-octagon.jpg"
          alt="Combat Sports Training"
          fill
          className="object-cover brightness-50"
          priority
        />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">{t(locale, "home.hero_title")}</h1>
          <p className="text-xl md:text-2xl mb-8 text-pretty">{t(locale, "home.hero_subtitle")}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild>
              <Link href={`/${locale}/explore`}>{t(locale, "home.cta_explore")}</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur" asChild>
              <Link href={`/${locale}/auth/signup`}>{t(locale, "home.cta_become_trainer")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2">
              <CardContent className="pt-6 text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">{t(locale, "home.feature_exclusive")}</h3>
                <p className="text-muted-foreground">{t(locale, "home.feature_exclusive_desc")}</p>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">{t(locale, "home.feature_expert")}</h3>
                <p className="text-muted-foreground">{t(locale, "home.feature_expert_desc")}</p>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">{t(locale, "home.feature_flexible")}</h3>
                <p className="text-muted-foreground">{t(locale, "home.feature_flexible_desc")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
