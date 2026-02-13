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
    } catch (err) {
        console.error("Error creating notification:", err)
    }
}
