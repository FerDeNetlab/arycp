import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getErrorMessage } from "@/lib/api/errors"

export async function GET(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const clientId = searchParams.get("clientId")
        const year = searchParams.get("year")

        if (!clientId || !year) {
            return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
        }

        // Use admin client to bypass RLS
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from("monthly_declarations")
            .select("*")
            .eq("client_id", clientId)
            .eq("year", parseInt(year))

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error: unknown) {
        console.error("Error fetching declarations:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
