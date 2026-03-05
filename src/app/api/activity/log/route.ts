import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logActivity } from "@/lib/activity"

export async function POST(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const body = await request.json()
        const { module, action, clientId, clientName, entityType, entityId, description } = body

        if (!module || !action || !description) {
            return NextResponse.json({ error: "module, action, y description son requeridos" }, { status: 400 })
        }

        // Get user name from system_users
        const { createAdminClient } = await import("@/lib/supabase/admin")
        const supabase = createAdminClient()
        const { data: sysUser } = await supabase
            .from("system_users")
            .select("full_name")
            .eq("auth_user_id", user.id)
            .single()

        await logActivity({
            userId: user.id,
            userName: sysUser?.full_name || user.email || "Usuario",
            clientId: clientId || undefined,
            clientName: clientName || undefined,
            module,
            action,
            entityType: entityType || undefined,
            entityId: entityId || undefined,
            description,
        })

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        console.error("Error logging activity:", error)
        const msg = error instanceof Error ? error.message : String(error)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
