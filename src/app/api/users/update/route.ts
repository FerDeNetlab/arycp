import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request) {
    try {
        // 1. Verify auth
        const serverClient = await createClient()
        const { data: { user }, error: authError } = await serverClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        // 2. Verify admin role
        const adminClient = createAdminClient()
        const { data: currentUser } = await adminClient
            .from("system_users")
            .select("role")
            .eq("auth_user_id", user.id)
            .single()

        if (!currentUser || currentUser.role !== "admin") {
            return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
        }

        // 3. Get update data
        const body = await request.json()
        const { id, full_name, email, phone, role, is_active, module_permissions } = body

        if (!id || !full_name || !email) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
        }

        // 4. Update using admin client (bypasses RLS)
        const { error: updateError } = await adminClient
            .from("system_users")
            .update({
                full_name,
                email,
                phone: phone || null,
                role,
                is_active,
                module_permissions,
            })
            .eq("id", id)

        if (updateError) {
            console.error("Error updating user:", updateError)
            return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
