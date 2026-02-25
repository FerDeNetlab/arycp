import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

/**
 * Verifies user is authenticated and has admin role.
 * Returns { user, sysUser, supabase } or a NextResponse error.
 */
export async function requireAdmin() {
    const serverClient = await createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) {
        return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
    }

    const supabase = createAdminClient()
    const { data: sysUser } = await supabase
        .from("system_users")
        .select("role, full_name, auth_user_id")
        .eq("auth_user_id", user.id)
        .single()

    if (!sysUser || sysUser.role !== "admin") {
        return { error: NextResponse.json({ error: "Acceso restringido a administradores" }, { status: 403 }) }
    }

    return { user, sysUser, supabase }
}
