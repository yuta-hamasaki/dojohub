export const defaultLocale = "ja" as const
export const locales = ["en", "ja"] as const
export type Locale = (typeof locales)[number]

export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split("/")
  const locale = segments[1]
  return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale
}
