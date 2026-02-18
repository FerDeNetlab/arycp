import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const clientId = searchParams.get("clientId")
        const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))
        const month = searchParams.get("month")

        if (!clientId) return NextResponse.json({ error: "clientId requerido" }, { status: 400 })

        const supabase = createAdminClient()

        // Build date filters
        let invoiceQuery = supabase
            .from("invoices")
            .select("id, status, issue_date, total", { count: "exact" })
            .eq("client_id", clientId)

        let cancelQuery = supabase
            .from("invoice_cancellations")
            .select("id, system_status, sat_status, request_date", { count: "exact" })
            .eq("client_id", clientId)

        if (month) {
            const startDate = `${year}-${String(parseInt(month)).padStart(2, "0")}-01`
            const endMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
            const endYear = parseInt(month) === 12 ? year + 1 : year
            const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`

            invoiceQuery = invoiceQuery.gte("issue_date", startDate).lt("issue_date", endDate)
            cancelQuery = cancelQuery.gte("request_date", startDate).lt("request_date", endDate)
        } else {
            // Full year
            const startDate = `${year}-01-01`
            const endDate = `${year + 1}-01-01`
            invoiceQuery = invoiceQuery.gte("issue_date", startDate).lt("issue_date", endDate)
            cancelQuery = cancelQuery.gte("request_date", startDate).lt("request_date", endDate)
        }

        const [invoicesResult, cancellationsResult] = await Promise.all([
            invoiceQuery,
            cancelQuery,
        ])

        const invoices = invoicesResult.data || []
        const cancellations = cancellationsResult.data || []

        const totalInvoices = invoices.length
        const vigentes = invoices.filter(i => i.status === "vigente").length
        const canceladas = invoices.filter(i => i.status === "cancelado").length
        const totalAmount = invoices.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0)

        const totalCancellations = cancellations.length
        const pendientes = cancellations.filter(c =>
            c.system_status?.toLowerCase().includes("pendiente") ||
            c.sat_status?.toLowerCase().includes("pendiente")
        ).length
        const canceladasSAT = cancellations.filter(c =>
            c.sat_status?.toLowerCase().includes("cancelado") ||
            c.sat_status?.toLowerCase().includes("cancelada")
        ).length
        const rechazadas = cancellations.filter(c =>
            c.sat_status?.toLowerCase().includes("rechazada")
        ).length

        // Monthly breakdown for the year
        const monthlyData: { month: number; invoices: number; cancellations: number; amount: number }[] = []
        for (let m = 1; m <= 12; m++) {
            const mStr = String(m).padStart(2, "0")
            const mInvoices = invoices.filter(i => i.issue_date?.startsWith(`${year}-${mStr}`))
            const mCancels = cancellations.filter(c => c.request_date?.startsWith(`${year}-${mStr}`))
            monthlyData.push({
                month: m,
                invoices: mInvoices.length,
                cancellations: mCancels.length,
                amount: mInvoices.reduce((s, i) => s + (parseFloat(i.total) || 0), 0),
            })
        }

        return NextResponse.json({
            data: {
                totalInvoices,
                vigentes,
                canceladas,
                totalAmount: Math.round(totalAmount * 100) / 100,
                totalCancellations,
                pendientes,
                canceladasSAT,
                rechazadas,
                monthlyData,
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
