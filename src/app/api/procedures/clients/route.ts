import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserRole } from "@/lib/auth/get-user-role"
import { ROLES } from "@/lib/constants/roles"
import { getErrorMessage } from "@/lib/api/errors"

export async function GET() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const userData = await getUserRole(user.id)
        const adminClient = createAdminClient()

        // Para procedures (trámites), mostramos todos los clientes
        let query = adminClient.from("clients").select("*").order("created_at", { ascending: false })

        if (userData.role === ROLES.CLIENTE) {
            query = query.eq("email", userData.email)
        }

        const { data: clients, error: clientsError } = await query

        if (clientsError) {
            console.error("Error fetching procedure clients:", clientsError)
            return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 })
        }

        return NextResponse.json({ clients: clients || [] }, { status: 200 })
    } catch (error: unknown) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
