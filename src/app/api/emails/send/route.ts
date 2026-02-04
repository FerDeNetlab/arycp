import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  console.log("[v0] === INICIO API /emails/send ===")

  try {
    const body = await req.json()
    console.log("[v0] Body recibido:", {
      to: body.to,
      subject: body.subject,
      hasHtml: !!body.html,
      hasAttachment: !!body.attachmentUrl,
    })

    const { to, subject, html, clientId, templateId, cc, bcc, attachmentUrl, apiKey, fromEmail } = body

    console.log("[v0] Validando parámetros:", {
      hasTo: !!to,
      hasSubject: !!subject,
      hasHtml: !!html,
      hasApiKey: !!apiKey,
      hasFromEmail: !!fromEmail,
    })

    if (!to || !subject || !html || !apiKey || !fromEmail) {
      console.log("[v0] Faltan parámetros requeridos")
      return NextResponse.json(
        {
          error: "Faltan parámetros requeridos",
          details: {
            hasTo: !!to,
            hasSubject: !!subject,
            hasHtml: !!html,
            hasApiKey: !!apiKey,
            hasFromEmail: !!fromEmail,
          },
        },
        { status: 400 },
      )
    }

    console.log("[v0] Inicializando Resend...")
    const resend = new Resend(apiKey)

    console.log("[v0] Autenticando usuario...")
    const supabase = await createClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData.user) {
      console.error("[v0] Error de autenticación:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("[v0] Usuario autenticado:", userData.user.id)

    const fromWithName = `Robot contador de AR&CP <${fromEmail}>`

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
        console.log("[v0] Descargando adjunto:", attachmentUrl)
        const attachmentResponse = await fetch(attachmentUrl)

        if (attachmentResponse.ok) {
          const attachmentBuffer = await attachmentResponse.arrayBuffer()
          emailPayload.attachments = [
            {
              filename: "declaracion.pdf",
              content: Buffer.from(attachmentBuffer),
            },
          ]
          console.log("[v0] Adjunto agregado")
        } else {
          console.warn("[v0] No se pudo descargar el adjunto:", attachmentResponse.status)
        }
      } catch (attachError) {
        console.error("[v0] Error al procesar adjunto:", attachError)
      }
    }

    console.log("[v0] Enviando correo con Resend...")
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

    console.log("[v0] ✓ Correo enviado exitosamente:", data?.id)

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
  } catch (error: any) {
    console.error("[v0] ✗ Error general:", error)
    console.error("[v0] Error stack:", error?.stack)

    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error?.message || "Error desconocido",
      },
      { status: 500 },
    )
  }
}
