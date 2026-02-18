import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/dashboard"

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Check for recovery flow (type=recovery in hash is handled client-side,
    // but the email link may include token_hash and type as query params)
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
