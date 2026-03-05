import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getErrorMessage } from "@/lib/api/errors"

// GET — List available users for chat (admin + contador only, exclude self and clients)
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const adminClient = createAdminClient()

        // Get all internal users (admin + contador)
        const { data: users, error } = await adminClient
            .from("system_users")
            .select("auth_user_id, full_name, role, email")
            .in("role", ["admin", "contador"])
            .neq("auth_user_id", user.id)
            .order("full_name")

        if (error) throw error

        const result = (users || []).map(u => ({
            id: u.auth_user_id,
            name: u.full_name || u.email || "Usuario",
            role: u.role,
            initials: (u.full_name || "U").split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase(),
        }))

        return NextResponse.json({ data: result })
    } catch (error: unknown) {
        console.error("Error fetching chat users:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
