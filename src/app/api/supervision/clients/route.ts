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

        // Get all clients with financials
        const { data: clients } = await supabase
            .from("clients")
            .select("id, business_name")

        const { data: financials } = await supabase
            .from("client_financials")
            .select("*")
            .eq("activo", true)

        const financialMap = new Map((financials || []).map(f => [f.client_id, f]))

        // Get employees + capacity for cost calculation
        const { data: _employees } = await supabase
            .from("system_users")
            .select("auth_user_id, full_name")
            .in("role", ["admin", "contador"])

        const { data: capacities } = await supabase
            .from("capacity_settings")
            .select("user_id, horas_laborales_diarias, dias_laborales_semana, salario_mensual")

        const capMap = new Map((capacities || []).map(c => [c.user_id, c]))

        // Business days for cost/hour calc
        const daysInMonth = new Date(year, month, 0).getDate()

        const results = []

        for (const client of clients || []) {
            const fin = financialMap.get(client.id)

            // Tasks for this client this month
            const { data: clientTasks } = await supabase
                .from("tasks")
                .select("assigned_to, started_at, completed_at, module, category")
                .eq("client_id", client.id)
                .eq("status", "completada")
                .gte("completed_at", startDate)
                .lt("completed_at", endDate)

            // Calculate hours invested and cost
            let hoursInvested = 0
            let totalCost = 0
            const categoryHours: Record<string, number> = {}

            for (const t of clientTasks || []) {
                if (t.started_at && t.completed_at) {
                    const hrs = (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 3600000
                    hoursInvested += hrs

                    // Category breakdown
                    const cat = t.category || t.module || "General"
                    categoryHours[cat] = (categoryHours[cat] || 0) + hrs

                    // Cost based on employee salary
                    if (t.assigned_to) {
                        const cap = capMap.get(t.assigned_to)
                        if (cap && cap.salario_mensual) {
                            const empDays = (daysInMonth / 7) * (cap.dias_laborales_semana || 5)
                            const empCapacity = empDays * (cap.horas_laborales_diarias || 8)
                            const costoHora = empCapacity > 0 ? cap.salario_mensual / empCapacity : 0
                            totalCost += hrs * costoHora
                        }
                    }
                }
            }

            const ingresoMensual = fin?.ingreso_mensual || 0
            const costoOperativo = fin?.costo_operativo_estimado || 0
            const costoTotal = totalCost + costoOperativo
            const rentabilidad = ingresoMensual - costoTotal
            const margen = ingresoMensual > 0 ? Math.round((rentabilidad / ingresoMensual) * 100) : 0

            let margenLevel: string
            if (margen > 40) margenLevel = "alto"
            else if (margen >= 20) margenLevel = "medio"
            else margenLevel = "bajo"

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
                    .eq("client_id", client.id)
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
                    hours: Math.round(mHrs * 10) / 10,
                    tasks: mTasks?.length || 0,
                })
            }

            results.push({
                id: client.id,
                name: client.business_name,
                ingresoMensual: Math.round(ingresoMensual * 100) / 100,
                hoursInvested: Math.round(hoursInvested * 10) / 10,
                costoOperativo: Math.round(costoOperativo * 100) / 100,
                costoLaboral: Math.round(totalCost * 100) / 100,
                costoTotal: Math.round(costoTotal * 100) / 100,
                rentabilidad: Math.round(rentabilidad * 100) / 100,
                margen,
                margenLevel,
                tasksCompleted: clientTasks?.length || 0,
                categoryHours,
                trend,
            })
        }

        // Sort by profitability
        results.sort((a, b) => b.rentabilidad - a.rentabilidad)

        const profitable = results.filter(c => c.rentabilidad > 0)
        const losses = results.filter(c => c.rentabilidad <= 0 && c.ingresoMensual > 0)

        return NextResponse.json({
            clients: results,
            summary: {
                totalClients: results.length,
                profitable: profitable.length,
                withLosses: losses.length,
                totalRevenue: Math.round(results.reduce((s, c) => s + c.ingresoMensual, 0) * 100) / 100,
                totalCost: Math.round(results.reduce((s, c) => s + c.costoTotal, 0) * 100) / 100,
            },
        })
    } catch (error: unknown) {
        console.error("Error fetching client profitability:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
