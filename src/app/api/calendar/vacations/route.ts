import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserRole } from "@/lib/auth/get-user-role"

// GET — List vacation requests
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const userData = await getUserRole(user.id)
        const adminClient = createAdminClient()

        const { searchParams } = new URL(request.url)
        const status = searchParams.get("status")

        let query = adminClient
            .from("vacation_requests")
            .select("*")
            .order("created_at", { ascending: false })

        // Admin sees all, others only see their own
        if (userData.role !== "admin") {
            query = query.eq("user_id", user.id)
        }

        if (status && status !== "all") {
            query = query.eq("status", status)
        }

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ data: data || [] })
    } catch (error) {
        console.error("Error fetching vacations:", error)
        return NextResponse.json({ error: "Error al obtener solicitudes" }, { status: 500 })
    }
}

// POST — Request vacation
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const userData = await getUserRole(user.id)
        const body = await request.json()

        const { start_date, end_date, reason } = body

        if (!start_date || !end_date) {
            return NextResponse.json({ error: "start_date y end_date requeridos" }, { status: 400 })
        }

        // Calculate business days
        const start = new Date(start_date)
        const end = new Date(end_date)
        let days = 0
        const current = new Date(start)
        while (current <= end) {
            const dow = current.getDay()
            if (dow !== 0 && dow !== 6) days++ // Skip weekends
            current.setDate(current.getDate() + 1)
        }

        if (days === 0) {
            return NextResponse.json({ error: "El rango seleccionado no incluye días hábiles" }, { status: 400 })
        }

        const adminClient = createAdminClient()

        // Check for overlapping requests
        const { data: overlap } = await adminClient
            .from("vacation_requests")
            .select("id")
            .eq("user_id", user.id)
            .in("status", ["pending", "approved"])
            .lte("start_date", end_date)
            .gte("end_date", start_date)
            .limit(1)

        if (overlap && overlap.length > 0) {
            return NextResponse.json({ error: "Ya tienes una solicitud de vacaciones en esas fechas" }, { status: 409 })
        }

        const { data, error } = await adminClient
            .from("vacation_requests")
            .insert({
                user_id: user.id,
                user_name: userData.fullName,
                user_email: userData.email,
                start_date,
                end_date,
                days_count: days,
                reason: reason || null,
                status: "pending",
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error) {
        console.error("Error creating vacation request:", error)
        return NextResponse.json({ error: "Error al crear solicitud" }, { status: 500 })
    }
}
