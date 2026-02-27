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

        // If client role, get their contracted services and client ID
        if (userData.role === "cliente") {
            const adminClient = createAdminClient()
            const { data: clientData } = await adminClient
                .from("clients")
                .select("id, has_accounting, has_fiscal, has_legal, has_labor")
                .eq("email", userData.email)
                .single()

            if (clientData) {
                response.clientId = clientData.id
                response.services = {
                    has_accounting: clientData.has_accounting || false,
                    has_fiscal: clientData.has_fiscal || false,
                    has_legal: clientData.has_legal || false,
                    has_labor: clientData.has_labor || false,
                }
            }
        }

        return NextResponse.json(response, { status: 200 })
    } catch (error: unknown) {
        console.error("Error getting user info:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
