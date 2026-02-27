import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"

export async function POST(_request: NextRequest) {
    const supabase = await createClient()

    // Cerrar sesión en Supabase
    await supabase.auth.signOut()

    // Redirigir al login
    return redirect("/auth/login")
}
