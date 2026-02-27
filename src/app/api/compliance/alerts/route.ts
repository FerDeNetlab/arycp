import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/get-user-role"
import { ROLES } from "@/lib/constants/roles"

export async function GET() {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const userData = await getUserRole(user.id)
        const supabase = createAdminClient()

        // Build query
        let query = supabase
            .from("company_registrations")
            .select("*, clients:client_id(id, business_name, name)")
            .not("expiration_date", "is", null)
            .order("expiration_date", { ascending: true })

        // Contadores only see their own registrations
        if (userData.role === ROLES.CONTADOR) {
            query = query.eq("created_by", user.id)
        }

        const { data: registrations, error } = await query

        if (error) throw error

        const now = new Date()
        const alerts: any[] = []

        for (const reg of registrations || []) {
            const exp = new Date(reg.expiration_date + "T23:59:59")
            const diffDays = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

            if (diffDays <= 30) {
                const clientData = reg.clients as any
                alerts.push({
                    id: reg.id,
                    clientId: reg.client_id,
                    clientName: clientData?.business_name || clientData?.name || "Cliente",
                    type: reg.type,
                    label: reg.label,
                    expirationDate: reg.expiration_date,
                    daysLeft: diffDays,
                    severity: diffDays < 0 ? "expired" : diffDays <= 7 ? "critical" : "warning",
                })
            }
        }

        return NextResponse.json({ alerts })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
