import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET — Returns sender info + list of ALL clients for the email compose dialog
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

        // Get ALL clients from the clients table (not just system users)
        const { data: clientsData } = await adminClient
            .from("clients")
            .select("id, business_name, email, contact_name")
            .order("business_name")

        // Build recipients list — use business_name as display, with contact_name if available
        const recipients = (clientsData || [])
            .filter(c => c.email) // Only include clients with email
            .map(c => ({
                id: c.id,
                name: c.contact_name
                    ? `${c.business_name} (${c.contact_name})`
                    : c.business_name,
                email: c.email,
            }))

        return NextResponse.json({
            sender: senderData ? {
                fullName: senderData.full_name,
                email: senderData.email,
                role: senderData.role,
            } : null,
            clients: recipients,
        })
    } catch (error) {
        console.error("Error loading email recipients:", error)
        return NextResponse.json({ error: "Error al cargar datos" }, { status: 500 })
    }
}
