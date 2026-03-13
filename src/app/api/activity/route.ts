import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getErrorMessage } from "@/lib/api/errors"

export async function GET(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit") || "20")
        const filterModule = searchParams.get("module")

        const supabase = createAdminClient()

        // Get user role and email
        const { data: sysUser } = await supabase
            .from("system_users")
            .select("role, email")
            .eq("auth_user_id", user.id)
            .single()

        const role = sysUser?.role || ""
        const userEmail = sysUser?.email || user.email || ""

        let query = supabase
            .from("activity_log")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit)

        if (filterModule) {
            query = query.eq("module", filterModule)
        }

        // Role-based filtering
        if (role === "cliente") {
            // Look up all client records matching this user's email (multi-company support)
            const lookupEmail = userEmail.toLowerCase().trim()
            const { data: clientRecords } = await supabase
                .from("clients")
                .select("id")
                .ilike("email", lookupEmail)

            const clientIds = (clientRecords || []).map(c => c.id)
            if (clientIds.length > 0) {
                // Show activities linked to any of their client IDs OR performed by them
                query = query.or(`client_id.in.(${clientIds.join(",")}),user_id.eq.${user.id}`)
            } else {
                // No client linked — only show their own activity
                query = query.eq("user_id", user.id)
            }
        } else if (role === "contador") {
            // Contadores see:
            // 1. Activities they performed (user_id = their auth id)
            // 2. Activities on clients assigned to them (via client_assignments)

            // First get the system_user id for this auth user
            const { data: sysUserRecord } = await supabase
                .from("system_users")
                .select("id")
                .eq("auth_user_id", user.id)
                .single()

            const systemUserId = sysUserRecord?.id

            const { data: assignments } = await supabase
                .from("client_assignments")
                .select("client_id")
                .eq("system_user_id", systemUserId)

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

        return NextResponse.json({ data, _debug: { role, userEmail, userId: user.id } })
    } catch (error: unknown) {
        console.error("Error fetching activity:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
