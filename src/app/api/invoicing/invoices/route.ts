import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { logActivity } from "@/lib/activity"

export async function GET(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const clientId = searchParams.get("clientId")
        const year = searchParams.get("year")
        const month = searchParams.get("month")

        if (!clientId) return NextResponse.json({ error: "clientId requerido" }, { status: 400 })

        const supabase = createAdminClient()

        let query = supabase
            .from("invoices")
            .select("*")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false })

        if (year && month) {
            const startDate = `${year}-${month.padStart(2, "0")}-01`
            const endMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
            const endYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
            const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`
            query = query.gte("issue_date", startDate).lt("issue_date", endDate)
        }

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const supabase = createAdminClient()

        const { data: sysUser } = await supabase
            .from("system_users")
            .select("role, full_name")
            .eq("auth_user_id", user.id)
            .single()

        if (!sysUser || (sysUser.role !== "admin" && sysUser.role !== "contador")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const body = await request.json()
        const { clientId, agentName, issueDate, serie, folio, recipientName, total, pendingAmount, paymentMethod, uuidSat, status, notes } = body

        if (!clientId || !recipientName) {
            return NextResponse.json({ error: "Datos obligatorios faltantes" }, { status: 400 })
        }

        const { data, error } = await supabase.from("invoices").insert({
            client_id: clientId,
            agent_name: agentName || null,
            issue_date: issueDate || new Date().toISOString().split("T")[0],
            serie: serie || "CFDI",
            folio: folio || null,
            recipient_name: recipientName,
            total: total || 0,
            pending_amount: pendingAmount ?? total ?? 0,
            payment_method: paymentMethod || null,
            uuid_sat: uuidSat || null,
            status: status || "vigente",
            notes: notes || null,
            created_by: user.id,
        }).select().single()

        if (error) throw error

        // Log activity
        const { data: client } = await supabase.from("clients").select("business_name").eq("id", clientId).single()
        await logActivity({
            userId: user.id,
            userName: sysUser.full_name || "Usuario",
            clientId,
            clientName: client?.business_name || "",
            module: "invoicing",
            action: "created",
            entityType: "invoice",
            description: `${sysUser.full_name} registró factura ${serie || "CFDI"} ${folio || ""} para ${recipientName}`,
        })

        return NextResponse.json({ data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
