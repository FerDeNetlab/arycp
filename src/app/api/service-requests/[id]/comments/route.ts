import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserRole } from "@/lib/auth/get-user-role"
import { createNotification } from "@/lib/activity"
import { getErrorMessage } from "@/lib/api/errors"

type RouteParams = { params: Promise<{ id: string }> }

// GET — List comments for a service request
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const adminClient = createAdminClient()
        const { data, error } = await adminClient
            .from("request_comments")
            .select("*")
            .eq("request_id", id)
            .order("created_at", { ascending: true })

        if (error) throw error
        return NextResponse.json({ data: data || [] })
    } catch (error) {
        console.error("Error fetching comments:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

// POST — Add a comment to a service request
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const adminClient = createAdminClient()
        const userData = await getUserRole(user.id)

        const body = await request.json()
        const { message, attachments } = body

        if (!message?.trim()) {
            return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 })
        }

        const { data: comment, error } = await adminClient
            .from("request_comments")
            .insert({
                request_id: id,
                user_id: user.id,
                user_name: userData.fullName,
                user_role: userData.role,
                message: message.trim(),
                attachments: attachments || [],
            })
            .select()
            .single()

        if (error) throw error

        // Get the request to notify the other party
        const { data: serviceRequest } = await adminClient
            .from("service_requests")
            .select("requested_by, requested_by_name, title, module, client_id, client_name, assigned_to")
            .eq("id", id)
            .single()

        if (serviceRequest) {
            // If client commented → notify assigned contadora + admins
            // If contadora commented → notify the client
            if (userData.role === "cliente") {
                // Notify assigned contadora
                if (serviceRequest.assigned_to) {
                    await createNotification({
                        userId: serviceRequest.assigned_to,
                        fromUserId: user.id,
                        fromUserName: userData.fullName,
                        type: "info",
                        title: `Nuevo comentario en: ${serviceRequest.title}`,
                        message: `${userData.fullName} comentó en la solicitud "${serviceRequest.title}"`,
                        module: serviceRequest.module,
                        entityType: "service_request",
                        entityId: id,
                        clientId: serviceRequest.client_id,
                        clientName: serviceRequest.client_name,
                    })
                }
                // Notify admins
                const { data: admins } = await adminClient
                    .from("system_users")
                    .select("auth_user_id")
                    .eq("role", "admin")

                for (const admin of admins || []) {
                    await createNotification({
                        userId: admin.auth_user_id,
                        fromUserId: user.id,
                        fromUserName: userData.fullName,
                        type: "info",
                        title: `Nuevo comentario en: ${serviceRequest.title}`,
                        message: `${userData.fullName} comentó en la solicitud "${serviceRequest.title}"`,
                        module: serviceRequest.module,
                        entityType: "service_request",
                        entityId: id,
                    })
                }
            } else {
                // Notify the client who made the request
                await createNotification({
                    userId: serviceRequest.requested_by,
                    fromUserId: user.id,
                    fromUserName: userData.fullName,
                    type: "info",
                    title: `Respuesta a tu solicitud: ${serviceRequest.title}`,
                    message: `${userData.fullName} respondió a tu solicitud "${serviceRequest.title}"`,
                    module: serviceRequest.module,
                    entityType: "service_request",
                    entityId: id,
                    clientId: serviceRequest.client_id,
                    clientName: serviceRequest.client_name,
                })
            }
        }

        return NextResponse.json({ data: comment }, { status: 201 })
    } catch (error) {
        console.error("Error creating comment:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
