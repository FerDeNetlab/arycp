"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Mail,
  Send,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Type,
  Eye,
  Edit3,
  Loader2,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SendEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId?: string
  clientEmail?: string
  clientName?: string
}

interface SenderInfo {
  fullName: string
  email: string
  role: string
}

// Branded HTML email wrapper — server builds this, but we preview it client-side
function buildEmailHTML(content: string, senderName: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f4f6f9;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
    <!-- Header -->
    <div style="text-align:center;padding:24px 0 16px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#1E3A8A 0%,#065F46 100%);padding:12px 28px;border-radius:12px;">
        <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:0.5px;">AR&amp;CP</span>
        <br/>
        <span style="color:rgba(255,255,255,0.85);font-size:11px;letter-spacing:1px;">SOLUCIONES CORPORATIVAS</span>
      </div>
    </div>

    <!-- Content -->
    <div style="background-color:#ffffff;border-radius:12px;padding:32px 28px;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid #e5e7eb;">
      ${content}
    </div>

    <!-- Signature -->
    <div style="margin-top:24px;padding:20px 24px;background:#ffffff;border-radius:10px;border:1px solid #e5e7eb;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-right:16px;border-right:3px solid #1E3A8A;">
            <div style="width:50px;height:50px;background:linear-gradient(135deg,#1E3A8A,#065F46);border-radius:10px;display:flex;align-items:center;justify-content:center;">
              <span style="color:#fff;font-size:20px;font-weight:700;">${senderName.charAt(0).toUpperCase()}</span>
            </div>
          </td>
          <td style="padding-left:16px;">
            <div style="font-weight:600;color:#1f2937;font-size:15px;">${senderName}</div>
            <div style="color:#6b7280;font-size:13px;">AR&amp;CP Soluciones Corporativas</div>
            <div style="margin-top:6px;">
              <a href="tel:+523310949192" style="color:#1E3A8A;text-decoration:none;font-size:12px;">📞 +52 33 1094 9192</a>
              <span style="color:#d1d5db;margin:0 8px;">|</span>
              <a href="mailto:contacto@arycp.com" style="color:#1E3A8A;text-decoration:none;font-size:12px;">✉️ contacto@arycp.com</a>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:20px;padding-top:16px;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">
        Este correo fue enviado por ${senderName} de AR&amp;CP Soluciones Corporativas
      </p>
      <p style="color:#d1d5db;font-size:10px;margin:4px 0 0;">
        Zenzontle 886, Col. 8 de Julio, Guadalajara, Jalisco, México
      </p>
    </div>
  </div>
</body>
</html>`
}

export function SendEmailDialog({ open, onOpenChange, clientId, clientEmail, clientName }: SendEmailDialogProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [to, setTo] = useState(clientEmail || "")
  const [subject, setSubject] = useState("")
  const [sending, setSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [senderInfo, setSenderInfo] = useState<SenderInfo | null>(null)
  const [clients, setClients] = useState<{ id: string; email: string; name: string }[]>([])
  const editorRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // Load sender info + clients list via API (system_users needs adminClient due to RLS)
  const loadRecipients = useCallback(async () => {
    try {
      const res = await fetch("/api/emails/recipients")
      const data = await res.json()
      if (res.ok) {
        if (data.sender) setSenderInfo(data.sender)
        if (data.clients) setClients(data.clients)
      }
    } catch (err) {
      console.error("Error loading recipients:", err)
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadRecipients()
      loadTemplates()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (clientEmail) setTo(clientEmail)
  }, [clientEmail])

  // Set initial greeting when sender info is loaded and editor is ready
  useEffect(() => {
    if (senderInfo && editorRef.current && open) {
      const greeting = clientName
        ? `<p>Buen día <strong>${clientName}</strong>,</p><p>Soy <strong>${senderInfo.fullName}</strong> de AR&CP Soluciones Corporativas.</p><p><br></p>`
        : `<p>Buen día,</p><p>Soy <strong>${senderInfo.fullName}</strong> de AR&CP Soluciones Corporativas.</p><p><br></p>`

      // Only set if editor is empty or has default content
      if (!editorRef.current.innerHTML || editorRef.current.innerHTML === "<br>" || editorRef.current.innerHTML === "<p><br></p>") {
        editorRef.current.innerHTML = greeting
      }
    }
  }, [senderInfo, open, clientName])

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error("Error loading templates:", error)
    }
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find(t => t.id === templateId)
    if (template && editorRef.current) {
      setSubject(template.subject)
      // Replace variables in template content
      let content = template.html_content || ""
      if (clientName) {
        content = content.replace(/\{nombre_cliente\}/g, clientName)
      }
      if (senderInfo) {
        content = content.replace(/\{nombre_contador\}/g, senderInfo.fullName)
      }
      editorRef.current.innerHTML = content
    }
  }

  const handleClientSelect = (email: string) => {
    setTo(email)
  }

  // Rich text toolbar actions
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const handleInsertLink = () => {
    const url = prompt("URL del enlace:")
    if (url) {
      execCommand("createLink", url)
    }
  }

  const getEditorContent = (): string => {
    return editorRef.current?.innerHTML || ""
  }

  const getFullHTML = (): string => {
    const content = getEditorContent()
    return buildEmailHTML(content, senderInfo?.fullName || "Equipo AR&CP")
  }

  const handleSend = async () => {
    if (!to || !subject) {
      toast.error("Por favor completa destinatario y asunto")
      return
    }

    const content = getEditorContent()
    if (!content || content === "<br>" || content === "<p><br></p>") {
      toast.error("Por favor escribe el contenido del correo")
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
          html: getFullHTML(),
          clientId,
          templateId: selectedTemplate || null,
          senderName: senderInfo?.fullName || "Equipo AR&CP",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el correo")
      }

      toast.success("Correo enviado exitosamente")
      handleClose()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error sending email:", error)
      toast.error(error.message || "Error al enviar el correo")
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setSelectedTemplate("")
    setSubject("")
    setTo(clientEmail || "")
    setShowPreview(false)
    if (editorRef.current) {
      editorRef.current.innerHTML = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#065F46] flex items-center justify-center">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-lg">Nuevo Correo</span>
              {senderInfo && (
                <p className="text-xs text-muted-foreground font-normal flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3" />
                  Enviando como {senderInfo.fullName}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template selector */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Plantilla (opcional)</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sin plantilla — escribir libremente" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recipient */}
          <div>
            <Label className="text-xs text-muted-foreground">Para *</Label>
            <div className="flex gap-2">
              <Input
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="h-9 flex-1"
              />
              {clients.length > 0 && (
                <Select onValueChange={handleClientSelect}>
                  <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Elegir cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.email}>
                        <span className="text-xs">{client.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label className="text-xs text-muted-foreground">Asunto *</Label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Asunto del correo"
              className="h-9"
            />
          </div>

          {/* Editor / Preview toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Contenido</Label>
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setShowPreview(false)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  !showPreview ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                <Edit3 className="h-3 w-3 inline mr-1" />
                Editar
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  showPreview ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                <Eye className="h-3 w-3 inline mr-1" />
                Vista Previa
              </button>
            </div>
          </div>

          {showPreview ? (
            /* Preview mode */
            <div className="border rounded-lg overflow-hidden bg-[#f4f6f9]">
              <div
                className="w-full min-h-[350px]"
                dangerouslySetInnerHTML={{ __html: getFullHTML() }}
              />
            </div>
          ) : (
            /* Editor mode */
            <div className="border rounded-lg overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-0.5 p-1.5 border-b bg-muted/30 flex-wrap">
                <button
                  type="button"
                  onClick={() => execCommand("bold")}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Negrita"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand("italic")}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Cursiva"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand("underline")}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Subrayado"
                >
                  <Underline className="h-3.5 w-3.5" />
                </button>
                <div className="w-px h-5 bg-border mx-1" />
                <button
                  type="button"
                  onClick={() => execCommand("insertUnorderedList")}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Lista con viñetas"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand("insertOrderedList")}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Lista numerada"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                </button>
                <div className="w-px h-5 bg-border mx-1" />
                <button
                  type="button"
                  onClick={handleInsertLink}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Insertar enlace"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => execCommand("formatBlock", "h3")}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title="Título"
                >
                  <Type className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Editable area */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="min-h-[250px] max-h-[400px] overflow-y-auto p-4 text-sm focus:outline-none prose prose-sm max-w-none
                  [&>p]:my-1 [&>ul]:my-2 [&>ol]:my-2 [&>h3]:text-base [&>h3]:font-semibold [&>h3]:my-2"
                onKeyDown={e => {
                  // Handle Enter to create paragraphs
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    document.execCommand("insertParagraph")
                  }
                }}
              />
            </div>
          )}

          {/* Signature preview hint */}
          {!showPreview && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Se incluirá automáticamente tu firma y diseño AR&amp;CP al enviar. Usa &quot;Vista Previa&quot; para ver cómo se verá.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button variant="outline" onClick={handleClose} className="h-9">
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !to || !subject}
              className="h-9 bg-gradient-to-r from-[#1E3A8A] to-[#065F46] hover:opacity-90"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  Enviar Correo
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
