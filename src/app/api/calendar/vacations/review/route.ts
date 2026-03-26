import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserRole } from "@/lib/auth/get-user-role"

// PATCH — Approve or reject a vacation request (admin only)
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const userData = await getUserRole(user.id)
        if (userData.role !== "admin") {
            return NextResponse.json({ error: "Solo administradores pueden revisar solicitudes" }, { status: 403 })
        }

        const body = await request.json()
        const { id, action, review_notes } = body // action: 'approve' | 'reject'

        if (!id || !action) {
            return NextResponse.json({ error: "id y action requeridos" }, { status: 400 })
        }

        if (!["approve", "reject"].includes(action)) {
            return NextResponse.json({ error: "action debe ser 'approve' o 'reject'" }, { status: 400 })
        }

        const adminClient = createAdminClient()

        // Get the vacation request
        const { data: request_data } = await adminClient
            .from("vacation_requests")
            .select("*")
            .eq("id", id)
            .eq("status", "pending")
            .single()

        if (!request_data) {
            return NextResponse.json({ error: "Solicitud no encontrada o ya fue revisada" }, { status: 404 })
        }

        const newStatus = action === "approve" ? "approved" : "rejected"

        // Update the request
        const updateData: Record<string, unknown> = {
            status: newStatus,
            reviewed_by: user.id,
            reviewed_by_name: userData.fullName,
            reviewed_at: new Date().toISOString(),
            review_notes: review_notes || null,
        }

        // If approved, create a calendar event for the vacation
        let calendarEventId = null
        if (action === "approve") {
            const { data: event, error: eventError } = await adminClient
                .from("calendar_events")
                .insert({
                    title: `🏖️ Vacaciones — ${request_data.user_name}`,
                    description: request_data.reason ? `Motivo: ${request_data.reason}` : "Vacaciones aprobadas",
                    start_date: new Date(request_data.start_date + "T12:00:00").toISOString(),
                    end_date: new Date(request_data.end_date + "T12:00:00").toISOString(),
                    all_day: true,
                    event_type: "vacation",
                    color: "#ec4899",
                    visibility: "team",
                    created_by: request_data.user_id,
                    user_name: request_data.user_name,
                    vacation_request_id: id,
                })
                .select("id")
                .single()

            if (eventError) throw eventError
            calendarEventId = event.id
            updateData.calendar_event_id = calendarEventId
        }

        const { data: updated, error } = await adminClient
            .from("vacation_requests")
            .update(updateData)
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ data: updated })
    } catch (error) {
        console.error("Error reviewing vacation:", error)
        return NextResponse.json({ error: "Error al revisar solicitud" }, { status: 500 })
    }
}
