import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supervision/admin-guard"

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
    } catch (error: any) {
        console.error("Error fetching alerts:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Generate new alerts based on current data
export async function POST() {
    try {
        const auth = await requireAdmin()
        if ("error" in auth) return auth.error
        const { supabase } = auth

        const newAlerts: any[] = []
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

        // 3. Employees overloaded (>100% capacity)
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`
        const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`
        const daysInMonth = new Date(year, month, 0).getDate()

        const { data: employees } = await supabase
            .from("system_users")
            .select("auth_user_id, full_name")
            .in("role", ["admin", "contador"])

        for (const emp of employees || []) {
            const { data: cap } = await supabase
                .from("capacity_settings")
                .select("horas_laborales_diarias, dias_laborales_semana")
                .eq("user_id", emp.auth_user_id)
                .single()

            const hpd = cap?.horas_laborales_diarias || 8
            const dpw = cap?.dias_laborales_semana || 5
            const capHrs = Math.round((daysInMonth / 7) * dpw) * hpd

            const { data: empTasks } = await supabase
                .from("tasks")
                .select("started_at, completed_at")
                .eq("assigned_to", emp.auth_user_id)
                .eq("status", "completada")
                .gte("completed_at", startDate)
                .lt("completed_at", endDate)

            let hrs = 0
            for (const t of empTasks || []) {
                if (t.started_at && t.completed_at) {
                    hrs += (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 3600000
                }
            }

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

        // 4. Clients with negative profitability
        const { data: financials } = await supabase.from("client_financials").select("*").eq("activo", true)
        const { data: clients } = await supabase.from("clients").select("id, business_name")
        const clientMap = new Map((clients || []).map(c => [c.id, c.business_name]))

        for (const fin of financials || []) {
            if (fin.ingreso_mensual > 0) {
                const { data: cTasks } = await supabase
                    .from("tasks")
                    .select("started_at, completed_at")
                    .eq("client_id", fin.client_id)
                    .eq("status", "completada")
                    .gte("completed_at", startDate)
                    .lt("completed_at", endDate)

                let cHrs = 0
                for (const t of cTasks || []) {
                    if (t.started_at && t.completed_at) {
                        cHrs += (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 3600000
                    }
                }
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
    } catch (error: any) {
        console.error("Error generating alerts:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
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
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
