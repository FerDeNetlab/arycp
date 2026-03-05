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

        // ══════════════════════════════════════════════════════════════════
        //  1. ACTIVITY LOG — real cross-module activity from all modules
        // ══════════════════════════════════════════════════════════════════

        const { data: activities } = await supabase
            .from("activity_log")
            .select("id, user_id, user_name, module, action, client_id, created_at")
            .gte("created_at", startDate)
            .lt("created_at", endDate)

        const allActivities = activities || []

        // Get all employees (admin + contador)
        const { data: employees } = await supabase
            .from("system_users")
            .select("auth_user_id, full_name, role")
            .in("role", ["admin", "contador"])

        const empList = employees || []

        // Activities per employee
        const activityByEmployee: Record<string, { name: string; count: number; byModule: Record<string, number> }> = {}
        for (const emp of empList) {
            activityByEmployee[emp.auth_user_id] = { name: emp.full_name, count: 0, byModule: {} }
        }
        for (const act of allActivities) {
            if (!activityByEmployee[act.user_id]) {
                activityByEmployee[act.user_id] = { name: act.user_name || "Desconocido", count: 0, byModule: {} }
            }
            activityByEmployee[act.user_id].count++
            const mod = act.module || "otro"
            activityByEmployee[act.user_id].byModule[mod] = (activityByEmployee[act.user_id].byModule[mod] || 0) + 1
        }

        // Total activities by module
        const activityByModule: Record<string, number> = {}
        for (const act of allActivities) {
            const mod = act.module || "otro"
            activityByModule[mod] = (activityByModule[mod] || 0) + 1
        }

        // ══════════════════════════════════════════════════════════════════
        //  2. TASKS TABLE — manual supervision tasks
        // ══════════════════════════════════════════════════════════════════

        const { data: completedTasks } = await supabase
            .from("tasks")
            .select("id, estimated_hours, started_at, completed_at, assigned_to, assigned_to_name, client_id")
            .eq("status", "completada")
            .gte("completed_at", startDate)
            .lt("completed_at", endDate)

        const tasksCompleted = completedTasks?.length || 0

        // Avg time for tasks
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

        // On-time compliance
        let onTime = 0
        for (const t of completedTasks || []) {
            if (!t.estimated_hours) { onTime++; continue }
            if (t.started_at && t.completed_at) {
                const actualHrs = (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 3600000
                if (actualHrs <= t.estimated_hours * 1.3) onTime++
            }
        }
        const complianceRate = tasksCompleted > 0 ? Math.round((onTime / tasksCompleted) * 100) : 0

        // Delayed tasks
        const { count: delayedCount } = await supabase
            .from("tasks")
            .select("*", { count: "exact", head: true })
            .eq("status", "en_proceso")
            .lt("due_date", new Date().toISOString().split("T")[0])

        // ══════════════════════════════════════════════════════════════════
        //  3. COMBINED EMPLOYEE METRICS — tasks + activities = score
        // ══════════════════════════════════════════════════════════════════

        type EmployeeMetric = {
            name: string
            activities: number
            tasksCompleted: number
            score: number
            hoursWorked: number
            efficiency: number
            byModule: Record<string, number>
        }

        const employeeMetrics: EmployeeMetric[] = []
        for (const emp of empList) {
            const empTasks = (completedTasks || []).filter(t => t.assigned_to === emp.auth_user_id)
            const empActivity = activityByEmployee[emp.auth_user_id] || { count: 0, byModule: {} }

            // Task efficiency
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

            // Score = activities count + (tasks * 5 points each, since tasks are heavier)
            const score = empActivity.count + (empTasks.length * 5)

            employeeMetrics.push({
                name: emp.full_name,
                activities: empActivity.count,
                tasksCompleted: empTasks.length,
                score,
                hoursWorked: Math.round(empHours * 10) / 10,
                efficiency: empTasks.length > 0 ? Math.round((empOnTime / empTasks.length) * 100) : 0,
                byModule: empActivity.byModule,
            })
        }

        // Sort by score
        const sortedByScore = [...employeeMetrics].sort((a, b) => b.score - a.score)
        const mostProductive = sortedByScore[0] || null
        const mostSaturated = [...employeeMetrics].sort((a, b) => b.hoursWorked - a.hoursWorked)[0] || null

        // Team avg
        const avgScore = employeeMetrics.length > 0
            ? Math.round(employeeMetrics.reduce((s, e) => s + e.score, 0) / employeeMetrics.length)
            : 0

        // ── Client profitability ──
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

        // ══════════════════════════════════════════════════════════════════
        //  4. TREND — last 6 months (activities + tasks)
        // ══════════════════════════════════════════════════════════════════

        const trend: { month: string; activities: number; tasks: number; score: number }[] = []
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

        for (let i = 5; i >= 0; i--) {
            const d = new Date(year, month - 1 - i, 1)
            const mStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
            const mEnd = d.getMonth() === 11
                ? `${d.getFullYear() + 1}-01-01`
                : `${d.getFullYear()}-${String(d.getMonth() + 2).padStart(2, "0")}-01`

            // Activities count
            const { count: actCount } = await supabase
                .from("activity_log")
                .select("*", { count: "exact", head: true })
                .gte("created_at", mStart)
                .lt("created_at", mEnd)

            // Tasks completed count
            const { count: taskCount } = await supabase
                .from("tasks")
                .select("*", { count: "exact", head: true })
                .eq("status", "completada")
                .gte("completed_at", mStart)
                .lt("completed_at", mEnd)

            const acts = actCount || 0
            const tsks = taskCount || 0

            trend.push({
                month: monthNames[d.getMonth()],
                activities: acts,
                tasks: tsks,
                score: acts + (tsks * 5),
            })
        }

        // ══════════════════════════════════════════════════════════════════
        //  5. MODULE LABELS for the frontend
        // ══════════════════════════════════════════════════════════════════

        const moduleLabels: Record<string, string> = {
            accounting: "Contabilidad",
            invoicing: "Facturación",
            labor: "Nómina/Laboral",
            procedures: "Trámites",
            compliance: "Compliance",
            fiscal: "Fiscal",
            legal: "Legal",
            activity: "Asignaciones",
            otro: "Otro",
        }

        const moduleBreakdown = Object.entries(activityByModule).map(([mod, count]) => ({
            module: mod,
            label: moduleLabels[mod] || mod,
            count,
        })).sort((a, b) => b.count - a.count)

        return NextResponse.json({
            kpis: {
                totalActivities: allActivities.length,
                tasksCompleted,
                avgTimeHours,
                complianceRate,
                delayedCount: delayedCount || 0,
                avgScore,
                mostProductive: mostProductive ? { name: mostProductive.name, score: mostProductive.score } : null,
                mostSaturated: mostSaturated ? { name: mostSaturated.name, hours: mostSaturated.hoursWorked } : null,
                topClient,
            },
            employeeMetrics,
            moduleBreakdown,
            trend,
        })
    } catch (error: unknown) {
        console.error("Error fetching supervision stats:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
