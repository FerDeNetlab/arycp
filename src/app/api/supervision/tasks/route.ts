import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supervision/admin-guard"
import { getErrorMessage } from "@/lib/api/errors"
import { logActivity, createNotification } from "@/lib/activity"

// GET: list tasks with filters
export async function GET(request: Request) {
    try {
        const auth = await requireAdmin()
        if ("error" in auth) return auth.error
        const { supabase } = auth

        const { searchParams } = new URL(request.url)
        const status = searchParams.get("status")
        const assignedTo = searchParams.get("assignedTo")
        const clientId = searchParams.get("clientId")

        let query = supabase
            .from("tasks")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100)

        if (status) query = query.eq("status", status)
        if (assignedTo) query = query.eq("assigned_to", assignedTo)
        if (clientId) query = query.eq("client_id", clientId)

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ tasks: data || [] })
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

// POST: create a new task
export async function POST(request: Request) {
    try {
        const auth = await requireAdmin()
        if ("error" in auth) return auth.error
        const { supabase, user } = auth

        const body = await request.json()
        const { title, description, client_id, assigned_to, assigned_to_name, module, category, priority, estimated_hours, due_date } = body

        if (!title) return NextResponse.json({ error: "Título requerido" }, { status: 400 })

        const { data: task, error } = await supabase
            .from("tasks")
            .insert({
                title,
                description: description || null,
                client_id: client_id || null,
                assigned_to: assigned_to || null,
                assigned_to_name: assigned_to_name || null,
                module: module || null,
                category: category || null,
                status: "pendiente",
                priority: priority || "normal",
                estimated_hours: estimated_hours || null,
                due_date: due_date || null,
                created_by: user.id,
            })
            .select()
            .single()

        if (error) throw error

        // Log initial event
        await supabase.from("task_events").insert({
            task_id: task.id,
            user_id: user.id,
            user_name: auth.sysUser.full_name,
            from_status: null,
            to_status: "pendiente",
            notes: "Tarea creada",
        })

        // Notify assignee if task is assigned
        if (assigned_to) {
            // Get client name for context
            let clientName = ""
            if (client_id) {
                const { data: client } = await supabase
                    .from("clients")
                    .select("business_name, name")
                    .eq("id", client_id)
                    .single()
                clientName = client?.business_name || client?.name || ""
            }

            await createNotification({
                userId: assigned_to,
                fromUserId: user.id,
                fromUserName: auth.sysUser.full_name,
                type: "assignment",
                title: `Nueva tarea: ${title}`,
                message: `${auth.sysUser.full_name} te asignó la tarea "${title}"${clientName ? ` — Cliente: ${clientName}` : ""}${due_date ? ` — Fecha límite: ${due_date}` : ""}.`,
                module: module || "supervision",
                entityType: "task",
                entityId: task.id,
                clientId: client_id || undefined,
                clientName: clientName || undefined,
            })

            await logActivity({
                userId: user.id,
                userName: auth.sysUser.full_name,
                clientId: client_id || undefined,
                clientName: clientName || undefined,
                module: module || "supervision",
                action: "assigned",
                entityType: "task",
                entityId: task.id,
                description: `${auth.sysUser.full_name} asignó tarea "${title}" a ${assigned_to_name || "un empleado"}`,
            })
        }

        return NextResponse.json({ task })
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

// PATCH: update task status (auto-tracks started_at/completed_at)
export async function PATCH(request: Request) {
    try {
        const auth = await requireAdmin()
        if ("error" in auth) return auth.error
        const { supabase, user } = auth

        const body = await request.json()
        const { taskId, status, assigned_to, assigned_to_name, notes } = body

        if (!taskId) return NextResponse.json({ error: "taskId requerido" }, { status: 400 })

        // Get current task
        const { data: current } = await supabase
            .from("tasks")
            .select("status, started_at")
            .eq("id", taskId)
            .single()

        if (!current) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

        if (status) {
            updates.status = status

            // Auto-track time
            if (status === "en_proceso" && !current.started_at) {
                updates.started_at = new Date().toISOString()
            }
            if (status === "completada") {
                updates.completed_at = new Date().toISOString()
            }

            // Log event
            await supabase.from("task_events").insert({
                task_id: taskId,
                user_id: user.id,
                user_name: auth.sysUser.full_name,
                from_status: current.status,
                to_status: status,
                notes: notes || null,
            })
        }

        if (assigned_to !== undefined) {
            updates.assigned_to = assigned_to
            updates.assigned_to_name = assigned_to_name || null
        }

        const { error } = await supabase
            .from("tasks")
            .update(updates)
            .eq("id", taskId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
