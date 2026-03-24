import { NextResponse } from "next/server"
import { requireAuth, requireRole } from "@/lib/api/auth"
import { getErrorMessage } from "@/lib/api/errors"

// Force Node.js runtime for PDF parsing
export const runtime = "nodejs"

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
        const status = formData.get("status") as string
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

            // Extract folio from PDF using unpdf (same lib used in compliance/parse-pdf)
            if (!extractedFolio) {
                try {
                    const { extractText } = await import("unpdf")
                    const { text } = await extractText(new Uint8Array(buffer))
                    const fullText = Array.isArray(text) ? text.join("\n") : text


                    const patterns = [
                        /N[u\u00fa]mero\s*de\s*operaci[o\u00f3]n[:\s]*(\d+)/i,
                        /operaci[o\u00f3]n[:\s]*(\d{6,})/i,
                        /folio[:\s]*(\d{6,})/i,
                    ]

                    for (const pattern of patterns) {
                        const match = fullText.match(pattern)
                        if (match) {
                            extractedFolio = match[1]
                            break
                        }
                    }

                    // Fallback: any 12+ digit number
                    if (!extractedFolio) {
                        const longNum = fullText.match(/\b(\d{12,})\b/)
                        if (longNum) {
                            extractedFolio = longNum[1]
                        }
                    }
                } catch (parseErr) {
                    console.error("[DIOT] PDF parse error:", parseErr)
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

        const recordData: Record<string, unknown> = {
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

        // Clear assignment when DIOT is submitted (presentado)
        if (status === "presentado_con_datos" || status === "presentado_sin_datos") {
            recordData.assigned_to = null
            recordData.assigned_to_name = null
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
