"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface SendEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId?: string
  clientEmail?: string
}

export function SendEmailDialog({ open, onOpenChange, clientId, clientEmail }: SendEmailDialogProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [to, setTo] = useState(clientEmail || "")
  const [subject, setSubject] = useState("")
  const [html, setHtml] = useState("")
  const [sending, setSending] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (open) {
      loadTemplates()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (clientEmail) {
      setTo(clientEmail)
    }
  }, [clientEmail])

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase.from("email_templates").select("*").eq("is_active", true).order("name")

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error("[v0] Error loading templates:", error)
    }
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setSubject(template.subject)
      setHtml(template.html_content)
    }
  }

  const handleSend = async () => {
    if (!to || !subject || !html) {
      toast.error("Por favor completa todos los campos")
      return
    }

    setSending(true)
    try {
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          html,
          clientId,
          templateId: selectedTemplate || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el correo")
      }

      toast.success("Correo enviado exitosamente")
      onOpenChange(false)
      setSelectedTemplate("")
      setSubject("")
      setHtml("")
      setTo(clientEmail || "")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("[v0] Error sending email:", error)
      toast.error(error.message || "Error al enviar el correo")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Correo Electrónico</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="template">Usar Plantilla (Opcional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una plantilla" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="to">Para *</Label>
            <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="correo@ejemplo.com" />
          </div>

          <div>
            <Label htmlFor="subject">Asunto *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del correo"
            />
          </div>

          <div>
            <Label htmlFor="html">Contenido HTML *</Label>
            <Textarea
              id="html"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Contenido del correo en HTML"
              rows={15}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? "Enviando..." : "Enviar Correo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
