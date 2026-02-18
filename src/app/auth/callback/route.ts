import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/dashboard"

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Check if this is a recovery flow — user came from password reset email
            // After exchanging code, the session type indicates recovery
            const { data: { user } } = await supabase.auth.getUser()

            // If user has a recovery session (aud = "authenticated" after recovery),
            // check the session's AMR (Authentication Methods Reference)
            if (data?.session) {
                const amr = (data.session as any)?.amr
                const isRecovery = amr?.some?.((m: any) => m.method === "recovery")
                if (isRecovery) {
                    return NextResponse.redirect(`${origin}/auth/reset-password`)
                }
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Handle token_hash flow (older email templates)
    const tokenHash = searchParams.get("token_hash")
    const type = searchParams.get("type")

    if (tokenHash && type) {
        const supabase = await createClient()
        const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "recovery" | "signup" | "email",
        })
        if (!error) {
            if (type === "recovery") {
                return NextResponse.redirect(`${origin}/auth/reset-password`)
            }
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return to error page on failure
    return NextResponse.redirect(`${origin}/auth/error`)
}
