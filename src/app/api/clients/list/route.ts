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

        // 2. Verificar rol del usuario
        const adminClient = createAdminClient()
        const { data: currentUserData, error: userError } = await adminClient
            .from("system_users")
            .select("role")
            .eq("auth_user_id", user.id)
            .single()

        if (userError || !currentUserData) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 403 })
        }

        // 3. Obtener clientes según el rol
        let query = adminClient.from("clients").select("*").order("created_at", { ascending: false })

        // Si es cliente, solo puede ver su propio registro (vinculado por email)
        if (currentUserData.role === ROLES.CLIENTE) {
            const { data: userData } = await adminClient
                .from("system_users")
                .select("email")
                .eq("auth_user_id", user.id)
                .single()

            if (userData?.email) {
                query = query.eq("email", userData.email)
            } else {
                return NextResponse.json({ clients: [] }, { status: 200 })
            }
        }
        // Admin y Contador pueden ver todos los clientes

        const { data: clients, error: clientsError } = await query

        if (clientsError) {
            console.error("Error fetching clients:", clientsError)
            return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 })
        }

        return NextResponse.json({ clients: clients || [] }, { status: 200 })
    } catch (error: unknown) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
