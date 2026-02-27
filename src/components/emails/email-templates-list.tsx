"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Mail, Edit, Trash2 } from "lucide-react"
import { CreateTemplateDialog } from "./create-template-dialog"
import { toast } from "sonner"

interface EmailTemplate {
  id: string
  name: string
  description: string
  subject: string
  html_content: string
  variables: string[]
  category: string
  is_active: boolean
  created_at: string
}

export function EmailTemplatesList() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadTemplates()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error("[v0] Error loading templates:", error)
      toast.error("Error al cargar las plantillas")
    } finally {
      setLoading(false)
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta plantilla?")) return

    try {
      const { error } = await supabase.from("email_templates").delete().eq("id", id)

      if (error) throw error

      toast.success("Plantilla eliminada")
      loadTemplates()
    } catch (error) {
      console.error("[v0] Error deleting template:", error)
      toast.error("Error al eliminar la plantilla")
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando plantillas...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditingTemplate(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Plantilla
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="p-8 text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No hay plantillas de correo creadas</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Primera Plantilla
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    {template.category && <span className="text-xs text-muted-foreground">{template.category}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingTemplate(template)
                      setDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteTemplate(template.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
              <p className="text-sm font-medium">Asunto: {template.subject}</p>
              {template.variables && template.variables.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.variables.map((variable, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-secondary/50 rounded">
                      {variable}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <CreateTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
        onSuccess={() => {
          loadTemplates()
          setDialogOpen(false)
          setEditingTemplate(null)
        }}
      />
    </div>
  )
}
