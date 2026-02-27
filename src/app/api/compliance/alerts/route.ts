import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth"
import { getErrorMessage } from "@/lib/api/errors"
import { ROLES } from "@/lib/constants/roles"

export async function GET() {
    try {
        const auth = await requireAuth()
        if ("error" in auth) return auth.error
        const { user, sysUser, supabase } = auth

        // Build query
        let query = supabase
            .from("company_registrations")
            .select("*, clients:client_id(id, business_name, name)")
            .not("expiration_date", "is", null)
            .order("expiration_date", { ascending: true })

        // Contadores only see their own registrations
        if (sysUser.role === ROLES.CONTADOR) {
            query = query.eq("created_by", user.id)
        }

        const { data: registrations, error } = await query

        if (error) throw error

        const now = new Date()

        interface ClientData {
            id: string
            business_name?: string
            name?: string
        }

        interface Alert {
            id: string
            clientId: string
            clientName: string
            type: string
            label: string
            expirationDate: string
            daysLeft: number
            severity: "expired" | "critical" | "warning"
        }

        const alerts: Alert[] = []

        for (const reg of registrations || []) {
            const exp = new Date(reg.expiration_date + "T23:59:59")
            const diffDays = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

            if (diffDays <= 30) {
                const clientData = reg.clients as ClientData | null
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
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
