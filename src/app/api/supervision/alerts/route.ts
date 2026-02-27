import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supervision/admin-guard"
import { getErrorMessage } from "@/lib/api/errors"

interface SupervisionAlert {
    type: string
    severity: string
    title: string
    message: string
    entity_id: string
    entity_type: string
    entity_name: string
}

export async function GET() {
    try {
        const auth = await requireAdmin()
        if ("error" in auth) return auth.error
        const { supabase } = auth

        // Fetch existing unresolved alerts
        const { data: alerts } = await supabase
            .from("supervision_alerts")
            .select("*")
            .eq("is_resolved", false)
            .order("created_at", { ascending: false })
            .limit(50)

        return NextResponse.json({ alerts: alerts || [] })
    } catch (error: unknown) {
        console.error("Error fetching alerts:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

// Generate new alerts based on current data
export async function POST() {
    try {
        const auth = await requireAdmin()
        if ("error" in auth) return auth.error
        const { supabase } = auth

        const newAlerts: SupervisionAlert[] = []
        const now = new Date()
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

        // 1. Tasks exceeding estimated time + 30%
        const { data: overdueTasks } = await supabase
            .from("tasks")
            .select("id, title, estimated_hours, started_at, assigned_to_name")
            .eq("status", "en_proceso")
            .not("estimated_hours", "is", null)
            .not("started_at", "is", null)

        for (const t of overdueTasks || []) {
            if (t.started_at && t.estimated_hours) {
                const elapsed = (now.getTime() - new Date(t.started_at).getTime()) / 3600000
                if (elapsed > t.estimated_hours * 1.3) {
                    newAlerts.push({
                        type: "overdue_task",
                        severity: "warning",
                        title: "Tarea excede tiempo estimado",
                        message: `"${t.title}" lleva ${Math.round(elapsed)}h (estimado: ${t.estimated_hours}h). Asignada a ${t.assigned_to_name || "—"}.`,
                        entity_id: t.id,
                        entity_type: "task",
                        entity_name: t.title,
                    })
                }
            }
        }

        // 2. Tasks due within 24h
        const { data: dueSoon } = await supabase
            .from("tasks")
            .select("id, title, due_date, assigned_to_name")
            .in("status", ["pendiente", "en_proceso"])
            .gte("due_date", now.toISOString().split("T")[0])
            .lte("due_date", tomorrow.toISOString().split("T")[0])

        for (const t of dueSoon || []) {
            newAlerts.push({
                type: "due_soon",
                severity: "info",
                title: "Tarea próxima a vencer",
                message: `"${t.title}" vence ${t.due_date}. Asignada a ${t.assigned_to_name || "—"}.`,
                entity_id: t.id,
                entity_type: "task",
                entity_name: t.title,
            })
        }

        // 3. Employees overloaded (>100% capacity) — BATCH queries to fix N+1
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`
        const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`
        const daysInMonth = new Date(year, month, 0).getDate()

        const { data: employees } = await supabase
            .from("system_users")
            .select("auth_user_id, full_name")
            .in("role", ["admin", "contador"])

        // Batch: fetch ALL capacity settings and ALL completed tasks in one query each
        const { data: allCapacities } = await supabase
            .from("capacity_settings")
            .select("user_id, horas_laborales_diarias, dias_laborales_semana")

        const { data: allCompletedTasks } = await supabase
            .from("tasks")
            .select("assigned_to, started_at, completed_at")
            .eq("status", "completada")
            .gte("completed_at", startDate)
            .lt("completed_at", endDate)

        // Build lookup maps
        const capacityMap = new Map(
            (allCapacities || []).map(c => [c.user_id, c])
        )
        const taskHoursByAssignee = new Map<string, number>()
        for (const t of allCompletedTasks || []) {
            if (t.started_at && t.completed_at && t.assigned_to) {
                const hrs = (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 3600000
                taskHoursByAssignee.set(t.assigned_to, (taskHoursByAssignee.get(t.assigned_to) || 0) + hrs)
            }
        }

        for (const emp of employees || []) {
            const cap = capacityMap.get(emp.auth_user_id)
            const hpd = cap?.horas_laborales_diarias || 8
            const dpw = cap?.dias_laborales_semana || 5
            const capHrs = Math.round((daysInMonth / 7) * dpw) * hpd

            const hrs = taskHoursByAssignee.get(emp.auth_user_id) || 0
            const loadPct = capHrs > 0 ? (hrs / capHrs) * 100 : 0
            if (loadPct > 100) {
                newAlerts.push({
                    type: "overloaded_employee",
                    severity: "danger",
                    title: "Empleado sobrecargado",
                    message: `${emp.full_name} tiene carga de ${Math.round(loadPct)}% este mes.`,
                    entity_id: emp.auth_user_id,
                    entity_type: "employee",
                    entity_name: emp.full_name,
                })
            }
        }

        // 4. Clients with negative profitability — BATCH queries
        const { data: financials } = await supabase.from("client_financials").select("*").eq("activo", true)
        const { data: clients } = await supabase.from("clients").select("id, business_name")
        const clientMap = new Map((clients || []).map(c => [c.id, c.business_name]))

        // Batch: fetch ALL completed tasks for period (grouped by client)
        const { data: allClientTasks } = await supabase
            .from("tasks")
            .select("client_id, started_at, completed_at")
            .eq("status", "completada")
            .not("client_id", "is", null)
            .gte("completed_at", startDate)
            .lt("completed_at", endDate)

        const taskHoursByClient = new Map<string, number>()
        for (const t of allClientTasks || []) {
            if (t.started_at && t.completed_at && t.client_id) {
                const hrs = (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 3600000
                taskHoursByClient.set(t.client_id, (taskHoursByClient.get(t.client_id) || 0) + hrs)
            }
        }

        for (const fin of financials || []) {
            if (fin.ingreso_mensual > 0) {
                const cHrs = taskHoursByClient.get(fin.client_id) || 0
                // rough cost estimate
                const estCost = cHrs * 200 + (fin.costo_operativo_estimado || 0)
                const profit = fin.ingreso_mensual - estCost
                if (profit < 0) {
                    newAlerts.push({
                        type: "negative_profitability",
                        severity: "danger",
                        title: "Rentabilidad negativa",
                        message: `${clientMap.get(fin.client_id) || "Cliente"} tiene pérdida de $${Math.abs(Math.round(profit)).toLocaleString()} este mes.`,
                        entity_id: fin.client_id,
                        entity_type: "client",
                        entity_name: clientMap.get(fin.client_id) || "",
                    })
                }
            }
        }

        // Insert new alerts (avoid duplicates by type+entity)
        if (newAlerts.length > 0) {
            // Clear old unresolved alerts of same types
            const types = [...new Set(newAlerts.map(a => a.type))]
            await supabase
                .from("supervision_alerts")
                .delete()
                .eq("is_resolved", false)
                .in("type", types)

            await supabase.from("supervision_alerts").insert(newAlerts)
        }

        return NextResponse.json({ generated: newAlerts.length })
    } catch (error: unknown) {
        console.error("Error generating alerts:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

// Resolve an alert
export async function PATCH(request: Request) {
    try {
        const auth = await requireAdmin()
        if ("error" in auth) return auth.error
        const { supabase, user } = auth

        const { alertId } = await request.json()
        if (!alertId) return NextResponse.json({ error: "alertId requerido" }, { status: 400 })

        await supabase
            .from("supervision_alerts")
            .update({ is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: user.id })
            .eq("id", alertId)

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
