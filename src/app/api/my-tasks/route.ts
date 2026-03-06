import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getErrorMessage } from "@/lib/api/errors"

// PATCH: employee updates status of their own assigned task
export async function PATCH(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const body = await request.json()
        const { taskId, status } = body

        if (!taskId || !status) {
            return NextResponse.json({ error: "taskId y status requeridos" }, { status: 400 })
        }

        // Only allow valid status transitions
        const validStatuses = ["pendiente", "en_proceso", "completada"]
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Verify the task is assigned to this user
        const { data: task } = await supabase
            .from("tasks")
            .select("id, status, started_at, assigned_to")
            .eq("id", taskId)
            .single()

        if (!task) {
            return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })
        }

        if (task.assigned_to !== user.id) {
            return NextResponse.json({ error: "No tienes permiso para actualizar esta tarea" }, { status: 403 })
        }

        // Build updates
        const updates: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString(),
        }

        if (status === "en_proceso" && !task.started_at) {
            updates.started_at = new Date().toISOString()
        }
        if (status === "completada") {
            updates.completed_at = new Date().toISOString()
        }

        // Get user name for event log
        const { data: sysUser } = await supabase
            .from("system_users")
            .select("full_name")
            .eq("auth_user_id", user.id)
            .single()

        // Update task
        const { error } = await supabase
            .from("tasks")
            .update(updates)
            .eq("id", taskId)

        if (error) throw error

        // Log event
        await supabase.from("task_events").insert({
            task_id: taskId,
            user_id: user.id,
            user_name: sysUser?.full_name || "Empleado",
            from_status: task.status,
            to_status: status,
            notes: null,
        })

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
