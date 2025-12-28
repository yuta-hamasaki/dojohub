"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, LayoutDashboard } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { t } from "@/lib/i18n/translations"
import type { Locale } from "@/lib/i18n/config"

export function NavHeader({ locale = "en" }: { locale?: Locale }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseBrowserClient()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const { data } = await supabase.from("users").select("role").eq("id", user.id).single()
      setUserRole(data?.role || null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push(`/${locale}`)
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="text-xl font-bold">
          FightTrainers
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href={`/${locale}/explore`} className="text-sm font-medium hover:text-primary transition-colors">
            {t(locale, "nav.explore")}
          </Link>
          {userRole === "trainer" && (
            <>
              <Link
                href={`/${locale}/trainer/dashboard`}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {t(locale, "nav.trainer_dashboard")}
              </Link>
              <Link
                href={`/${locale}/trainer/content`}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {t(locale, "nav.content")}
              </Link>
              <Link
                href={`/${locale}/trainer/plans`}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {t(locale, "nav.plans")}
              </Link>
              <Link
                href={`/${locale}/trainer/compliance`}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {t(locale, "nav.compliance")}
              </Link>
            </>
          )}
          {userRole === "admin" && (
            <Link
              href={`/${locale}/admin/dashboard`}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {t(locale, "nav.admin_dashboard")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{user.email?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}${userRole === "trainer" ? "/trainer/dashboard" : "/dashboard"}`}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t(locale, "nav.dashboard")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t(locale, "nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href={`/${locale}/auth/login`}>{t(locale, "nav.login")}</Link>
              </Button>
              <Button asChild>
                <Link href={`/${locale}/auth/signup`}>{t(locale, "nav.signup")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
