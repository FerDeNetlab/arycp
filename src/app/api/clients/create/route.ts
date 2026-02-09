import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ROLES } from "@/lib/constants/roles"

export async function POST(request: NextRequest) {
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

        // 2. Verificar que el usuario sea ADMIN o CONTADOR
        const adminClient = createAdminClient()
        const { data: currentUserData, error: userError } = await adminClient
            .from("system_users")
            .select("role")
            .eq("auth_user_id", user.id)
            .single()

        if (userError || !currentUserData) {
            return NextResponse.json({ error: "Usuario no encontrado en el sistema" }, { status: 403 })
        }

        const allowedRoles = [ROLES.ADMIN, ROLES.CONTADOR]
        if (!allowedRoles.includes(currentUserData.role)) {
            return NextResponse.json({ error: "No tienes permisos para crear clientes" }, { status: 403 })
        }

        // 3. Obtener datos del body
        const body = await request.json()
        const { name, email, phone, has_accounting, has_fiscal, has_legal, has_labor } = body

        // 4. Validar datos requeridos
        if (!name || !email) {
            return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 })
        }

        // 5. Verificar que no exista un cliente con el mismo email
        const { data: existingClient } = await adminClient.from("clients").select("id").eq("email", email).single()

        if (existingClient) {
            return NextResponse.json({ error: "Ya existe un cliente con ese email" }, { status: 400 })
        }

        // 6. Crear cliente usando adminClient (bypass RLS)
        const { data: newClient, error: createError } = await adminClient
            .from("clients")
            .insert({
                name,
                email,
                phone: phone || null,
                status: "active",
                has_accounting: has_accounting || false,
                has_fiscal: has_fiscal || false,
                has_legal: has_legal || false,
                has_labor: has_labor || false,
            })
            .select()
            .single()

        if (createError) {
            console.error("Error creating client:", createError)
            return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 })
        }

        return NextResponse.json(
            {
                success: true,
                message: "Cliente creado exitosamente",
                client: newClient,
            },
            { status: 201 },
        )
    } catch (error) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}
