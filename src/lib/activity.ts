import { createAdminClient } from "@/lib/supabase/admin"

interface LogActivityParams {
    userId: string
    userName: string
    clientId?: string
    clientName?: string
    module: string
    action: string
    entityType?: string
    entityId?: string
    description: string
    metadata?: Record<string, any>
}

interface CreateNotificationParams {
    userId: string
    fromUserId?: string
    fromUserName?: string
    type: "assignment" | "alert" | "info" | "deadline" | "completion"
    title: string
    message: string
    module?: string
    entityType?: string
    entityId?: string
    sendEmail?: boolean
}

export async function logActivity(params: LogActivityParams) {
    try {
        const supabase = createAdminClient()
        const { error } = await supabase.from("activity_log").insert({
            user_id: params.userId,
            user_name: params.userName,
            client_id: params.clientId || null,
            client_name: params.clientName || null,
            module: params.module,
            action: params.action,
            entity_type: params.entityType || null,
            entity_id: params.entityId || null,
            description: params.description,
            metadata: params.metadata || {},
        })
        if (error) console.error("Error logging activity:", error)
    } catch (err) {
        console.error("Error logging activity:", err)
    }
}

export async function createNotification(params: CreateNotificationParams) {
    try {
        const supabase = createAdminClient()
        const { error } = await supabase.from("notifications").insert({
            user_id: params.userId,
            from_user_id: params.fromUserId || null,
            from_user_name: params.fromUserName || null,
            type: params.type,
            title: params.title,
            message: params.message,
            module: params.module || null,
            entity_type: params.entityType || null,
            entity_id: params.entityId || null,
        })
        if (error) console.error("Error creating notification:", error)

        // Send email notification if requested
        if (params.sendEmail !== false) {
            try {
                await sendNotificationEmail(supabase, params.userId, params.title, params.message, params.type)
            } catch (emailErr) {
                console.error("Error sending notification email:", emailErr)
            }
        }
    } catch (err) {
        console.error("Error creating notification:", err)
    }
}

async function sendNotificationEmail(
    supabase: ReturnType<typeof createAdminClient>,
    userId: string,
    title: string,
    message: string,
    type: string
) {
    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL

    if (!apiKey || !fromEmail) return

    // Get user email from system_users → auth user
    const { data: sysUser } = await supabase
        .from("system_users")
        .select("email, full_name")
        .eq("auth_user_id", userId)
        .single()

    if (!sysUser?.email) return

    const typeLabels: Record<string, string> = {
        assignment: "📋 Asignación",
        alert: "⚠️ Alerta",
        info: "ℹ️ Información",
        deadline: "⏰ Vencimiento",
        completion: "✅ Completado",
    }

    const typeLabel = typeLabels[type] || type

    const { Resend } = await import("resend")
    const resend = new Resend(apiKey)

    await resend.emails.send({
        from: `Notificaciones AR&CP <${fromEmail}>`,
        to: sysUser.email,
        subject: `${typeLabel}: ${title}`,
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px;">
                <div style="background: #f8fafc; border-radius: 12px; padding: 24px; border-left: 4px solid ${type === 'alert' || type === 'deadline' ? '#f59e0b' : type === 'assignment' ? '#6366f1' : '#10b981'};">
                    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin: 0 0 8px 0;">${typeLabel}</p>
                    <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #1e293b;">${title}</h2>
                    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">${message}</p>
                </div>
                <p style="margin-top: 20px; text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://arycp.com'}/dashboard" 
                       style="display: inline-block; padding: 10px 24px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
                        Ver en el sistema
                    </a>
                </p>
                <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 16px;">
                    AR&CP Sistema Integral — Notificación automática
                </p>
            </div>
        `,
    })
}
