import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"

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
    const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet)

    const type = detectFileType(fileName)

    let totalSum = 0
    let subtotalSum = 0
    let ivaSum = 0

    for (const row of data) {
        const total = parseFloat(row["Total"]) || 0
        const subtotal = parseFloat(row["Neto"]) || parseFloat(row["Subtotal"]) || 0
        const iva = parseFloat(row["Traslado IVA"]) || parseFloat(row["IVA"]) || 0

        totalSum += total
        subtotalSum += subtotal
        ivaSum += iva
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
                    totalEmitidos += parsed.total
                    ivaEmitidos += parsed.iva
                    numEmitidas += parsed.count
                    break
                case "recibidos":
                    totalRecibidos += parsed.total
                    ivaRecibidos += parsed.iva
                    numRecibidas += parsed.count
                    break
                case "iva_trasladado":
                    ivaTrasladado += parsed.total || parsed.iva
                    hasIvaFiles = true
                    break
                case "iva_acreditable":
                    ivaAcreditable += parsed.total || parsed.iva
                    hasIvaFiles = true
                    break
            }
        }

        const grossProfit = Math.round((totalEmitidos - totalRecibidos) * 100) / 100
        // If dedicated IVA files are uploaded, use those for the balance; otherwise use IVA from income files
        const ivaBalance = hasIvaFiles
            ? Math.round((ivaTrasladado - ivaAcreditable) * 100) / 100
            : Math.round((ivaEmitidos - ivaRecibidos) * 100) / 100

        // Check if declaration already exists for this month
        const { data: existing } = await supabase
            .from("monthly_declarations")
            .select("id")
            .eq("client_id", clientId)
            .eq("year", year)
            .eq("month", month)
            .maybeSingle()

        const declarationData = {
            client_id: clientId,
            user_id: userId,
            year,
            month,
            invoiced_amount: totalEmitidos,
            expenses_amount: totalRecibidos,
            iva_emitidos: hasIvaFiles ? ivaTrasladado : ivaEmitidos,
            iva_recibidos: hasIvaFiles ? ivaAcreditable : ivaRecibidos,
            num_facturas_emitidas: numEmitidas,
            num_facturas_recibidas: numRecibidas,
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
    } catch (error: any) {
        console.error("Error importing Excel:", error)
        return NextResponse.json({ error: error.message || "Error al importar" }, { status: 500 })
    }
}
