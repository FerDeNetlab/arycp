"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Client-side component that detects Supabase auth redirects
 * (recovery tokens in URL hash or query params) and routes appropriately.
 * 
 * Supabase recovery emails may redirect using:
 * 1. Hash fragments: site.com/#access_token=xxx&type=recovery (implicit flow)
 * 2. Query params: site.com/?code=xxx (PKCE flow)
 * 
 * This component handles both cases.
 */
export function AuthRedirectHandler() {
    const router = useRouter()

    useEffect(() => {
        // Check for hash fragment (implicit flow)
        const hash = window.location.hash
        if (hash && hash.includes("type=recovery")) {
            // Supabase client-js automatically picks up the hash tokens
            // We just need to redirect to the reset password page
            const supabase = createClient()

            // Let Supabase process the hash tokens first
            supabase.auth.onAuthStateChange((event, _session) => {
                if (event === "PASSWORD_RECOVERY") {
                    router.push("/auth/reset-password")
                }
            })
            return
        }

        // Check for code in query params (PKCE flow)
        const params = new URLSearchParams(window.location.search)
        const code = params.get("code")
        if (code) {
            router.push(`/auth/callback?code=${code}`)
        }
    }, [router])

    return null
}
