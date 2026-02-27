import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getErrorMessage } from "@/lib/api/errors"

export async function GET() {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const supabase = createAdminClient()

        // Get all system users that are admin or contador (not clients)
        const { data, error } = await supabase
            .from("system_users")
            .select("auth_user_id, full_name, role")
            .in("role", ["admin", "contador"])
            .neq("auth_user_id", user.id)
            .order("full_name")

        if (error) throw error

        return NextResponse.json({
            contadores: (data || []).map((u) => ({
                id: u.auth_user_id,
                name: u.full_name,
                role: u.role,
            })),
        })
    } catch (error: unknown) {
        console.error("Error fetching contadores:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
