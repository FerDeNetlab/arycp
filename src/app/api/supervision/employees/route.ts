import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supervision/admin-guard"

export async function GET(request: Request) {
    try {
        const auth = await requireAdmin()
        if ("error" in auth) return auth.error
        const { supabase } = auth

        const { searchParams } = new URL(request.url)
        const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))
        const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))
        const employeeId = searchParams.get("employeeId")

        const startDate = `${year}-${String(month).padStart(2, "0")}-01`
        const endDate = month === 12
            ? `${year + 1}-01-01`
            : `${year}-${String(month + 1).padStart(2, "0")}-01`

        // Get employees (admin + contador)
        const { data: employees } = await supabase
            .from("system_users")
            .select("auth_user_id, full_name, email, role")
            .in("role", ["admin", "contador"])

        // If specific employee requested
        const targetEmployees = employeeId
            ? (employees || []).filter(e => e.auth_user_id === employeeId)
            : (employees || [])

        const results = []

        for (const emp of targetEmployees) {
            // Capacity settings
            const { data: capacity } = await supabase
                .from("capacity_settings")
                .select("*")
                .eq("user_id", emp.auth_user_id)
                .single()

            const horasDay = capacity?.horas_laborales_diarias || 8
            const diasWeek = capacity?.dias_laborales_semana || 5
            const salario = capacity?.salario_mensual || 0

            // Business days in month (approx)
            const daysInMonth = new Date(year, month, 0).getDate()
            const weeksInMonth = daysInMonth / 7
            const businessDays = Math.round(weeksInMonth * diasWeek)
            const capacityHours = businessDays * horasDay

            // Completed tasks this month
            const { data: empTasks } = await supabase
                .from("tasks")
                .select("id, title, client_id, estimated_hours, started_at, completed_at, due_date, status")
                .eq("assigned_to", emp.auth_user_id)
                .gte("completed_at", startDate)
                .lt("completed_at", endDate)

            // In-progress tasks
            const { data: inProgressTasks } = await supabase
                .from("tasks")
                .select("id, title, client_id, started_at, due_date, estimated_hours")
                .eq("assigned_to", emp.auth_user_id)
                .eq("status", "en_proceso")

            let hoursWorked = 0
            let onTime = 0
            let delayed = 0
            for (const t of empTasks || []) {
                if (t.started_at && t.completed_at) {
                    const hrs = (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 3600000
                    hoursWorked += hrs
                    if (!t.estimated_hours || hrs <= t.estimated_hours * 1.3) onTime++
                    else delayed++
                } else {
                    onTime++
                }
            }

            const tasksCompleted = empTasks?.length || 0
            const efficiency = tasksCompleted > 0 ? Math.round((onTime / tasksCompleted) * 100) : 0
            const compliance = tasksCompleted > 0 ? Math.round((onTime / tasksCompleted) * 100) : 0
            const loadIndex = capacityHours > 0 ? Math.round((hoursWorked / capacityHours) * 100) : 0

            // Load level
            let loadLevel: string
            if (loadIndex > 100) loadLevel = "sobrecargado"
            else if (loadIndex > 85) loadLevel = "alto"
            else if (loadIndex >= 60) loadLevel = "optimo"
            else loadLevel = "bajo"

            // 3-month trend
            const trend = []
            for (let i = 2; i >= 0; i--) {
                const d = new Date(year, month - 1 - i, 1)
                const mStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
                const mEnd = d.getMonth() === 11
                    ? `${d.getFullYear() + 1}-01-01`
                    : `${d.getFullYear()}-${String(d.getMonth() + 2).padStart(2, "0")}-01`

                const { data: mTasks } = await supabase
                    .from("tasks")
                    .select("started_at, completed_at")
                    .eq("assigned_to", emp.auth_user_id)
                    .eq("status", "completada")
                    .gte("completed_at", mStart)
                    .lt("completed_at", mEnd)

                let mHrs = 0
                for (const t of mTasks || []) {
                    if (t.started_at && t.completed_at) {
                        mHrs += (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 3600000
                    }
                }

                const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
                trend.push({
                    month: monthNames[d.getMonth()],
                    tasks: mTasks?.length || 0,
                    hours: Math.round(mHrs * 10) / 10,
                })
            }

            results.push({
                id: emp.auth_user_id,
                name: emp.full_name,
                email: emp.email,
                role: emp.role,
                hoursWorked: Math.round(hoursWorked * 10) / 10,
                capacityHours,
                loadIndex,
                loadLevel,
                tasksCompleted,
                inProgressCount: inProgressTasks?.length || 0,
                efficiency,
                compliance,
                delayed,
                costoHora: capacityHours > 0 ? Math.round((salario / capacityHours) * 100) / 100 : 0,
                salario,
                trend,
            })
        }

        return NextResponse.json({ employees: results })
    } catch (error: any) {
        console.error("Error fetching employee data:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
