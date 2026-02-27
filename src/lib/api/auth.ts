import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type AuthResult =
    | { user: { id: string }; sysUser: { role: string; full_name: string; email: string; auth_user_id: string }; supabase: ReturnType<typeof createAdminClient> }
    | { error: NextResponse }

/**
 * Verifies user is authenticated and retrieves system user data.
 * Returns the authenticated user, system user record, and admin supabase client,
 * or a NextResponse error that can be returned directly from the route handler.
 */
export async function requireAuth(): Promise<AuthResult> {
    const serverClient = await createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) {
        return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
    }

    const supabase = createAdminClient()
    const { data: sysUser } = await supabase
        .from("system_users")
        .select("role, full_name, email, auth_user_id")
        .eq("auth_user_id", user.id)
        .single()

    if (!sysUser) {
        return { error: NextResponse.json({ error: "Usuario no encontrado en el sistema" }, { status: 403 }) }
    }

    return { user, sysUser, supabase }
}

/**
 * Verifies user is authenticated and has one of the specified roles.
 * Convenience wrapper around requireAuth.
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthResult> {
    const result = await requireAuth()
    if ("error" in result) return result

    if (!allowedRoles.includes(result.sysUser.role)) {
        return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) }
    }

    return result
}
