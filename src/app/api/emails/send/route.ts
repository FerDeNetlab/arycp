import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"
import { getErrorMessage } from "@/lib/api/errors"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, subject, html, clientId, templateId, cc, bcc, senderName } = body

    // Use server-side env vars — never trust client-sent keys
    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL

    if (!apiKey || !fromEmail) {
      return NextResponse.json({ error: "Variables de entorno de correo no configuradas" }, { status: 500 })
    }

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Faltan parámetros requeridos (to, subject, html)" }, { status: 400 })
    }

    const resend = new Resend(apiKey)

    const supabase = await createClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Use personalized sender name if provided, fallback to company name
    const displayName = senderName || "AR&CP Soluciones Corporativas"
    const fromWithName = `${displayName} — AR&CP <${fromEmail}>`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailPayload: any = {
      from: fromWithName,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }

    if (cc) emailPayload.cc = Array.isArray(cc) ? cc : [cc]
    if (bcc) emailPayload.bcc = Array.isArray(bcc) ? bcc : [bcc]

    const { data, error: resendError } = await resend.emails.send(emailPayload)

    if (resendError) {
      console.error("Error de Resend:", resendError)

      // Save to history as failed
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
