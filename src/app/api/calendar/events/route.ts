import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserRole } from "@/lib/auth/get-user-role"

// GET — List events in a date range
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const start = searchParams.get("start")
        const end = searchParams.get("end")
        const type = searchParams.get("type")

        if (!start || !end) {
            return NextResponse.json({ error: "start y end requeridos" }, { status: 400 })
        }

        const adminClient = createAdminClient()
        const userData = await getUserRole(user.id)

        let query = adminClient
            .from("calendar_events")
            .select("*")
            .or(`and(start_date.lte.${end},end_date.gte.${start})`)
            .order("start_date", { ascending: true })

        if (type && type !== "all") {
            query = query.eq("event_type", type)
        }

        // Role-based filtering
        if (userData.role === "cliente") {
            // Get client IDs linked to this user's email
            const lookupEmail = (userData.email || "").toLowerCase().trim()
            const { data: clientRecords } = await adminClient
                .from("clients")
                .select("id")
                .ilike("email", lookupEmail)

            const clientIds = (clientRecords || []).map(c => c.id)

            if (clientIds.length > 0) {
                // Only show events linked to their client records or created by them
                query = query.or(`client_id.in.(${clientIds.join(",")}),created_by.eq.${user.id}`)
            } else {
                // No client linked — only show events they created
                query = query.eq("created_by", user.id)
            }
        } else {
            // Admin/contador: show team events + own personal events
            query = query.or(`visibility.eq.team,created_by.eq.${user.id}`)
        }

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ data: data || [] })
    } catch (error) {
        console.error("Error fetching events:", error)
        return NextResponse.json({ error: "Error al obtener eventos" }, { status: 500 })
    }
}

// POST — Create a new event
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const userData = await getUserRole(user.id)
        const body = await request.json()

        const { title, description, start_date, end_date, all_day, event_type, color, client_id, client_name, visibility } = body

        if (!title || !start_date || !end_date) {
            return NextResponse.json({ error: "title, start_date y end_date requeridos" }, { status: 400 })
        }

        const adminClient = createAdminClient()

        const { data, error } = await adminClient
            .from("calendar_events")
            .insert({
                title,
                description: description || null,
                start_date,
                end_date,
                all_day: all_day || false,
                event_type: event_type || "manual",
                color: color || "#6366f1",
                client_id: client_id || null,
                client_name: client_name || null,
                visibility: visibility || "team",
                created_by: user.id,
                user_name: userData.fullName,
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error) {
        console.error("Error creating event:", error)
        return NextResponse.json({ error: "Error al crear evento" }, { status: 500 })
    }
}

// PATCH — Update an event
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const body = await request.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

        const adminClient = createAdminClient()

        // Check ownership or admin
        const userData = await getUserRole(user.id)
        const { data: existing } = await adminClient
            .from("calendar_events")
            .select("created_by, event_type")
            .eq("id", id)
            .single()

        if (!existing) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 })

        // Only owner or admin can edit; vacation events are managed by the system
        if (existing.created_by !== user.id && userData.role !== "admin") {
            return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
        }

        if (existing.event_type === "vacation") {
            return NextResponse.json({ error: "Los eventos de vacaciones no se pueden editar directamente" }, { status: 400 })
        }

        const { data, error } = await adminClient
            .from("calendar_events")
            .update(updates)
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error) {
        console.error("Error updating event:", error)
        return NextResponse.json({ error: "Error al actualizar evento" }, { status: 500 })
    }
}

// DELETE — Delete an event
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const { id } = await request.json()
        if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

        const adminClient = createAdminClient()
        const userData = await getUserRole(user.id)

        // Check ownership or admin
        const { data: existing } = await adminClient
            .from("calendar_events")
            .select("created_by, event_type")
            .eq("id", id)
            .single()

        if (!existing) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 })

        if (existing.created_by !== user.id && userData.role !== "admin") {
            return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
        }

        const { error } = await adminClient
            .from("calendar_events")
            .delete()
            .eq("id", id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting event:", error)
        return NextResponse.json({ error: "Error al eliminar evento" }, { status: 500 })
    }
}
