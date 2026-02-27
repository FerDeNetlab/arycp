import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"
import { logActivity } from "@/lib/activity"
import { getErrorMessage } from "@/lib/api/errors"

type FileType = "emitidos" | "recibidos" | "iva_trasladado" | "iva_acreditable"

interface ParsedExcelData {
    type: FileType
    total: number
    subtotal: number
    iva: number
    count: number
}

function detectFileType(fileName: string): FileType {
    const lower = fileName.toLowerCase()
    if (lower.includes("trasladado")) return "iva_trasladado"
    if (lower.includes("acreditable")) return "iva_acreditable"
    if (lower.includes("emitido")) return "emitidos"
    return "recibidos"
}

function parseEZAuditaExcel(buffer: ArrayBuffer, fileName: string): ParsedExcelData {
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

    const type = detectFileType(fileName)

    let totalSum = 0
    let subtotalSum = 0
    let ivaSum = 0

    const num = (v: unknown): number => parseFloat(String(v ?? "")) || 0

    for (const row of data) {
        if (type === "iva_trasladado") {
            // IVA Trasladado file: use "IVA total" or "IVA 16%" for IVA, "Base IVA 16%" for base
            ivaSum += num(row["IVA total"]) || num(row["IVA 16%"])
            subtotalSum += num(row["Base IVA 16%"])
            totalSum += num(row["Total"])
        } else if (type === "iva_acreditable") {
            // IVA Acreditable file: use "IVA acreditable total" or "IVA 16%" for IVA, "Base IVA 16%" for base
            ivaSum += num(row["IVA acreditable total"]) || num(row["IVA 16%"])
            subtotalSum += num(row["Base IVA 16%"]) || num(row["Base IVA 8%"])
            totalSum += num(row["Total"])
        } else {
            // Emitidos/Recibidos files
            totalSum += num(row["Total"])
            // "Base de IVA traslado" is the net income that matches EZAudita's "Ingresos netos"
            subtotalSum += num(row["Base de IVA traslado"]) || num(row["Neto"]) || num(row["Subtotal"])
            ivaSum += num(row["Importe IVA traslado"]) || num(row["Traslado IVA"])
        }
    }

    return {
        type,
        total: Math.round(totalSum * 100) / 100,
        subtotal: Math.round(subtotalSum * 100) / 100,
        iva: Math.round(ivaSum * 100) / 100,
        count: data.length,
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createAdminClient()

        // Verify auth — get user from server client, check role via admin
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const { data: userRecord } = await supabase
            .from("system_users")
            .select("role")
            .eq("auth_user_id", user.id)
            .single()

        if (!userRecord || (userRecord.role !== "admin" && userRecord.role !== "contador")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }
        const formData = await request.formData()
        const clientId = formData.get("clientId") as string
        const year = parseInt(formData.get("year") as string)
        const month = parseInt(formData.get("month") as string)
        const userId = formData.get("userId") as string

        if (!clientId || !year || !month || !userId) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
        }

        // Get all uploaded files
        const files: File[] = []
        for (const [key, value] of formData.entries()) {
            if (key.startsWith("file") && value instanceof File) {
                files.push(value)
            }
        }

        if (files.length === 0) {
            return NextResponse.json({ error: "No se subieron archivos" }, { status: 400 })
        }

        // Parse all Excel files
        let totalEmitidos = 0
        let totalRecibidos = 0
        let ivaEmitidos = 0
        let ivaRecibidos = 0
        let numEmitidas = 0
        let numRecibidas = 0
        let ivaTrasladado = 0
        let ivaAcreditable = 0
        let hasIvaFiles = false

        for (const file of files) {
            const buffer = await file.arrayBuffer()
            const parsed = parseEZAuditaExcel(buffer, file.name)

            switch (parsed.type) {
                case "emitidos":
                    // Use subtotal ("Base de IVA traslado") = net income matching EZAudita
                    totalEmitidos += parsed.subtotal
                    ivaEmitidos += parsed.iva
                    numEmitidas += parsed.count
                    break
                case "recibidos":
                    // Use subtotal ("Neto") for expenses
                    totalRecibidos += parsed.subtotal
                    ivaRecibidos += parsed.iva
                    numRecibidas += parsed.count
                    break
                case "iva_trasladado":
                    // Use iva ("IVA total") from the IVA trasladado file
                    ivaTrasladado += parsed.iva
                    hasIvaFiles = true
                    break
                case "iva_acreditable":
                    // Use iva ("IVA acreditable total") from the IVA acreditable file
                    ivaAcreditable += parsed.iva
                    hasIvaFiles = true
                    break
            }
        }

        // Check if declaration already exists for this month
        const { data: existing } = await supabase
            .from("monthly_declarations")
            .select("*")
            .eq("client_id", clientId)
            .eq("year", year)
            .eq("month", month)
            .maybeSingle()

        // Track which file types were uploaded
        const hasEmitidos = numEmitidas > 0
        const hasRecibidos = numRecibidas > 0

        // Merge with existing data — only overwrite fields that were actually imported
        const mergedInvoiced = hasEmitidos ? totalEmitidos : (existing?.invoiced_amount || 0)
        const mergedExpenses = hasRecibidos ? totalRecibidos : (existing?.expenses_amount || 0)
        const mergedIvaEmitidos = hasIvaFiles ? ivaTrasladado : (hasEmitidos ? ivaEmitidos : (existing?.iva_emitidos || 0))
        const mergedIvaRecibidos = hasIvaFiles ? ivaAcreditable : (hasRecibidos ? ivaRecibidos : (existing?.iva_recibidos || 0))
        const mergedNumEmitidas = hasEmitidos ? numEmitidas : (existing?.num_facturas_emitidas || 0)
        const mergedNumRecibidas = hasRecibidos ? numRecibidas : (existing?.num_facturas_recibidas || 0)

        // Recalculate derived values from merged data
        const grossProfit = Math.round((mergedInvoiced - mergedExpenses) * 100) / 100
        const ivaBalance = Math.round((mergedIvaEmitidos - mergedIvaRecibidos) * 100) / 100

        const declarationData = {
            client_id: clientId,
            user_id: userId,
            year,
            month,
            invoiced_amount: mergedInvoiced,
            expenses_amount: mergedExpenses,
            iva_emitidos: mergedIvaEmitidos,
            iva_recibidos: mergedIvaRecibidos,
            num_facturas_emitidas: mergedNumEmitidas,
            num_facturas_recibidas: mergedNumRecibidas,
            gross_profit: grossProfit,
            iva_balance: ivaBalance,
        }

        if (existing?.id) {
            const { error } = await supabase
                .from("monthly_declarations")
                .update(declarationData)
                .eq("id", existing.id)

            if (error) throw error
        } else {
            const { error } = await supabase
                .from("monthly_declarations")
                .insert(declarationData)

            if (error) throw error
        }

        // Log activity
        const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
        const { data: sysUser } = await supabase.from("system_users").select("full_name").eq("auth_user_id", userId).single()
        const { data: client } = await supabase.from("clients").select("business_name").eq("id", clientId).single()
        await logActivity({
            userId,
            userName: sysUser?.full_name || "Usuario",
            clientId,
            clientName: client?.business_name || "",
            module: "accounting",
            action: "imported",
            entityType: "declaration",
            description: `${sysUser?.full_name || "Usuario"} importó datos de contabilidad para ${MONTHS[month - 1]} ${year} (${files.length} archivo${files.length > 1 ? "s" : ""})`,
            metadata: { fileNames: files.map(f => f.name), totalEmitidos, totalRecibidos, ivaBalance },
        })

        return NextResponse.json({
            success: true,
            data: {
                totalEmitidos,
                totalRecibidos,
                ivaEmitidos: hasIvaFiles ? ivaTrasladado : ivaEmitidos,
                ivaRecibidos: hasIvaFiles ? ivaAcreditable : ivaRecibidos,
                ivaTrasladado,
                ivaAcreditable,
                numEmitidas,
                numRecibidas,
                grossProfit,
                ivaBalance,
            },
        })
    } catch (error: unknown) {
        console.error("Error importing Excel:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
