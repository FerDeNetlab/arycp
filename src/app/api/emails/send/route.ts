import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"
import { getErrorMessage } from "@/lib/api/errors"

export async function POST(req: NextRequest) {

  try {
    const body = await req.json()

    const { to, subject, html, clientId, templateId, cc, bcc, attachmentUrl, apiKey, fromEmail } = body

    if (!to || !subject || !html || !apiKey || !fromEmail) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    const resend = new Resend(apiKey)

    const supabase = await createClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const fromWithName = `Robot contador de AR&CP <${fromEmail}>`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailPayload: any = {
      from: fromWithName,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }

    if (cc) emailPayload.cc = Array.isArray(cc) ? cc : [cc]
    if (bcc) emailPayload.bcc = Array.isArray(bcc) ? bcc : [bcc]

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
        } else {
          console.warn("[v0] No se pudo descargar el adjunto:", attachmentResponse.status)
        }
      } catch (attachError) {
        console.error("[v0] Error al procesar adjunto:", attachError)
      }
    }

    const { data, error: resendError } = await resend.emails.send(emailPayload)

    if (resendError) {
      console.error("[v0] Error de Resend:", resendError)

      // Guardar en historial como fallido
      await supabase.from("email_history").insert({
        client_id: clientId || null,
        user_id: userData.user.id,
        template_id: templateId || null,
        from_email: fromEmail,
        to_email: Array.isArray(to) ? to[0] : to,
        cc_emails: cc ? (Array.isArray(cc) ? cc : [cc]) : null,
        bcc_emails: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : null,
        subject,
        html_content: html,
        status: "failed",
        error_message: JSON.stringify(resendError),
      })

      return NextResponse.json({ error: resendError.message || "Error al enviar" }, { status: 500 })
    }

    await supabase.from("email_history").insert({
      client_id: clientId || null,
      user_id: userData.user.id,
      template_id: templateId || null,
      from_email: fromEmail,
      to_email: Array.isArray(to) ? to[0] : to,
      cc_emails: cc ? (Array.isArray(cc) ? cc : [cc]) : null,
      bcc_emails: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : null,
      subject,
      html_content: html,
      status: "sent",
      metadata: data ? { id: data.id } : null,
    })

    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    console.error("Error in /api/emails/send:", error)

    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: getErrorMessage(error),
      },
      { status: 500 },
    )
  }
}
