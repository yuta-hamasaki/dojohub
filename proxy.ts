import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { 
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Refresh session if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protect trainer routes (locale-aware)
  if (pathname.match(/^\/(en|ja)\/trainer/) && !user) {
    const locale = pathname.split("/")[1]
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }

  // Protect client dashboard (locale-aware)
  if (pathname.match(/^\/(en|ja)\/dashboard/) && !user) {
    const locale = pathname.split("/")[1]
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }

  // Protect admin routes (locale-aware)
  if (pathname.match(/^\/(en|ja)\/admin/) && !user) {
    const locale = pathname.split("/")[1]
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }

  // Protect checkout (locale-aware)
  if (pathname.match(/^\/(en|ja)\/checkout/) && !user) {
    const locale = pathname.split("/")[1]
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
