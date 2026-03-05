import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/api/auth"
import { getErrorMessage } from "@/lib/api/errors"

export async function GET(request: Request) {
    try {
        const auth = await requireAuth()
        if ("error" in auth) return auth.error
        const { supabase } = auth

        const { searchParams } = new URL(request.url)
        const clientId = searchParams.get("clientId")
        const year = searchParams.get("year")

        if (!clientId || !year) {
            return NextResponse.json({ error: "clientId y year son requeridos" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("diot_records")
            .select("*")
            .eq("client_id", clientId)
            .eq("year", parseInt(year))
            .order("month", { ascending: true })

        if (error) throw error

        return NextResponse.json({ data: data || [] })
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const auth = await requireRole(["admin", "contador"])
        if ("error" in auth) return auth.error
        const { user, supabase } = auth

        const formData = await request.formData()
        const clientId = formData.get("clientId") as string
        const year = parseInt(formData.get("year") as string)
        const month = parseInt(formData.get("month") as string)
        const status = formData.get("status") as string // presentado_con_datos, presentado_sin_datos, no_presentado
        const notes = formData.get("notes") as string | null
        const folioNumber = formData.get("folioNumber") as string | null
        const pdfFile = formData.get("pdf") as File | null

        if (!clientId || !year || !month || !status) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
        }

        let pdfUrl: string | null = null
        let pdfName: string | null = null
        let extractedFolio: string | null = folioNumber || null

        // Upload PDF if provided
        if (pdfFile && pdfFile.size > 0) {
            const filePath = `${user.id}/${clientId}/diot/${year}/${month}/${Date.now()}.pdf`
            const buffer = Buffer.from(await pdfFile.arrayBuffer())

            const { error: uploadError } = await supabase.storage
                .from("client-documents")
                .upload(filePath, buffer, { contentType: "application/pdf" })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from("client-documents")
                .getPublicUrl(filePath)

            pdfUrl = publicUrl
            pdfName = pdfFile.name

            // Try to extract folio from PDF if not provided manually
            if (!extractedFolio) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    const pdfParse = require("pdf-parse")
                    const pdfData = await pdfParse(buffer)
                    const text = pdfData.text

                    // Look for "Número de operación:" pattern
                    const folioMatch = text.match(/N[uú]mero\s+de\s+operaci[oó]n[:\s]+(\d+)/i)
                    if (folioMatch) {
                        extractedFolio = folioMatch[1]
                    }
                } catch (parseErr) {
                    console.error("Error parsing DIOT PDF:", parseErr)
                    // Non-fatal — continue without folio
                }
            }
        }

        // Check if record already exists for this month
        const { data: existing } = await supabase
            .from("diot_records")
            .select("id")
            .eq("client_id", clientId)
            .eq("year", year)
            .eq("month", month)
            .single()

        const recordData = {
            client_id: clientId,
            user_id: user.id,
            year,
            month,
            status,
            folio_number: extractedFolio,
            pdf_url: pdfUrl,
            pdf_name: pdfName,
            notes: notes || null,
        }

        if (existing?.id) {
            // Update — keep existing PDF if no new one uploaded
            const updateData = { ...recordData }
            if (!pdfUrl) {
                delete (updateData as Record<string, unknown>).pdf_url
                delete (updateData as Record<string, unknown>).pdf_name
            }
            if (!extractedFolio) {
                delete (updateData as Record<string, unknown>).folio_number
            }

            const { error } = await supabase
                .from("diot_records")
                .update(updateData)
                .eq("id", existing.id)

            if (error) throw error
        } else {
            const { error } = await supabase
                .from("diot_records")
                .insert(recordData)

            if (error) throw error
        }

        return NextResponse.json({
            success: true,
            folioNumber: extractedFolio,
        })
    } catch (error: unknown) {
        console.error("Error saving DIOT record:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
