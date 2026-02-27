import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth"
import { getErrorMessage } from "@/lib/api/errors"
import { ROLES } from "@/lib/constants/roles"

export async function GET() {
    try {
        const auth = await requireAuth()
        if ("error" in auth) return auth.error
        const { sysUser, supabase } = auth

        let query = supabase.from("clients").select("*").order("created_at", { ascending: false })

        if (sysUser.role === ROLES.CLIENTE) {
            query = query.eq("email", sysUser.email)
        }

        const { data: clients, error: clientsError } = await query

        if (clientsError) {
            console.error("Error fetching clients:", clientsError)
            return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 })
        }

        return NextResponse.json({ clients: clients || [] }, { status: 200 })
    } catch (error: unknown) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
