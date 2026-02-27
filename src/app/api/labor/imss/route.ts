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
        if (!clientId) {
            return NextResponse.json({ error: "clientId requerido" }, { status: 400 })
        }

        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from("labor_imss")
            .select("*")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false })

        if (error) throw error
        return NextResponse.json({ data: data || [] })
    } catch (error: unknown) {
        console.error("Error fetching IMSS movements:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const body = await request.json()
        const supabase = createAdminClient()

        const { data, error } = await supabase.from("labor_imss").insert({
            client_id: body.client_id,
            user_id: user.id,
            employee_name: body.employee_name,
            movement_type: body.movement_type,
            month: body.month,
            year: body.year,
            comments: body.comments || null,
            performed_by: body.performed_by || null,
            confirmed: body.confirmed || false,
            request_date: body.request_date || null,
            patron_registration: body.patron_registration || null,
            incapacity_type: body.incapacity_type || null,
            folios: body.folios || null,
            integrated_salary: body.integrated_salary || null,
            requested_by: body.requested_by || null,
            request_medium: body.request_medium || null,
        }).select().single()

        if (error) throw error
        return NextResponse.json({ data })
    } catch (error: unknown) {
        console.error("Error creating IMSS movement:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json({ error: "ID requerido" }, { status: 400 })
        }

        const supabase = createAdminClient()
        const { error } = await supabase
            .from("labor_imss")
            .update(updates)
            .eq("id", id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        console.error("Error updating IMSS movement:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json({ error: "ID requerido" }, { status: 400 })
        }

        const supabase = createAdminClient()
        const { error } = await supabase.from("labor_imss").delete().eq("id", id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        console.error("Error deleting IMSS movement:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
