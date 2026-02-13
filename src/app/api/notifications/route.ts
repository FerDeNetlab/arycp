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
        const unreadOnly = searchParams.get("unread") === "true"

        const supabase = createAdminClient()

        let query = supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(limit)

        if (unreadOnly) {
            query = query.eq("is_read", false)
        }

        const { data, error } = await query

        if (error) throw error

        // Also get unread count
        const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false)

        return NextResponse.json({ data, unreadCount: count || 0 })
    } catch (error: any) {
        console.error("Error fetching notifications:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const body = await request.json()
        const { notificationId, markAllRead } = body

        const supabase = createAdminClient()

        if (markAllRead) {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", user.id)
                .eq("is_read", false)

            if (error) throw error
        } else if (notificationId) {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", notificationId)
                .eq("user_id", user.id)

            if (error) throw error
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Error updating notifications:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
