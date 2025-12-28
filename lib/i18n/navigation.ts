"use client"

import { usePathname } from "next/navigation"
import type { Locale } from "./config"

export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split("/")
  const potentialLocale = segments[1]
  return potentialLocale === "en" || potentialLocale === "ja" ? potentialLocale : "en"
}

export function localePath(path: string, locale?: Locale): string {
  // If no locale provided, use default
  if (!locale) return `/en${path}`
  return `/${locale}${path}`
}

export function useLocale(): Locale {
  const pathname = usePathname()
  return getLocaleFromPath(pathname)
}
