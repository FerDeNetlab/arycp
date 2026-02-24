import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { logActivity } from "@/lib/activity"
import * as XLSX from "xlsx"

export async function POST(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const supabase = createAdminClient()

        // Verify user role
        const { data: sysUser } = await supabase
            .from("system_users")
            .select("role, full_name")
            .eq("auth_user_id", user.id)
            .single()

        if (!sysUser || (sysUser.role !== "admin" && sysUser.role !== "contador")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const formData = await request.formData()
        const clientId = formData.get("clientId") as string
        const file = formData.get("file") as File

        if (!clientId || !file) {
            return NextResponse.json({ error: "clientId y archivo son requeridos" }, { status: 400 })
        }

        // Read Excel file
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, dateNF: "yyyy-mm-dd" })

        // Find header row (look for "Fecha" or "Serie" in first few rows)
        let headerIdx = -1
        for (let i = 0; i < Math.min(10, rawRows.length); i++) {
            const row = rawRows[i]
            if (row && row.some((cell: any) => {
                const s = String(cell || "").toLowerCase()
                return s === "fecha" || s === "serie" || s === "folio"
            })) {
                headerIdx = i
                break
            }
        }

        if (headerIdx === -1) {
            return NextResponse.json({ error: "No se encontró la fila de encabezados (Fecha, Serie, Folio...)" }, { status: 400 })
        }

        const headers = rawRows[headerIdx].map((h: any) => String(h || "").trim().toLowerCase())
        const dataRows = rawRows.slice(headerIdx + 1).filter(row => row && row.length > 0 && row[0] != null)

        // Map column indices
        const colMap = {
            fecha: headers.findIndex(h => h === "fecha"),
            serie: headers.findIndex(h => h === "serie"),
            folio: headers.findIndex(h => h === "folio"),
            cancelado: headers.findIndex(h => h === "cancelado"),
            razonSocial: headers.findIndex(h => h.includes("razón social") || h.includes("razon social")),
            total: headers.findIndex(h => h === "total"),
            pendiente: headers.findIndex(h => h === "pendiente"),
            uuid: headers.findIndex(h => h === "uuid"),
            uuidDesc: headers.findIndex(h => h.includes("uuid descripción") || h.includes("uuid descripcion")),
            metodoPago: headers.findIndex(h => h.includes("método de pago") || h.includes("metodo de pago")),
        }

        if (colMap.fecha === -1 || colMap.razonSocial === -1) {
            return NextResponse.json({
                error: "Columnas requeridas no encontradas. Se necesita al menos: Fecha, Razón Social",
                headers: headers,
            }, { status: 400 })
        }

        // Parse rows into invoice records
        const invoices: any[] = []
        let skipped = 0

        for (const row of dataRows) {
            const rawDate = colMap.fecha >= 0 ? row[colMap.fecha] : null
            const recipientName = colMap.razonSocial >= 0 ? String(row[colMap.razonSocial] || "").trim() : ""

            if (!recipientName) {
                skipped++
                continue
            }

            // Parse date
            let issueDate: string | null = null
            if (rawDate instanceof Date) {
                issueDate = rawDate.toISOString().split("T")[0]
            } else if (typeof rawDate === "number") {
                // Excel serial date
                const d = XLSX.SSF.parse_date_code(rawDate)
                issueDate = `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`
            } else if (typeof rawDate === "string" && rawDate.trim()) {
                issueDate = rawDate.trim().substring(0, 10)
            }

            const cancelado = colMap.cancelado >= 0 ? row[colMap.cancelado] : 0
            const isCancelled = cancelado === 1 || cancelado === "1" || cancelado === true || String(cancelado).toLowerCase() === "true"

            const total = colMap.total >= 0 ? parseFloat(String(row[colMap.total] || "0")) || 0 : 0
            const pending = colMap.pendiente >= 0 ? parseFloat(String(row[colMap.pendiente] || "0")) || 0 : 0
            const paymentMethod = colMap.metodoPago >= 0 ? String(row[colMap.metodoPago] || "").trim() : ""

            invoices.push({
                client_id: clientId,
                agent_name: null,
                issue_date: issueDate || new Date().toISOString().split("T")[0],
                serie: colMap.serie >= 0 ? String(row[colMap.serie] || "CFDI").trim() : "CFDI",
                folio: colMap.folio >= 0 ? (parseInt(String(row[colMap.folio])) || null) : null,
                recipient_name: recipientName,
                total,
                pending_amount: pending,
                payment_method: paymentMethod,
                uuid_sat: colMap.uuid >= 0 ? String(row[colMap.uuid] || "").trim() : null,
                status: isCancelled ? "cancelado" : "vigente",
                notes: null,
                created_by: user.id,
            })
        }

        if (invoices.length === 0) {
            return NextResponse.json({ error: "No se encontraron facturas válidas en el archivo" }, { status: 400 })
        }

        // Bulk insert
        const { error: insertError } = await supabase
            .from("invoices")
            .insert(invoices)

        if (insertError) throw insertError

        // Log activity
        const { data: client } = await supabase.from("clients").select("business_name").eq("id", clientId).single()
        await logActivity({
            userId: user.id,
            userName: sysUser.full_name || "Usuario",
            clientId,
            clientName: client?.business_name || "",
            module: "invoicing",
            action: "excel_import",
            entityType: "invoice",
            description: `${sysUser.full_name} importó ${invoices.length} facturas desde Excel para ${client?.business_name || clientId}`,
        })

        return NextResponse.json({
            success: true,
            imported: invoices.length,
            skipped,
            totalAmount: invoices.reduce((s, i) => s + i.total, 0),
        })
    } catch (error: any) {
        console.error("Error importing invoices:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
