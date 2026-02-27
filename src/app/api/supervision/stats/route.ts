import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supervision/admin-guard"
import { getErrorMessage } from "@/lib/api/errors"

export async function GET(request: Request) {
    try {
        const auth = await requireAdmin()
        if ("error" in auth) return auth.error
        const { supabase } = auth

        const { searchParams } = new URL(request.url)
        const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))
        const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))

        const startDate = `${year}-${String(month).padStart(2, "0")}-01`
        const endDate = month === 12
            ? `${year + 1}-01-01`
            : `${year}-${String(month + 1).padStart(2, "0")}-01`

        // ── Tareas completadas este mes ──
        const { data: completedTasks } = await supabase
            .from("tasks")
            .select("id, estimated_hours, started_at, completed_at, assigned_to, assigned_to_name, client_id")
            .eq("status", "completada")
            .gte("completed_at", startDate)
            .lt("completed_at", endDate)

        const tasksCompleted = completedTasks?.length || 0

        // ── Tiempo promedio (horas) ──
        let totalHours = 0
        let tasksWithTime = 0
        for (const t of completedTasks || []) {
            if (t.started_at && t.completed_at) {
                const hrs = (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 3600000
                totalHours += hrs
                tasksWithTime++
            }
        }
        const avgTimeHours = tasksWithTime > 0 ? Math.round((totalHours / tasksWithTime) * 10) / 10 : 0

        // ── Cumplimiento % (completadas a tiempo / total completadas) ──
        let onTime = 0
        for (const t of completedTasks || []) {
            if (!t.estimated_hours) { onTime++; continue }
            if (t.started_at && t.completed_at) {
                const actualHrs = (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 3600000
                if (actualHrs <= t.estimated_hours * 1.3) onTime++
            }
        }
        const complianceRate = tasksCompleted > 0 ? Math.round((onTime / tasksCompleted) * 100) : 0

        // ── Tareas retrasadas (en proceso pasada su due_date) ──
        const { count: delayedCount } = await supabase
            .from("tasks")
            .select("*", { count: "exact", head: true })
            .eq("status", "en_proceso")
            .lt("due_date", new Date().toISOString().split("T")[0])

        // ── Todos los empleados (admin + contador) ──
        const { data: employees } = await supabase
            .from("system_users")
            .select("auth_user_id, full_name, role")
            .in("role", ["admin", "contador"])

        // ── Eficiencia por empleado ──
        const employeeEfficiency: { name: string; efficiency: number; tasksCount: number; hoursWorked: number }[] = []
        for (const emp of employees || []) {
            const empTasks = (completedTasks || []).filter(t => t.assigned_to === emp.auth_user_id)
            if (empTasks.length === 0) {
                employeeEfficiency.push({ name: emp.full_name, efficiency: 0, tasksCount: 0, hoursWorked: 0 })
                continue
            }
            let empOnTime = 0
            let empHours = 0
            for (const t of empTasks) {
                if (t.started_at && t.completed_at) {
                    const hrs = (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 3600000
                    empHours += hrs
                    if (!t.estimated_hours || hrs <= t.estimated_hours * 1.3) empOnTime++
                } else {
                    empOnTime++
                }
            }
            employeeEfficiency.push({
                name: emp.full_name,
                efficiency: Math.round((empOnTime / empTasks.length) * 100),
                tasksCount: empTasks.length,
                hoursWorked: Math.round(empHours * 10) / 10,
            })
        }

        // Sort to find most/least efficient
        const sorted = [...employeeEfficiency].sort((a, b) => b.efficiency - a.efficiency)
        const mostEfficient = sorted[0] || null
        const mostSaturated = [...employeeEfficiency].sort((a, b) => b.hoursWorked - a.hoursWorked)[0] || null

        // ── Team average efficiency ──
        const avgEfficiency = employeeEfficiency.length > 0
            ? Math.round(employeeEfficiency.reduce((s, e) => s + e.efficiency, 0) / employeeEfficiency.length)
            : 0

        // ── Client profitability quick ranking ──
        const { data: financials } = await supabase
            .from("client_financials")
            .select("client_id, ingreso_mensual")
            .eq("activo", true)

        const { data: clients } = await supabase.from("clients").select("id, business_name")

        const clientMap = new Map((clients || []).map(c => [c.id, c.business_name]))

        let topClient = null
        if (financials && financials.length > 0) {
            const best = financials.sort((a, b) => (b.ingreso_mensual || 0) - (a.ingreso_mensual || 0))[0]
            topClient = { name: clientMap.get(best.client_id) || "—", ingreso: best.ingreso_mensual }
        }

        // ── Tendencia 6 meses ──
        const trend: { month: string; completed: number; avgHours: number }[] = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(year, month - 1 - i, 1)
            const mStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
            const mEnd = d.getMonth() === 11
                ? `${d.getFullYear() + 1}-01-01`
                : `${d.getFullYear()}-${String(d.getMonth() + 2).padStart(2, "0")}-01`

            const { data: mTasks } = await supabase
                .from("tasks")
                .select("started_at, completed_at")
                .eq("status", "completada")
                .gte("completed_at", mStart)
                .lt("completed_at", mEnd)

            let mHours = 0; let mCount = 0
            for (const t of mTasks || []) {
                if (t.started_at && t.completed_at) {
                    mHours += (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 3600000
                    mCount++
                }
            }

            const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
            trend.push({
                month: monthNames[d.getMonth()],
                completed: mTasks?.length || 0,
                avgHours: mCount > 0 ? Math.round((mHours / mCount) * 10) / 10 : 0,
            })
        }

        return NextResponse.json({
            kpis: {
                tasksCompleted,
                avgTimeHours,
                complianceRate,
                delayedCount: delayedCount || 0,
                avgEfficiency,
                mostEfficient: mostEfficient ? { name: mostEfficient.name, efficiency: mostEfficient.efficiency } : null,
                mostSaturated: mostSaturated ? { name: mostSaturated.name, hours: mostSaturated.hoursWorked } : null,
                topClient,
            },
            employeeEfficiency,
            trend,
        })
    } catch (error: unknown) {
        console.error("Error fetching supervision stats:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
