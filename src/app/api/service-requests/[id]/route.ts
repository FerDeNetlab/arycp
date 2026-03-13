import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserRole } from "@/lib/auth/get-user-role"
import { logActivity, createNotification } from "@/lib/activity"
import { getErrorMessage } from "@/lib/api/errors"

type RouteParams = { params: Promise<{ id: string }> }

// GET — Get a single service request by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const adminClient = createAdminClient()

        const { data, error } = await adminClient
            .from("service_requests")
            .select("*")
            .eq("id", id)
            .single()

        if (error || !data) {
            return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
        }

        return NextResponse.json({ data })
    } catch (error) {
        console.error("Error fetching service request:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

// PATCH — Update service request (status, assignment, notes)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const adminClient = createAdminClient()
        const userData = await getUserRole(user.id)

        // Only admin and contador can update requests
        if (userData.role === "cliente") {
            return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
        }

        const body = await request.json()
        const { status, assignedTo, assignedToName, adminNotes } = body

        // Build update object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: Record<string, any> = {}
        if (status) updates.status = status
        if (assignedTo !== undefined) {
            updates.assigned_to = assignedTo
            updates.assigned_to_name = assignedToName || null
        }
        if (adminNotes !== undefined) updates.admin_notes = adminNotes

        const { data: updated, error } = await adminClient
            .from("service_requests")
            .update(updates)
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        // Status labels for notifications
        const statusLabels: Record<string, string> = {
            pendiente: "Pendiente",
            en_proceso: "En Proceso",
            completada: "Completada",
            rechazada: "Rechazada",
        }

        // If status changed, notify the client who requested it
        if (status && updated.requested_by) {
            await createNotification({
                userId: updated.requested_by,
                fromUserId: user.id,
                fromUserName: userData.fullName,
                type: status === "completada" ? "completion" : status === "rechazada" ? "alert" : "info",
                title: `Solicitud ${statusLabels[status] || status}: ${updated.title}`,
                message: `Tu solicitud "${updated.title}" ha sido actualizada a: ${statusLabels[status] || status}`,
                module: updated.module,
                entityType: "service_request",
                entityId: id,
                clientId: updated.client_id,
                clientName: updated.client_name,
            })

            // Log activity
            await logActivity({
                userId: user.id,
                userName: userData.fullName,
                clientId: updated.client_id,
                clientName: updated.client_name,
                module: updated.module,
                action: "solicitud_actualizada",
                entityType: "service_request",
                entityId: id,
                description: `${userData.fullName} cambió estado de solicitud "${updated.title}" a ${statusLabels[status] || status}`,
            })
        }

        return NextResponse.json({ data: updated })
    } catch (error) {
        console.error("Error updating service request:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
