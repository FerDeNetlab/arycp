import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const supabase = createAdminClient()

        // Count active procedures (pendiente + en_proceso)
        const { count: activeProcedures } = await supabase
            .from("procedures")
            .select("*", { count: "exact", head: true })
            .in("status", ["pendiente", "en_proceso"])

        // Count pending procedures
        const { count: pendingProcedures } = await supabase
            .from("procedures")
            .select("*", { count: "exact", head: true })
            .eq("status", "pendiente")

        // Count pending fiscal obligations
        const { count: pendingFiscal } = await supabase
            .from("fiscal_obligations")
            .select("*", { count: "exact", head: true })
            .eq("status", "pendiente")

        // Count pending legal processes
        const { count: pendingLegal } = await supabase
            .from("legal_processes")
            .select("*", { count: "exact", head: true })
            .in("status", ["pendiente", "en_proceso"])

        // Total active items across all modules
        const totalActive = (activeProcedures || 0) + (pendingFiscal || 0) + (pendingLegal || 0)

        // Total pending (needing attention)
        const totalPending = (pendingProcedures || 0) + (pendingFiscal || 0)

        // Count unread notifications as alerts
        const { count: alerts } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false)

        // Upcoming deadlines - fiscal obligations with due dates in next 7 days
        const now = new Date()
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const { count: upcomingEvents } = await supabase
            .from("fiscal_obligations")
            .select("*", { count: "exact", head: true })
            .gte("due_date", now.toISOString().split("T")[0])
            .lte("due_date", nextWeek.toISOString().split("T")[0])

        return NextResponse.json({
            totalActive: totalActive || 0,
            totalPending: totalPending || 0,
            upcomingEvents: upcomingEvents || 0,
            alerts: alerts || 0,
        })
    } catch (error: any) {
        console.error("Error fetching dashboard stats:", error)
        return NextResponse.json({
            totalActive: 0,
            totalPending: 0,
            upcomingEvents: 0,
            alerts: 0,
        })
    }
}
