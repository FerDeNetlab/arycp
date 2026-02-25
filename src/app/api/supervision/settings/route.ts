import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supervision/admin-guard"

// GET: fetch capacity & financial settings
export async function GET() {
    try {
        const auth = await requireAdmin()
        if ("error" in auth) return auth.error
        const { supabase } = auth

        const { data: capacities } = await supabase
            .from("capacity_settings")
            .select("*")
            .order("created_at", { ascending: true })

        const { data: financials } = await supabase
            .from("client_financials")
            .select("*")
            .order("created_at", { ascending: true })

        // Enrich with names
        const { data: employees } = await supabase
            .from("system_users")
            .select("auth_user_id, full_name")
            .in("role", ["admin", "contador"])

        const { data: clients } = await supabase
            .from("clients")
            .select("id, business_name")

        const empMap = new Map((employees || []).map(e => [e.auth_user_id, e.full_name]))
        const clientMap = new Map((clients || []).map(c => [c.id, c.business_name]))

        const enrichedCapacities = (capacities || []).map(c => ({
            ...c,
            user_name: empMap.get(c.user_id) || "—",
        }))

        const enrichedFinancials = (financials || []).map(f => ({
            ...f,
            client_name: clientMap.get(f.client_id) || "—",
        }))

        return NextResponse.json({
            capacities: enrichedCapacities,
            financials: enrichedFinancials,
            employees: (employees || []).map(e => ({ id: e.auth_user_id, name: e.full_name })),
            clients: (clients || []).map(c => ({ id: c.id, name: c.business_name })),
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST: upsert capacity or financial settings
export async function POST(request: Request) {
    try {
        const auth = await requireAdmin()
        if ("error" in auth) return auth.error
        const { supabase } = auth

        const body = await request.json()
        const { type } = body

        if (type === "capacity") {
            const { user_id, horas_laborales_diarias, dias_laborales_semana, salario_mensual } = body
            if (!user_id) return NextResponse.json({ error: "user_id requerido" }, { status: 400 })

            const { data: existing } = await supabase
                .from("capacity_settings")
                .select("id")
                .eq("user_id", user_id)
                .single()

            if (existing) {
                await supabase
                    .from("capacity_settings")
                    .update({
                        horas_laborales_diarias: horas_laborales_diarias || 8,
                        dias_laborales_semana: dias_laborales_semana || 5,
                        salario_mensual: salario_mensual || 0,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("user_id", user_id)
            } else {
                await supabase.from("capacity_settings").insert({
                    user_id,
                    horas_laborales_diarias: horas_laborales_diarias || 8,
                    dias_laborales_semana: dias_laborales_semana || 5,
                    salario_mensual: salario_mensual || 0,
                })
            }

            return NextResponse.json({ success: true })
        }

        if (type === "financial") {
            const { client_id, ingreso_mensual, costo_operativo_estimado } = body
            if (!client_id) return NextResponse.json({ error: "client_id requerido" }, { status: 400 })

            const { data: existing } = await supabase
                .from("client_financials")
                .select("id")
                .eq("client_id", client_id)
                .single()

            if (existing) {
                await supabase
                    .from("client_financials")
                    .update({
                        ingreso_mensual: ingreso_mensual || 0,
                        costo_operativo_estimado: costo_operativo_estimado || 0,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("client_id", client_id)
            } else {
                await supabase.from("client_financials").insert({
                    client_id,
                    ingreso_mensual: ingreso_mensual || 0,
                    costo_operativo_estimado: costo_operativo_estimado || 0,
                })
            }

            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: "Tipo no válido (capacity | financial)" }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
