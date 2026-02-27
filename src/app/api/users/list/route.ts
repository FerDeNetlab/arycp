import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ROLES } from "@/lib/constants/roles"
import { getErrorMessage } from "@/lib/api/errors"

export async function GET() {
    try {
        // 1. Verificar que el usuario actual esté autenticado
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        // 2. Verificar que el usuario actual sea ADMIN
        const adminClient = createAdminClient()
        const { data: currentUserData, error: userError } = await adminClient
            .from("system_users")
            .select("role")
            .eq("auth_user_id", user.id)
            .single()

        if (userError || !currentUserData || (currentUserData.role !== ROLES.ADMIN && currentUserData.role !== ROLES.CONTADOR)) {
            return NextResponse.json({ error: "No tienes permisos para ver usuarios" }, { status: 403 })
        }

        // 3. Obtener lista de usuarios usando adminClient (bypass RLS)
        const { data: users, error: usersError } = await adminClient
            .from("system_users")
            .select("*")
            .order("created_at", { ascending: false })

        if (usersError) {
            console.error("Error fetching users:", usersError)
            return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
        }

        return NextResponse.json({ users }, { status: 200 })
    } catch (error: unknown) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
