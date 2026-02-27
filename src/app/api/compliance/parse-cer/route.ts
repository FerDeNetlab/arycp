import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "Archivo .cer requerido" }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        // Convert DER to PEM
        const base64 = buffer.toString("base64")
        const pem = `-----BEGIN CERTIFICATE-----\n${base64.match(/.{1,64}/g)!.join("\n")}\n-----END CERTIFICATE-----`

        // Parse with Node.js crypto
        const cert = new crypto.X509Certificate(pem)

        // Extract fields from the subject
        const subject = cert.subject
        const subjectFields: Record<string, string> = {}
        subject.split("\n").forEach(line => {
            const [key, ...vals] = line.split("=")
            if (key && vals.length) subjectFields[key.trim()] = vals.join("=").trim()
        })

        // Get name and RFC
        const name = subjectFields["CN"] || subjectFields["O"] || ""
        const rfc = subjectFields["x500UniqueIdentifier"] || ""
        const email = subjectFields["emailAddress"] || ""
        const curp = subjectFields["serialNumber"] || ""

        // Parse dates
        const validFrom = cert.validFrom // "Dec 15 16:18:44 2025 GMT"
        const validTo = cert.validTo

        // Convert to ISO date strings
        function parseDate(dateStr: string): string {
            const d = new Date(dateStr)
            return d.toISOString().split("T")[0]
        }

        const issuedDate = parseDate(validFrom)
        const expirationDate = parseDate(validTo)

        // Serial number (hex encoded ASCII)
        const serialHex = cert.serialNumber
        let serialNumber = ""
        try {
            // SAT serial numbers are hex-encoded ASCII
            const hexPairs = serialHex.match(/.{2}/g)
            if (hexPairs) {
                serialNumber = hexPairs.map(h => String.fromCharCode(parseInt(h, 16))).join("")
            }
        } catch {
            serialNumber = serialHex
        }

        // Determine type based on issuer
        const issuer = cert.issuer || ""
        const isFIEL = issuer.includes("SAT") || issuer.includes("ADMINISTRACION TRIBUTARIA")

        return NextResponse.json({
            name,
            rfc,
            email,
            curp,
            issuedDate,
            expirationDate,
            serialNumber,
            type: isFIEL ? "efirma" : "csd",
            label: `${isFIEL ? "e.Firma" : "CSD"} — ${name}`,
        })
    } catch (error: any) {
        console.error("Error parsing .cer:", error)
        return NextResponse.json(
            { error: "No se pudo leer el archivo .cer. Verifica que sea un certificado válido del SAT." },
            { status: 400 }
        )
    }
}
