"use server"

import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

export async function sendDeclarationEmail({
  to,
  subject,
  html,
  clientId,
  attachmentUrl,
}: {
  to: string
  subject: string
  html: string
  clientId: string
  attachmentUrl?: string
}) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL

    if (!apiKey || !fromEmail) {
      console.error("[v0] Variables de entorno no configuradas")
      return { success: false, error: "Variables de entorno no configuradas" }
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Error de autenticación:", authError)
      return { success: false, error: "No autorizado" }
    }

    const resend = new Resend(apiKey)
    const fromWithName = `Robot contador de AR&CP <${fromEmail}>`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailPayload: any = {
      from: fromWithName,
      to: [to],
      subject,
      html,
    }

    if (attachmentUrl) {
      try {
        const attachmentResponse = await fetch(attachmentUrl)
        if (attachmentResponse.ok) {
          const attachmentBuffer = await attachmentResponse.arrayBuffer()
          emailPayload.attachments = [
            {
              filename: "declaracion.pdf",
              content: Buffer.from(attachmentBuffer),
            },
          ]
        }
      } catch (error) {
        console.error("[v0] Error al descargar adjunto:", error)
      }
    }

    const { data, error: resendError } = await resend.emails.send(emailPayload)

    if (resendError) {
      console.error("[v0] Error de Resend:", resendError)

      // Guardar en historial como fallido
      await supabase.from("email_history").insert({
        client_id: clientId,
        user_id: user.id,
        from_email: fromEmail,
        to_email: to,
        subject,
        html_content: html,
        status: "failed",
        error_message: JSON.stringify(resendError),
      })

      return { success: false, error: resendError.message || "Error al enviar" }
    }

    await supabase.from("email_history").insert({
      client_id: clientId,
      user_id: user.id,
      from_email: fromEmail,
      to_email: to,
      subject,
      html_content: html,
      status: "sent",
      metadata: data ? { id: data.id } : null,
    })

    return { success: true, data }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("[v0] Error general:", error)
    return { success: false, error: error?.message || "Error desconocido" }
  }
}

export async function sendFiscalObservationsEmail({
  to,
  clientName,
  observations,
  clientId,
}: {
  to: string
  clientName: string
  observations: { title: string; description: string; type: string | null }[]
  clientId: string
}) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL

    if (!apiKey || !fromEmail) {
      console.error("[v0] Variables de entorno no configuradas")
      return { success: false, error: "Variables de entorno no configuradas" }
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Error de autenticación:", authError)
      return { success: false, error: "No autorizado" }
    }

    // Crear HTML del correo con diseño amigable
    const observationsHtml = observations
      .map(
        (obs, index) => `
      <div style="background-color: #f8f9fa; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
        <h3 style="color: #1f2937; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
          ${index + 1}. ${obs.title}
        </h3>
        <p style="color: #4b5563; margin: 0; line-height: 1.6; font-size: 15px;">
          ${obs.description}
        </p>
      </div>
    `,
      )
      .join("")

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header con logo -->
            <div style="text-align: center; padding: 30px 0;">
              <img src="/images/arycp-20png.png" alt="AR&CP" style="height: 60px;">
            </div>
            
            <!-- Contenido principal -->
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 700;">
                Hola ${clientName}!
              </h2>
              
              <p style="color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 24px;">
                Te dejo un par de consejos si quieres mejorar tu salud fiscal. Recuerda que es por tu bien, 
                esto ayudará a <strong>reducir tus cargas de impuestos</strong>, ser un contribuyente más sano, 
                y nosotros poder ayudarte mejor.
              </p>

              <div style="margin: 30px 0;">
                <h3 style="color: #10b981; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                  Recomendaciones:
                </h3>
                ${observationsHtml}
              </div>

              <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin-top: 30px;">
                <p style="color: #047857; margin: 0; font-size: 14px; line-height: 1.6;">
                  <strong>💡 Consejo:</strong> Implementar estas recomendaciones te ayudará a optimizar tu situación fiscal 
                  y mantener tus finanzas en orden.
                </p>
              </div>
            </div>

            <!-- Firma del Robot Contador -->
            <div style="text-align: center; margin-top: 30px;">
              <img src="/images/firma-20de-20correo-20robot.jpg" alt="Robot Contador" style="max-width: 100%; height: auto; border-radius: 8px;">
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este correo fue enviado automáticamente por el Robot Contador de AR&CP
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const resend = new Resend(apiKey)
    const fromWithName = `Robot contador de AR&CP <${fromEmail}>`

    const { data, error: resendError } = await resend.emails.send({
      from: fromWithName,
      to: [to],
      subject: `Recomendaciones fiscales para ${clientName}`,
      html,
    })

    if (resendError) {
      console.error("[v0] Error de Resend:", resendError)

      await supabase.from("email_history").insert({
        client_id: clientId,
        user_id: user.id,
        from_email: fromEmail,
        to_email: to,
        subject: `Recomendaciones fiscales para ${clientName}`,
        html_content: html,
        status: "failed",
        error_message: JSON.stringify(resendError),
      })

      return { success: false, error: resendError.message || "Error al enviar" }
    }

    await supabase.from("email_history").insert({
      client_id: clientId,
      user_id: user.id,
      from_email: fromEmail,
      to_email: to,
      subject: `Recomendaciones fiscales para ${clientName}`,
      html_content: html,
      status: "sent",
      metadata: data ? { id: data.id } : null,
    })

    return { success: true, data }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("[v0] Error general:", error)
    return { success: false, error: error?.message || "Error desconocido" }
  }
}
