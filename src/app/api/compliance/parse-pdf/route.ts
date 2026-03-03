import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force Node.js runtime (pdfjs-dist needs it)
export const runtime = "nodejs"

// --- Regex patterns for Mexican government documents ---

// RFC: 3-4 uppercase letters + 6 digits + 3 alphanumeric (homoclave)
const RFC_REGEX = /\b([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})\b/g

// IMSS Registro Patronal: letter + 2 digits + dash + 5 digits + dash + 2 digits + dash + 1 digit
const REGISTRO_PATRONAL_REGEX = /\b([A-Z]\d{2}[-\s]?\d{5}[-\s]?\d{2}[-\s]?\d)\b/g

// Date patterns
const DATE_PATTERNS = [
    // DD/MM/YYYY or DD-MM-YYYY
    {
        regex: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g,
        parse: (m: RegExpMatchArray) => {
            const day = parseInt(m[1]), month = parseInt(m[2]), year = parseInt(m[3])
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2000 && year <= 2040) {
                return new Date(year, month - 1, day)
            }
            return null
        }
    },
    // YYYY-MM-DD (ISO)
    {
        regex: /\b(\d{4})-(\d{2})-(\d{2})\b/g,
        parse: (m: RegExpMatchArray) => {
            const year = parseInt(m[1]), month = parseInt(m[2]), day = parseInt(m[3])
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2000 && year <= 2040) {
                return new Date(year, month - 1, day)
            }
            return null
        }
    },
    // "DD de MONTH de YYYY" (Spanish)
    {
        regex: /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de\s+|del?\s+)?(\d{4})\b/gi,
        parse: (m: RegExpMatchArray) => {
            const months: Record<string, number> = {
                enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
                julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
            }
            const day = parseInt(m[1])
            const month = months[m[2].toLowerCase()]
            const year = parseInt(m[3])
            if (month !== undefined && day >= 1 && day <= 31 && year >= 2000 && year <= 2040) {
                return new Date(year, month, day)
            }
            return null
        }
    },
]

// Keywords near dates that hint at their meaning
const EXPIRATION_KEYWORDS = /vigencia|vence|vencimiento|expira|caduca|válido?\s+hasta|validez|termina|fenece/i
const ISSUED_KEYWORDS = /emisi[oó]n|emitid[oa]|expedid[oa]|fecha\s+de\s+expedici[oó]n|otorgad[oa]|registrad[oa]|ciudad\s+de/i
// Dates near these keywords are legal references, not document dates — skip them
const BOILERPLATE_KEYWORDS = /diario\s+oficial|publicado\s+en|acuerdos?\s+modificatorio|disposiciones|d\.?o\.?f\.?/i

function toISODate(d: Date): string {
    return d.toISOString().split("T")[0]
}

interface ExtractedDate {
    date: Date
    context: string // surrounding text for heuristic classification
    lineIndex: number
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    const { extractText } = await import("unpdf")
    const uint8Array = new Uint8Array(buffer)
    const { text } = await extractText(uint8Array)
    return Array.isArray(text) ? text.join("\n") : text
}

export async function POST(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "Archivo PDF requerido" }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        let text = ""
        try {
            text = await extractTextFromPdf(buffer)
        } catch (pdfError: unknown) {
            const msg = pdfError instanceof Error ? pdfError.message : String(pdfError)
            console.error("PDF parse error:", msg)
            return NextResponse.json(
                { error: `No se pudo leer el PDF: ${msg}` },
                { status: 400 }
            )
        }

        if (text.trim().length < 20) {
            return NextResponse.json(
                { error: "El PDF parece ser una imagen escaneada. No se pudo extraer texto." },
                { status: 400 }
            )
        }

        // --- Extract RFC ---
        const rfcMatches = [...text.matchAll(RFC_REGEX)]
        const rfcs = [...new Set(rfcMatches.map(m => m[1]))]
        const rfc = rfcs[0] || ""

        // --- Extract Registro Patronal ---
        const rpMatches = [...text.matchAll(REGISTRO_PATRONAL_REGEX)]
        const registroPatronal = rpMatches[0]?.[1]?.replace(/\s/g, "-") || ""

        // --- Extract Folio / Acuerdo / Registration number ---
        let folioNumber = ""
        const folioPatterns = [
            /(?:no\.?\s*de\s*folio(?:\s*de\s*ingreso)?|folio)[:\s]+([\d]+)/i,
            /(?:no\.?\s*de\s*acuerdo|acuerdo\s*(?:no\.?|número))[:\s]+([A-Z0-9\/\-]+)/i,
            /(?:registro\s*(?:no\.?|número))[:\s]+([A-Z0-9\/\-]+)/i,
        ]
        for (const fp of folioPatterns) {
            const folioMatch = text.match(fp)
            if (folioMatch?.[1]) {
                folioNumber = folioMatch[1].trim()
                break
            }
        }

        // --- Extract dates with context ---
        const lines = text.split("\n")
        const extractedDates: ExtractedDate[] = []

        for (let i = 0; i < lines.length; i++) {
            const lineText = lines[i]
            // Get surrounding context (2 lines before and after)
            const contextStart = Math.max(0, i - 2)
            const contextEnd = Math.min(lines.length - 1, i + 2)
            const context = lines.slice(contextStart, contextEnd + 1).join(" ")

            // Skip dates that appear in legal boilerplate (DOF references, etc.)
            if (BOILERPLATE_KEYWORDS.test(context)) continue

            for (const pattern of DATE_PATTERNS) {
                // Reset regex
                pattern.regex.lastIndex = 0
                let match
                while ((match = pattern.regex.exec(lineText)) !== null) {
                    const date = pattern.parse(match)
                    if (date && !isNaN(date.getTime())) {
                        extractedDates.push({ date, context, lineIndex: i })
                    }
                }
            }
        }

        // --- Classify dates ---
        let issuedDate = ""
        let expirationDate = ""

        if (extractedDates.length === 1) {
            // Single date: check context to guess if it's issued or expiration
            const d = extractedDates[0]
            const now = new Date()
            if (EXPIRATION_KEYWORDS.test(d.context) || d.date > now) {
                expirationDate = toISODate(d.date)
            } else {
                issuedDate = toISODate(d.date)
            }
        } else if (extractedDates.length >= 2) {
            // Try classifying by context keywords first
            const expirationByContext = extractedDates.find(d => EXPIRATION_KEYWORDS.test(d.context))
            const issuedByContext = extractedDates.find(d => ISSUED_KEYWORDS.test(d.context))

            if (expirationByContext) {
                expirationDate = toISODate(expirationByContext.date)
            }
            if (issuedByContext) {
                issuedDate = toISODate(issuedByContext.date)
            }

            // Fallback: use earliest as issued, latest as expiration
            if (!issuedDate || !expirationDate) {
                const sorted = [...extractedDates].sort((a, b) => a.date.getTime() - b.date.getTime())
                if (!issuedDate) issuedDate = toISODate(sorted[0].date)
                if (!expirationDate && sorted.length > 1) expirationDate = toISODate(sorted[sorted.length - 1].date)
            }
        }

        // --- Extract a name (look for common patterns) ---
        let name = ""
        const namePatterns = [
            /raz[oó]n\s+social[:\s]+(.+)/i,
            /(?:persona|Persona)[:\s]*\(?(?:Moral|Física|moral|física)\)?\s+([A-ZÑ&\s]+(?:SA\s+DE\s+CV|S\.?A\.?\s+DE\s+C\.?V\.?|SC|AC|SRL|S\.?C\.?))/i,
            /(?:Moral|Física)\s+([A-ZÑ&\s]+(?:SA\s+DE\s+CV|S\.?A\.?\s+DE\s+C\.?V\.?|SC|AC|SRL|S\.?C\.?))/i,
            /denominaci[oó]n[:\s]+(.+)/i,
            /contribuyente[:\s]+(.+)/i,
            /patr[oó]n[:\s]+(.+)/i,
            /nombre[:\s]+(.+)/i,
        ]
        for (const np of namePatterns) {
            const nameMatch = text.match(np)
            if (nameMatch?.[1]) {
                name = nameMatch[1].trim().replace(/,\s*$/, "").substring(0, 120)
                break
            }
        }

        // --- Determine registration number (folio > registro patronal > RFC) ---
        const registrationNumber = folioNumber || registroPatronal || rfc

        // --- Detect type from content ---
        // IMPORTANT: REPSE must be checked BEFORE IMSS because REPSE documents often
        // mention "Seguro Social" in their legal boilerplate text
        let type = "otro"
        const textLower = text.toLowerCase()
        if (textLower.includes("repse") || textLower.includes("servicios especializados") || textLower.includes("obras especializadas") || textLower.includes("repse.stps") || textLower.includes("padrón público de contratistas") || textLower.includes("padron publico de contratistas") || textLower.includes("subcontratación") || textLower.includes("subcontratacion")) {
            type = "repse"
        } else if (textLower.includes("imss") || textLower.includes("seguro social") || registroPatronal) {
            type = "imss"
        } else if (textLower.includes("impuesto sobre nómina") || textLower.includes("impuesto sobre nomina") || textLower.includes("i.s.n") || textLower.includes(" isn ")) {
            type = "isn"
        } else if (textLower.includes("fonacot")) {
            type = "fonacot"
        } else if (textLower.includes("administración tributaria") || textLower.includes("servicio de administracion tributaria")) {
            type = "efirma"
        }

        const typeLabels: Record<string, string> = {
            efirma: "e.Firma", csd: "CSD", imss: "IMSS", isn: "ISN",
            fonacot: "FONACOT", repse: "REPSE", otro: "Otro",
        }

        return NextResponse.json({
            name,
            rfc,
            registrationNumber,
            issuedDate,
            expirationDate,
            type,
            label: `${typeLabels[type] || "Registro"} — ${name || rfc || "PDF"}`,
            suggested: true, // indicates these values are heuristic guesses
            datesFound: extractedDates.length,
            textPreview: text.substring(0, 300).trim(),
        })
    } catch (error: unknown) {
        console.error("Error parsing PDF:", error)
        return NextResponse.json(
            { error: "Error al procesar el archivo PDF." },
            { status: 400 }
        )
    }
}
