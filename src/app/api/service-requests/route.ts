import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserRole } from "@/lib/auth/get-user-role"
import { logActivity, createNotification } from "@/lib/activity"
import { getErrorMessage } from "@/lib/api/errors"

// GET — List service requests (filtered by user role)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const adminClient = createAdminClient()
        const userData = await getUserRole(user.id)

        const { searchParams } = new URL(request.url)
        const status = searchParams.get("status")
        const module = searchParams.get("module")
        const limit = parseInt(searchParams.get("limit") || "50")

        let query = adminClient
            .from("service_requests")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit)

        // Status filter
        if (status && status !== "all") {
            query = query.eq("status", status)
        }

        // Module filter
        if (module && module !== "all") {
            query = query.eq("module", module)
        }

        // Role-based filtering
        if (userData.role === "cliente") {
            // Clients see only their own requests
            const authEmail = (user.email || "").toLowerCase().trim()
            const { data: clientRecords } = await adminClient
                .from("clients")
                .select("id")
                .ilike("email", authEmail)

            const clientIds = (clientRecords || []).map(c => c.id)
            if (clientIds.length > 0) {
                query = query.or(`client_id.in.(${clientIds.join(",")}),requested_by.eq.${user.id}`)
            } else {
                query = query.eq("requested_by", user.id)
            }
        } else if (userData.role === "contador") {
            // Contadores see requests from their assigned clients
            const { data: sysUserRecord } = await adminClient
                .from("system_users")
                .select("id")
                .eq("auth_user_id", user.id)
                .single()

            const { data: assignments } = await adminClient
                .from("client_assignments")
                .select("client_id")
                .eq("system_user_id", sysUserRecord?.id)

            const assignedClientIds = (assignments || []).map(a => a.client_id).filter(Boolean)
            if (assignedClientIds.length > 0) {
                query = query.in("client_id", assignedClientIds)
            } else {
                // No assigned clients — show none
                return NextResponse.json({ data: [] })
            }
        }
        // Admin: no filter, sees everything

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ data: data || [] })
    } catch (error) {
        console.error("Error fetching service requests:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

// POST — Create a new service request (clients only)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const adminClient = createAdminClient()
        const userData = await getUserRole(user.id)

        const body = await request.json()
        const { clientId, clientName, module: reqModule, requestType, title, description, priority, attachments, metadata } = body

        if (!clientId || !reqModule || !requestType || !title) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
        }

        // Create the service request
        const { data: newRequest, error } = await adminClient
            .from("service_requests")
            .insert({
                client_id: clientId,
                client_name: clientName || null,
                requested_by: user.id,
                requested_by_name: userData.fullName,
                module: reqModule,
                request_type: requestType,
                title,
                description: description || null,
                priority: priority || "normal",
                attachments: attachments || [],
                metadata: metadata || {},
            })
            .select()
            .single()

        if (error) throw error

        // Log activity
        await logActivity({
            userId: user.id,
            userName: userData.fullName,
            clientId,
            clientName,
            module: reqModule,
            action: "solicitud_creada",
            entityType: "service_request",
            entityId: newRequest.id,
            description: `${userData.fullName} solicitó: ${title}`,
        })

        // Notify contadoras assigned to this client
        const { data: sysClient } = await adminClient
            .from("clients")
            .select("id")
            .eq("id", clientId)
            .single()

        if (sysClient) {
            // Find assigned contadoras
            const { data: assignments } = await adminClient
                .from("client_assignments")
                .select("system_user_id")
                .eq("client_id", clientId)

            if (assignments && assignments.length > 0) {
                // Get auth_user_ids for these system users
                const sysUserIds = assignments.map(a => a.system_user_id).filter(Boolean)
                const { data: sysUsers } = await adminClient
                    .from("system_users")
                    .select("auth_user_id")
                    .in("id", sysUserIds)

                for (const su of sysUsers || []) {
                    await createNotification({
                        userId: su.auth_user_id,
                        fromUserId: user.id,
                        fromUserName: userData.fullName,
                        type: "assignment",
                        title: `Nueva solicitud: ${title}`,
                        message: `${clientName || "Cliente"} ha solicitado: ${title} (${reqModule})`,
                        module: reqModule,
                        entityType: "service_request",
                        entityId: newRequest.id,
                        clientId,
                        clientName,
                    })
                }
            }

            // Also notify all admins
            const { data: admins } = await adminClient
                .from("system_users")
                .select("auth_user_id")
                .eq("role", "admin")

            for (const admin of admins || []) {
                await createNotification({
                    userId: admin.auth_user_id,
                    fromUserId: user.id,
                    fromUserName: userData.fullName,
                    type: "assignment",
                    title: `Nueva solicitud: ${title}`,
                    message: `${clientName || "Cliente"} ha solicitado: ${title} (${reqModule})`,
                    module: reqModule,
                    entityType: "service_request",
                    entityId: newRequest.id,
                    clientId,
                    clientName,
                })
            }
        }

        return NextResponse.json({ data: newRequest }, { status: 201 })
    } catch (error) {
        console.error("Error creating service request:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
