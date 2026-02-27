import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getErrorMessage } from "@/lib/api/errors"

export async function PATCH(request: Request) {
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

        // 3. Get update data
        const body = await request.json()
        const { id, name, email, phone, has_accounting, has_fiscal, has_legal, has_labor, has_invoicing } = body

        if (!id || !name || !email) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
        }

        // 4. Update using admin client (bypasses RLS)
        const { error: updateError } = await adminClient
            .from("clients")
            .update({
                name,
                email,
                phone: phone || null,
                has_accounting: has_accounting ?? false,
                has_fiscal: has_fiscal ?? false,
                has_legal: has_legal ?? false,
                has_labor: has_labor ?? false,
                has_invoicing: has_invoicing ?? false,
            })
            .eq("id", id)

        if (updateError) {
            console.error("Error updating client:", updateError)
            return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
