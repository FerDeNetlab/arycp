"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: any
  onSuccess: () => void
}

export function CreateTemplateDialog({ open, onOpenChange, template, onSuccess }: CreateTemplateDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [htmlContent, setHtmlContent] = useState("")
  const [variables, setVariables] = useState("")
  const [category, setCategory] = useState("")
  const [saving, setSaving] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description || "")
      setSubject(template.subject)
      setHtmlContent(template.html_content)
      setVariables((template.variables || []).join(", "))
      setCategory(template.category || "")
    } else {
      setName("")
      setDescription("")
      setSubject("")
      setHtmlContent("")
      setVariables("")
      setCategory("")
    }
  }, [template])

  const handleSave = async () => {
    if (!name || !subject || !htmlContent) {
      toast.error("Por favor completa los campos requeridos")
      return
    }

    setSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("No hay usuario autenticado")

      const variablesArray = variables
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v)

      const templateData = {
        user_id: userData.user.id,
        name,
        description,
        subject,
        html_content: htmlContent,
        variables: variablesArray,
        category,
        is_active: true,
      }

      if (template) {
        const { error } = await supabase.from("email_templates").update(templateData).eq("id", template.id)

        if (error) throw error
        toast.success("Plantilla actualizada")
      } else {
        const { error } = await supabase.from("email_templates").insert(templateData)

        if (error) throw error
        toast.success("Plantilla creada")
      }

      onSuccess()
    } catch (error) {
      console.error("[v0] Error saving template:", error)
      toast.error("Error al guardar la plantilla")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Editar Plantilla" : "Crear Plantilla de Correo"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre de la Plantilla *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Bienvenida Cliente"
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción de la plantilla"
            />
          </div>

          <div>
            <Label htmlFor="category">Categoría</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ej: Contabilidad, Legal, General"
            />
          </div>

          <div>
            <Label htmlFor="subject">Asunto del Correo *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del correo electrónico"
            />
          </div>

          <div>
            <Label htmlFor="variables">Variables Disponibles</Label>
            <Input
              id="variables"
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              placeholder="Separadas por coma: cliente_nombre, fecha, monto"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Usa las variables en el contenido como: {`{{cliente_nombre}}`}
            </p>
          </div>

          <div>
            <Label htmlFor="htmlContent">Contenido HTML *</Label>
            <Textarea
              id="htmlContent"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Contenido HTML del correo"
              rows={15}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">Puedes usar HTML y las variables definidas arriba</p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : template ? "Actualizar" : "Crear Plantilla"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
