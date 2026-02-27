import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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

        // Verify admin or contador role
        const adminClient = createAdminClient()
        const { data: userData, error: userError } = await adminClient
            .from("system_users")
            .select("role")
            .eq("auth_user_id", user.id)
            .single()

        if (userError || !userData || (userData.role !== ROLES.ADMIN && userData.role !== ROLES.CONTADOR)) {
            return NextResponse.json({ error: "No tienes permisos" }, { status: 403 })
        }

        const { data: messages, error: messagesError } = await adminClient
            .from("contact_messages")
            .select("*")
            .order("created_at", { ascending: false })

        if (messagesError) {
            console.error("Error fetching messages:", messagesError)
            return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 })
        }

        return NextResponse.json({ messages }, { status: 200 })
    } catch (error: unknown) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

// Mark message as read
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const body = await request.json()
        const { id, is_read } = body

        if (!id) {
            return NextResponse.json({ error: "ID requerido" }, { status: 400 })
        }

        const adminClient = createAdminClient()

        const { error: updateError } = await adminClient
            .from("contact_messages")
            .update({ is_read: is_read ?? true })
            .eq("id", id)

        if (updateError) {
            console.error("Error updating message:", updateError)
            return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
        }

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error: unknown) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
