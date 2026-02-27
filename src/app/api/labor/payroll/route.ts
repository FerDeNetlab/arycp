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
            .from("labor_payroll")
            .select("*")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false })

        if (error) throw error
        return NextResponse.json({ data: data || [] })
    } catch (error: unknown) {
        console.error("Error fetching payrolls:", error)
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

        const { data, error } = await supabase.from("labor_payroll").insert({
            client_id: body.client_id,
            user_id: user.id,
            payroll_type: body.payroll_type,
            period: body.period,
            status: body.status || "pendiente",
            comments: body.comments || null,
            stamping_day: body.stamping_day || null,
            has_subsidy: body.has_subsidy || false,
            has_aguinaldo: body.has_aguinaldo || false,
            aguinaldo_sent: body.aguinaldo_sent || false,
        }).select().single()

        if (error) throw error
        return NextResponse.json({ data })
    } catch (error: unknown) {
        console.error("Error creating payroll:", error)
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
            .from("labor_payroll")
            .update(updates)
            .eq("id", id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        console.error("Error updating payroll:", error)
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
        const { error } = await supabase.from("labor_payroll").delete().eq("id", id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        console.error("Error deleting payroll:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
