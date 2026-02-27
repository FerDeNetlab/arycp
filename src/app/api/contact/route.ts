import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getErrorMessage } from "@/lib/api/errors"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, email, company, message } = body

        // Validate required fields
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: "Nombre, email y mensaje son requeridos" },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Email inválido" },
                { status: 400 }
            )
        }

        const adminClient = createAdminClient()

        // 1. Save to Supabase
        const { error: dbError } = await adminClient.from("contact_messages").insert({
            name,
            email,
            company: company || null,
            message,
        })

        if (dbError) {
            console.error("Error saving contact message:", dbError)
            return NextResponse.json(
                { error: "Error al guardar el mensaje" },
                { status: 500 }
            )
        }

        // 2. Send email notification via Resend
        const apiKey = process.env.RESEND_API_KEY
        const fromEmail = process.env.RESEND_FROM_EMAIL
        const contactEmail = process.env.CONTACT_EMAIL || fromEmail

        if (apiKey && fromEmail && contactEmail) {
            try {
                const { Resend } = await import("resend")
                const resend = new Resend(apiKey)

                await resend.emails.send({
                    from: `AR&CP Contacto <${fromEmail}>`,
                    to: [contactEmail],
                    subject: `Nuevo mensaje de contacto - ${name}`,
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head><meta charset="utf-8"></head>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px;">📬 Nuevo Mensaje de Contacto</h1>
                            </div>
                            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                                <div style="margin-bottom: 20px;">
                                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Nombre</p>
                                    <p style="margin: 0; font-size: 16px; font-weight: 600;">${name}</p>
                                </div>
                                <div style="margin-bottom: 20px;">
                                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Email</p>
                                    <p style="margin: 0; font-size: 16px;"><a href="mailto:${email}" style="color: #0d9488;">${email}</a></p>
                                </div>
                                ${company ? `
                                <div style="margin-bottom: 20px;">
                                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Empresa</p>
                                    <p style="margin: 0; font-size: 16px;">${company}</p>
                                </div>
                                ` : ""}
                                <div style="margin-bottom: 20px;">
                                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Mensaje</p>
                                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #0d9488;">
                                        <p style="margin: 0; font-size: 15px; white-space: pre-wrap;">${message}</p>
                                    </div>
                                </div>
                            </div>
                            <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
                                Este mensaje fue enviado desde el formulario de contacto de AR&CP
                            </p>
                        </body>
                        </html>
                    `,
                })
            } catch (emailError) {
                // Don't fail the request if email fails - message is already saved
                console.error("Error sending email notification:", emailError)
            }
        }

        return NextResponse.json(
            { success: true, message: "Mensaje enviado correctamente" },
            { status: 201 }
        )
    } catch (error: unknown) {
        console.error("Unexpected error:", error)
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 }
        )
    }
}
