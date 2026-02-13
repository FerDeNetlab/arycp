import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit") || "20")
        const module = searchParams.get("module")

        const supabase = createAdminClient()

        let query = supabase
            .from("activity_log")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit)

        if (module) {
            query = query.eq("module", module)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error("Error fetching activity:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
