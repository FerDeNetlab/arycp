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

        const { data, error } = await supabase
            .from("system_users")
            .select("id, auth_user_id, full_name, role")
            .in("role", ["admin", "contador"])
            .eq("is_active", true)
            .order("full_name")

        if (error) {
            console.error("Error fetching contadores:", error)
            return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
        }

        return NextResponse.json({ data: data || [] })
    } catch (error: unknown) {
        console.error("Error:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
