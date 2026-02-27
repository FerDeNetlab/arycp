import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserRole } from "@/lib/auth/get-user-role"
import { ROLES } from "@/lib/constants/roles"
import { getErrorMessage } from "@/lib/api/errors"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params

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

        // Obtener cliente por ID
        const { data: client, error: clientError } = await adminClient
            .from("clients")
            .select("*")
            .eq("id", id)
            .single()

        if (clientError || !client) {
            return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
        }

        // Verificar permisos: Cliente solo puede ver su propio registro
        if (userData.role === ROLES.CLIENTE && client.email !== userData.email) {
            return NextResponse.json({ error: "No tienes permiso para ver este cliente" }, { status: 403 })
        }

        return NextResponse.json({ client }, { status: 200 })
    } catch (error: unknown) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
