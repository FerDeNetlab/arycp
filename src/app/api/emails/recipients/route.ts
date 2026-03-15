import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET — Returns sender info + list of clients for the email compose dialog
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const adminClient = createAdminClient()

        // Get current user info (sender)
        const { data: senderData } = await adminClient
            .from("system_users")
            .select("full_name, email, role")
            .eq("auth_user_id", user.id)
            .single()

        // Get clients list
        const { data: clientsData } = await adminClient
            .from("system_users")
            .select("id, full_name, email")
            .eq("role", "cliente")
            .order("full_name")

        return NextResponse.json({
            sender: senderData ? {
                fullName: senderData.full_name,
                email: senderData.email,
                role: senderData.role,
            } : null,
            clients: (clientsData || []).map(c => ({
                id: c.id,
                name: c.full_name,
                email: c.email,
            })),
        })
    } catch (error) {
        console.error("Error loading email recipients:", error)
        return NextResponse.json({ error: "Error al cargar datos" }, { status: 500 })
    }
}
