import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Intercept Supabase recovery/auth redirects with ?code= param
  // and route them to /auth/callback for proper session exchange
  const code = request.nextUrl.searchParams.get("code")
  if (code && !request.nextUrl.pathname.startsWith("/auth/callback")) {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = "/auth/callback"
    // Keep code param, clear others
    callbackUrl.search = `?code=${code}`
    return NextResponse.redirect(callbackUrl)
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Si no hay variables de entorno, simplemente continuar sin autenticación
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes: redirect to login if not authenticated
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // If user is logged in and tries to access login/register, redirect to dashboard
  // (but allow reset-password and callback since those are part of the recovery flow)
  if (user && (request.nextUrl.pathname.startsWith("/auth/login") || request.nextUrl.pathname.startsWith("/auth/register") || request.nextUrl.pathname.startsWith("/auth/sign-up"))
    && !request.nextUrl.pathname.startsWith("/auth/reset-password")
    && !request.nextUrl.pathname.startsWith("/auth/callback")) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
