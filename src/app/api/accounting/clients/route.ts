import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserRole } from "@/lib/auth/get-user-role"
import { ROLES } from "@/lib/constants/roles"

export async function GET(request: NextRequest) {
    try {
        // 1. Verificar autenticación
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        // 2. Obtener rol del usuario
        const userData = await getUserRole(user.id)
        const adminClient = createAdminClient()

        // 3. Construir query según rol
        let query = adminClient.from("clients").select("*").eq("has_accounting", true).order("created_at", { ascending: false })

        // Si es cliente, solo ver su propio registro
        if (userData.role === ROLES.CLIENTE) {
            query = query.eq("email", userData.email)
        }
        // Admin y Contador ven todos los clientes con servicio de contabilidad

        const { data: clients, error: clientsError } = await query

        if (clientsError) {
            console.error("Error fetching accounting clients:", clientsError)
            return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 })
        }

        return NextResponse.json({ clients: clients || [] }, { status: 200 })
    } catch (error) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}
