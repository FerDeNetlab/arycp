import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit") || "20")
        const module = searchParams.get("module")

        const supabase = createAdminClient()

        // Get user role and client info
        const { data: sysUser } = await supabase
            .from("system_users")
            .select("role, client_id")
            .eq("auth_user_id", user.id)
            .single()

        const role = sysUser?.role || ""
        const userClientId = sysUser?.client_id || null

        let query = supabase
            .from("activity_log")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit)

        if (module) {
            query = query.eq("module", module)
        }

        // Role-based filtering
        if (role === "cliente") {
            // Clients only see activity related to their own client record
            if (userClientId) {
                query = query.eq("client_id", userClientId)
            } else {
                // No client linked — show nothing
                return NextResponse.json({ data: [] })
            }
        } else if (role === "contador") {
            // Contadores see:
            // 1. Activities they performed (user_id = their auth id)
            // 2. Activities on clients assigned to them (via client_assignments)
            const { data: assignments } = await supabase
                .from("client_assignments")
                .select("client_id")
                .eq("user_id", user.id)

            const assignedClientIds = (assignments || []).map(a => a.client_id).filter(Boolean)

            if (assignedClientIds.length > 0) {
                // user_id matches OR client_id is one of their assigned clients
                query = query.or(`user_id.eq.${user.id},client_id.in.(${assignedClientIds.join(",")})`)
            } else {
                // No assigned clients — only show their own activity
                query = query.eq("user_id", user.id)
            }
        }
        // Admin: no filter, sees everything

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error("Error fetching activity:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
