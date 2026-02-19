import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: Request) {
    try {
        // 1. Verify auth
        const serverClient = await createClient()
        const { data: { user }, error: authError } = await serverClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        // 2. Verify role (admin or contador)
        const adminClient = createAdminClient()
        const { data: currentUser } = await adminClient
            .from("system_users")
            .select("role")
            .eq("auth_user_id", user.id)
            .single()

        if (!currentUser || !["admin", "contador"].includes(currentUser.role)) {
            return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
        }

        // 3. Get data
        const body = await request.json()
        const { client_id, user_ids } = body

        if (!client_id) {
            return NextResponse.json({ error: "client_id requerido" }, { status: 400 })
        }

        // 4. Delete existing assignments
        const { error: deleteError } = await adminClient
            .from("client_assignments")
            .delete()
            .eq("client_id", client_id)

        if (deleteError) {
            console.error("Error deleting assignments:", deleteError)
            return NextResponse.json({ error: "Error al eliminar asignaciones" }, { status: 500 })
        }

        // 5. Insert new assignments
        if (user_ids && user_ids.length > 0) {
            const assignments = user_ids.map((userId: string) => ({
                client_id,
                system_user_id: userId,
                assigned_by: user.id,
            }))

            const { error: insertError } = await adminClient
                .from("client_assignments")
                .insert(assignments)

            if (insertError) {
                console.error("Error inserting assignments:", insertError)
                return NextResponse.json({ error: "Error al crear asignaciones" }, { status: 500 })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
