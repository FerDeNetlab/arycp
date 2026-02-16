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

        // Fetch activity log
        let activityQuery = supabase
            .from("activity_log")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit)

        if (module) {
            activityQuery = activityQuery.eq("module", module)
        }

        // Fetch user's notifications (unread + recent read ones)
        let notifQuery = supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(limit)

        if (module) {
            notifQuery = notifQuery.eq("module", module)
        }

        const [activityResult, notifResult] = await Promise.all([
            activityQuery,
            notifQuery,
        ])

        if (activityResult.error) throw activityResult.error

        const activities = (activityResult.data || []).map((a: any) => ({
            ...a,
            isNotification: false,
        }))

        const notifications = (notifResult.data || []).map((n: any) => ({
            id: `notif-${n.id}`,
            user_id: n.from_user_id || n.user_id,
            user_name: n.from_user_name || "",
            module: n.module || "system",
            action: n.type || "alert",
            entity_type: n.entity_type,
            entity_id: n.entity_id,
            description: n.message || n.title,
            created_at: n.created_at,
            isNotification: true,
            notifTitle: n.title,
            isRead: n.is_read,
        }))

        // Merge and sort by date, avoiding duplicates (same entity + similar time)
        const merged = [...activities]

        for (const notif of notifications) {
            // Check if there's an activity with same entity that's essentially the same event
            const isDuplicate = activities.some((a: any) =>
                a.entity_id && notif.entity_id &&
                a.entity_id === notif.entity_id &&
                a.action === "assigned" &&
                Math.abs(new Date(a.created_at).getTime() - new Date(notif.created_at).getTime()) < 60000
            )
            if (!isDuplicate) {
                merged.push(notif)
            }
        }

        // Sort merged items by date
        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        return NextResponse.json({ data: merged.slice(0, limit) })
    } catch (error: any) {
        console.error("Error fetching activity:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
