import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { logActivity } from "@/lib/activity"
import { getErrorMessage } from "@/lib/api/errors"

export async function GET(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const clientId = searchParams.get("clientId")
        const year = searchParams.get("year")
        const month = searchParams.get("month")

        if (!clientId) return NextResponse.json({ error: "clientId requerido" }, { status: 400 })

        const supabase = createAdminClient()

        let query = supabase
            .from("invoice_cancellations")
            .select("*")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false })

        if (year && month) {
            const startDate = `${year}-${month.padStart(2, "0")}-01`
            const endMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
            const endYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
            const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`
            query = query.gte("request_date", startDate).lt("request_date", endDate)
        }

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ data })
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const supabase = createAdminClient()

        const { data: sysUser } = await supabase
            .from("system_users")
            .select("role, full_name")
            .eq("auth_user_id", user.id)
            .single()

        if (!sysUser || (sysUser.role !== "admin" && sysUser.role !== "contador")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const body = await request.json()
        const {
            clientId, companyName, folioType, folioNumber, issueDate,
            recipientName, requestDate, systemStatus, satStatus,
            statusNotes, firstReceiptSent, secondReceiptSent,
            uuidSat, cancellationReason, replacementCfdi
        } = body

        if (!clientId) {
            return NextResponse.json({ error: "clientId requerido" }, { status: 400 })
        }

        const { data, error } = await supabase.from("invoice_cancellations").insert({
            client_id: clientId,
            company_name: companyName || null,
            folio_type: folioType || "cfdi",
            folio_number: folioNumber || null,
            issue_date: issueDate || null,
            recipient_name: recipientName || null,
            request_date: requestDate || new Date().toISOString().split("T")[0],
            system_status: systemStatus || "pendiente",
            sat_status: satStatus || null,
            status_notes: statusNotes || null,
            first_receipt_sent: firstReceiptSent || null,
            second_receipt_sent: secondReceiptSent || null,
            uuid_sat: uuidSat || null,
            cancellation_reason: cancellationReason || null,
            replacement_cfdi: replacementCfdi || null,
            created_by: user.id,
        }).select().single()

        if (error) throw error

        const { data: client } = await supabase.from("clients").select("business_name").eq("id", clientId).single()
        await logActivity({
            userId: user.id,
            userName: sysUser.full_name || "Usuario",
            clientId,
            clientName: client?.business_name || "",
            module: "invoicing",
            action: "created",
            entityType: "cancellation",
            description: `${sysUser.full_name} registró cancelación de ${folioType?.toUpperCase() || "CFDI"} ${folioNumber || ""} para ${recipientName || companyName || ""}`,
        })

        return NextResponse.json({ data })
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const supabase = createAdminClient()

        const { data: sysUser } = await supabase
            .from("system_users")
            .select("role, full_name")
            .eq("auth_user_id", user.id)
            .single()

        if (!sysUser || (sysUser.role !== "admin" && sysUser.role !== "contador")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const body = await request.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

        // Map camelCase to snake_case for the update
        const dbUpdates: Record<string, unknown> = {}
        const fieldMap: Record<string, string> = {
            companyName: "company_name",
            folioType: "folio_type",
            folioNumber: "folio_number",
            issueDate: "issue_date",
            recipientName: "recipient_name",
            requestDate: "request_date",
            systemStatus: "system_status",
            satStatus: "sat_status",
            statusNotes: "status_notes",
            firstReceiptSent: "first_receipt_sent",
            secondReceiptSent: "second_receipt_sent",
            uuidSat: "uuid_sat",
            cancellationReason: "cancellation_reason",
            replacementCfdi: "replacement_cfdi",
        }

        for (const [key, value] of Object.entries(updates)) {
            const dbKey = fieldMap[key] || key
            dbUpdates[dbKey] = value
        }

        const { data, error } = await supabase
            .from("invoice_cancellations")
            .update(dbUpdates)
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const supabase = createAdminClient()

        const { data: sysUser } = await supabase
            .from("system_users")
            .select("role, full_name")
            .eq("auth_user_id", user.id)
            .single()

        if (!sysUser || (sysUser.role !== "admin" && sysUser.role !== "contador")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

        const { error } = await supabase
            .from("invoice_cancellations")
            .delete()
            .eq("id", id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
