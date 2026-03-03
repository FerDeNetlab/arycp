import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"
import forge from "node-forge"

/**
 * Accepts .cer (DER certificate) or .pfx (PKCS#12) files.
 * For .pfx, a "password" field is required in the FormData.
 * Returns parsed certificate data for auto-filling compliance forms.
 */
export async function POST(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "Archivo .cer o .pfx requerido" }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const fileName = file.name.toLowerCase()
        let pem: string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let pfxExtraData: { registroPatronal: string; name: string; rfc: string; email: string } | null = null

        if (fileName.endsWith(".pfx") || fileName.endsWith(".p12")) {
            // --- PFX / PKCS#12 flow ---
            const password = (formData.get("password") as string) || ""

            try {
                const derBase64 = buffer.toString("base64")
                const der = forge.util.decode64(derBase64)
                const asn1Obj = forge.asn1.fromDer(der)
                const p12 = forge.pkcs12.pkcs12FromAsn1(asn1Obj, false, password)

                // Extract all certificates from the PKCS#12 bags
                const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
                const bags = certBags[forge.pki.oids.certBag]
                if (!bags || bags.length === 0) {
                    return NextResponse.json(
                        { error: "No se encontró un certificado dentro del archivo .pfx" },
                        { status: 400 }
                    )
                }

                // Pick the end-entity cert (not the CA cert)
                // CA certs are self-signed (subject === issuer) — skip those
                let forgeCert = bags[0].cert
                for (const bag of bags) {
                    if (!bag.cert) continue
                    const subjectCN = bag.cert.subject.getField("CN")?.value || ""
                    const issuerCN = bag.cert.issuer.getField("CN")?.value || ""
                    if (subjectCN !== issuerCN) {
                        // This is the end-entity cert (not self-signed)
                        forgeCert = bag.cert
                        break
                    }
                }

                if (!forgeCert) {
                    return NextResponse.json(
                        { error: "No se pudo extraer el certificado del archivo .pfx" },
                        { status: 400 }
                    )
                }

                // Extract IMSS-specific fields directly from forge cert attributes
                const getAttr = (name: string) => forgeCert!.subject.getField(name)?.value || ""
                const registroPatronal = getAttr("businessCategory") || getAttr("OU") || ""
                const forgeName = getAttr("CN")?.replace(/\$/g, " ").trim() || getAttr("O") || ""
                const forgeEmail = getAttr("E") || ""

                // Extract RFC from subject attributes (may be in an unnamed OID field)
                let forgeRfc = ""
                for (const attr of forgeCert.subject.attributes) {
                    const val = String(attr.value || "")
                    // RFC pattern: 3-4 letters + 6 digits + 3 alphanumeric
                    if (/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(val)) {
                        forgeRfc = val
                        break
                    }
                }

                // Also try to extract registro patronal from filename
                const fileRegistro = fileName.match(/([A-Z]\d{9,10})/i)?.[1] || ""

                pem = forge.pki.certificateToPem(forgeCert)

                // Store extra data for IMSS certs
                pfxExtraData = {
                    registroPatronal: registroPatronal || fileRegistro,
                    name: forgeName,
                    rfc: forgeRfc,
                    email: forgeEmail,
                }
            } catch (pfxError: unknown) {
                const msg = pfxError instanceof Error ? pfxError.message : String(pfxError)
                if (msg.includes("Invalid password") || msg.includes("PKCS#12 MAC") || msg.includes("decryption")) {
                    return NextResponse.json(
                        { error: "Contraseña incorrecta. Verifica la contraseña del archivo .pfx." },
                        { status: 400 }
                    )
                }
                throw pfxError
            }
        } else {
            // --- CER (DER) flow (existing) ---
            const base64 = buffer.toString("base64")
            pem = `-----BEGIN CERTIFICATE-----\n${base64.match(/.{1,64}/g)!.join("\n")}\n-----END CERTIFICATE-----`
        }

        // Parse with Node.js crypto
        const cert = new crypto.X509Certificate(pem)

        // Extract fields from the subject
        const subject = cert.subject
        const subjectFields: Record<string, string> = {}
        subject.split("\n").forEach(line => {
            const [key, ...vals] = line.split("=")
            if (key && vals.length) subjectFields[key.trim()] = vals.join("=").trim()
        })

        // Get name and RFC (prefer PFX-extracted data for IMSS certs)
        const name = pfxExtraData?.name || subjectFields["CN"] || subjectFields["O"] || ""
        const rfc = pfxExtraData?.rfc || subjectFields["x500UniqueIdentifier"] || ""
        const email = pfxExtraData?.email || subjectFields["emailAddress"] || ""
        const curp = subjectFields["serialNumber"] || ""
        const registroPatronal = pfxExtraData?.registroPatronal || ""

        // Parse dates
        const validFrom = cert.validFrom
        const validTo = cert.validTo

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

        // Determine type based on issuer / filename
        const issuer = cert.issuer || ""
        const isSAT = issuer.includes("SAT") || issuer.includes("ADMINISTRACION TRIBUTARIA")
        const isIMSS = fileName.endsWith(".pfx") || fileName.endsWith(".p12") ||
            issuer.includes("IMSS") || issuer.includes("SEGURO SOCIAL")

        // Auto-detect registration type
        let type = "otro"
        let typeLabel = "Certificado"
        if (isIMSS) {
            type = "imss"
            typeLabel = "IMSS"
        } else if (isSAT) {
            type = "efirma"
            typeLabel = "e.Firma"
        }

        return NextResponse.json({
            name,
            rfc,
            registroPatronal,
            registrationNumber: registroPatronal || rfc,
            email,
            curp,
            issuedDate,
            expirationDate,
            serialNumber,
            type,
            label: `${typeLabel} — ${name}`,
        })
    } catch (error: unknown) {
        console.error("Error parsing certificate:", error)
        return NextResponse.json(
            { error: "No se pudo leer el archivo. Verifica que sea un certificado válido (.cer o .pfx)." },
            { status: 400 }
        )
    }
}
