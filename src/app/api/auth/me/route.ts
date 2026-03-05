import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserRole } from "@/lib/auth/get-user-role"
import { getErrorMessage } from "@/lib/api/errors"

export async function GET() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const userData = await getUserRole(user.id)

        // Base response
        const response: Record<string, unknown> = {
            id: user.id,
            email: user.email,
            role: userData.role,
            fullName: userData.fullName,
        }

        // If client role, get their contracted services and client IDs (supports multi-company)
        if (userData.role === "cliente" && user.email) {
            const adminClient = createAdminClient()
            const lookupEmail = user.email.toLowerCase().trim()
            const { data: clientsData } = await adminClient
                .from("clients")
                .select("id, name, has_accounting, has_fiscal, has_legal, has_labor")
                .ilike("email", lookupEmail)
                .order("name")

            if (clientsData && clientsData.length > 0) {
                const first = clientsData[0]
                response.clientId = first.id
                response.services = {
                    has_accounting: first.has_accounting || false,
                    has_fiscal: first.has_fiscal || false,
                    has_legal: first.has_legal || false,
                    has_labor: first.has_labor || false,
                }
                response.clients = clientsData.map(c => ({
                    id: c.id,
                    name: c.name || "Sin nombre",
                    has_accounting: c.has_accounting || false,
                    has_fiscal: c.has_fiscal || false,
                    has_legal: c.has_legal || false,
                    has_labor: c.has_labor || false,
                }))
            }
        }

        return NextResponse.json(response, { status: 200 })
    } catch (error: unknown) {
        console.error("Error getting user info:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
