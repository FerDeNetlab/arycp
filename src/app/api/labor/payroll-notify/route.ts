import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { logActivity, createNotification } from "@/lib/activity"
import { getErrorMessage } from "@/lib/api/errors"

export async function POST(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const body = await request.json()
        const { payrollId, recipientUserId, type, reason, replyToNotificationId } = body

        if (!recipientUserId || !type) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
        }

        if (type === "blocked" && !reason?.trim()) {
            return NextResponse.json({ error: "Se requiere una razón para reportar un pendiente" }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Get sender info
        const { data: sender } = await supabase
            .from("system_users")
            .select("full_name")
            .eq("auth_user_id", user.id)
            .single()

        const senderName = sender?.full_name || "Un usuario"

        // Get recipient info
        const { data: recipient } = await supabase
            .from("system_users")
            .select("full_name")
            .eq("auth_user_id", recipientUserId)
            .single()

        if (!recipient) {
            return NextResponse.json({ error: "Destinatario no encontrado" }, { status: 404 })
        }

        // Get payroll info if payrollId provided
        let payrollDesc = "una nómina"
        let clientId: string | null = null
        let clientName = ""
        if (payrollId) {
            const { data: payroll } = await supabase
                .from("labor_payroll")
                .select("period, payroll_type, client_id")
                .eq("id", payrollId)
                .single()

            if (payroll) {
                payrollDesc = `nómina ${payroll.payroll_type} - ${payroll.period}`
                clientId = payroll.client_id

                if (payroll.client_id) {
                    const { data: client } = await supabase
                        .from("clients")
                        .select("name, business_name")
                        .eq("id", payroll.client_id)
                        .single()
                    clientName = client?.business_name || client?.name || ""
                }
            }
        }

        // Build notification content based on type
        let notifTitle = ""
        let notifMessage = ""
        let notifType: "assignment" | "alert" | "info" | "deadline" | "completion" = "info"
        let activityAction = ""
        let activityDesc = ""

        if (type === "completed") {
            notifType = "completion"
            notifTitle = `✅ Nómina lista: ${payrollDesc}`
            notifMessage = `${senderName} completó la ${payrollDesc}${clientName ? ` del cliente ${clientName}` : ""}. Ya puedes continuar con el siguiente paso.`
            activityAction = "payroll_completed"
            activityDesc = `${senderName} notificó que la ${payrollDesc}${clientName ? ` (${clientName})` : ""} está lista → ${recipient.full_name}`
        } else if (type === "blocked") {
            notifType = "alert"
            notifTitle = `⚠️ Nómina pendiente: ${payrollDesc}`
            notifMessage = `${senderName} reportó un pendiente en la ${payrollDesc}${clientName ? ` del cliente ${clientName}` : ""}.\n\nRazón: ${reason}`
            activityAction = "payroll_blocked"
            activityDesc = `${senderName} reportó pendiente en ${payrollDesc}${clientName ? ` (${clientName})` : ""}: ${reason}`
        } else if (type === "reply") {
            // For replies, get the original notification to find context
            let originalPayrollDesc = payrollDesc
            if (replyToNotificationId) {
                const { data: origNotif } = await supabase
                    .from("notifications")
                    .select("title, from_user_id")
                    .eq("id", replyToNotificationId)
                    .single()

                if (origNotif?.title) {
                    originalPayrollDesc = origNotif.title.replace("⚠️ Nómina pendiente: ", "").replace("✅ Nómina lista: ", "")
                }
            }

            notifType = "info"
            notifTitle = `💬 Respuesta: ${originalPayrollDesc}`
            notifMessage = `${senderName} respondió:\n\n${reason}`
            activityAction = "payroll_reply"
            activityDesc = `${senderName} respondió sobre ${originalPayrollDesc}: ${reason?.substring(0, 100)}${(reason?.length || 0) > 100 ? "..." : ""}`
        } else {
            return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
        }

        // Send notification to recipient
        await createNotification({
            userId: recipientUserId,
            fromUserId: user.id,
            fromUserName: senderName,
            type: notifType,
            title: notifTitle,
            message: notifMessage,
            module: "labor",
            entityType: "payroll",
            entityId: payrollId || undefined,
            clientId: clientId || undefined,
            clientName: clientName || undefined,
        })

        // Log activity for the sender
        await logActivity({
            userId: user.id,
            userName: senderName,
            clientId: clientId || undefined,
            clientName: clientName || undefined,
            module: "labor",
            action: activityAction,
            entityType: "payroll",
            entityId: payrollId || undefined,
            description: activityDesc,
            metadata: {
                recipient_id: recipientUserId,
                recipient_name: recipient.full_name,
                notification_type: type,
                reason: reason || null,
            },
        })

        // Log activity for the recipient too
        await logActivity({
            userId: recipientUserId,
            userName: recipient.full_name,
            clientId: clientId || undefined,
            clientName: clientName || undefined,
            module: "labor",
            action: `${activityAction}_received`,
            entityType: "payroll",
            entityId: payrollId || undefined,
            description: activityDesc,
            metadata: {
                sender_id: user.id,
                sender_name: senderName,
                notification_type: type,
                reason: reason || null,
            },
        })

        return NextResponse.json({ success: true, recipientName: recipient.full_name })
    } catch (error: unknown) {
        console.error("Error sending payroll notification:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
