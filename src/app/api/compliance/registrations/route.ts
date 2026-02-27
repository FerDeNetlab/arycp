import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/api/auth"
import { getErrorMessage } from "@/lib/api/errors"
import { createNotification } from "@/lib/activity"

export async function GET(request: Request) {
    try {
        const auth = await requireAuth()
        if ("error" in auth) return auth.error
        const { supabase } = auth

        const { searchParams } = new URL(request.url)
        const clientId = searchParams.get("clientId")

        if (!clientId) return NextResponse.json({ error: "clientId requerido" }, { status: 400 })

        const { data, error } = await supabase
            .from("company_registrations")
            .select("*")
            .eq("client_id", clientId)
            .order("type", { ascending: true })
            .order("expiration_date", { ascending: true })

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const auth = await requireRole(["admin", "contador"])
        if ("error" in auth) return auth.error
        const { user, sysUser, supabase } = auth

        const body = await request.json()
        const {
            clientId, type, label, registrationNumber,
            issuedDate, expirationDate, status, notes
        } = body

        if (!clientId || !label) {
            return NextResponse.json({ error: "clientId y label son requeridos" }, { status: 400 })
        }

        const { data, error } = await supabase.from("company_registrations").insert({
            client_id: clientId,
            type: type || "otro",
            label,
            registration_number: registrationNumber || null,
            issued_date: issuedDate || null,
            expiration_date: expirationDate || null,
            status: status || "vigente",
            notes: notes || null,
            created_by: user.id,
        }).select().single()

        if (error) throw error

        // Notify admin users about the new registration
        try {
            const { data: admins } = await supabase
                .from("system_users")
                .select("auth_user_id")
                .eq("role", "admin")

            for (const admin of admins || []) {
                if (admin.auth_user_id !== user.id) {
                    await createNotification({
                        userId: admin.auth_user_id,
                        fromUserId: user.id,
                        fromUserName: sysUser.full_name,
                        type: "info",
                        title: `Nuevo registro: ${label}`,
                        message: `${sysUser.full_name} registró "${label}" (${type}) con vencimiento ${expirationDate || "sin fecha"}.`,
                        module: "compliance",
                        entityType: "registration",
                        entityId: data.id,
                    })
                }
            }
        } catch (notifErr) {
            console.error("Error sending notifications:", notifErr)
        }

        return NextResponse.json({ data })
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const auth = await requireRole(["admin", "contador"])
        if ("error" in auth) return auth.error
        const { supabase } = auth

        const body = await request.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

        const fieldMap: Record<string, string> = {
            registrationNumber: "registration_number",
            issuedDate: "issued_date",
            expirationDate: "expiration_date",
        }

        const dbUpdates: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(updates)) {
            const dbKey = fieldMap[key] || key
            dbUpdates[dbKey] = value
        }
        dbUpdates.updated_at = new Date().toISOString()

        const { data, error } = await supabase
            .from("company_registrations")
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
        const auth = await requireRole(["admin", "contador"])
        if ("error" in auth) return auth.error
        const { supabase } = auth

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

        const { error } = await supabase
            .from("company_registrations")
            .delete()
            .eq("id", id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
