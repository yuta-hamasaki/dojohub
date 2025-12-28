import type React from "react"
import { Inter } from "next/font/google"
import { locales, type Locale } from "@/lib/i18n/config"
import { NavHeader } from "@/components/nav-header"
import { notFound } from "next/navigation"
//@ts-ignore
import "@/app/globals.css"

const inter = Inter({ subsets: ["latin"] })

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
params: Promise<{ locale: Locale }>
}) {

    // paramsを直接使わず、awaitで取得
  const { locale } = await params


  if (!locales.includes(locale as any)) {
    notFound()
  }
  return (
    <html lang={locale}suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <NavHeader locale={locale} />
        {children}
      </body>
    </html>
  )
}
