"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Pencil, Trash2, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Document {
  id: string
  document_type: string
  file_name: string
  file_url: string
  uploaded_at: string
}

export function DocumentsSection({ clientId, userRole }: { clientId: string; userRole?: string }) {
  const isClient = userRole === "cliente"
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [documentName, setDocumentName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadDocuments()
  }, [clientId])

  async function loadDocuments() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from("client_documents")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })

      // Clients see all documents for their account; accountants see only their own uploads
      if (!isClient) {
        query = query.eq("user_id", user.id)
      }

      const { data, error } = await query

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error("Error loading documents:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveDocument() {
    if (!documentName) {
      toast({ title: "Error", description: "Ingresa un nombre para el documento", variant: "destructive" })
      return
    }

    if (!file && !editingDoc) {
      toast({ title: "Error", description: "Selecciona un archivo", variant: "destructive" })
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      let fileUrl = editingDoc?.file_url || ""
      let fileName = file?.name || editingDoc?.file_name || ""

      if (file) {
        const fileExt = file.name.split(".").pop()
        const filePath = `${user.id}/${clientId}/${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("client-documents")
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("client-documents").getPublicUrl(filePath)

        fileUrl = publicUrl
        fileName = file.name
      }

      if (editingDoc) {
        // Update existing document
        const { error } = await supabase
          .from("client_documents")
          .update({ document_type: documentName, file_name: fileName, file_url: fileUrl })
          .eq("id", editingDoc.id)

        if (error) throw error
        toast({ title: "Documento actualizado correctamente" })
      } else {
        // Create new document
        const { error } = await supabase.from("client_documents").insert({
          client_id: clientId,
          user_id: user.id,
          document_type: documentName,
          file_name: fileName,
          file_url: fileUrl,
          file_size: file?.size || 0,
        })

        if (error) throw error
        toast({ title: "Documento creado correctamente" })
      }

      setIsCreateOpen(false)
      setEditingDoc(null)
      setDocumentName("")
      setFile(null)
      loadDocuments()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  async function handleDeleteDocument(doc: Document) {
    if (!confirm("¿Estás seguro de eliminar este documento?")) return

    try {
      const { error } = await supabase.from("client_documents").delete().eq("id", doc.id)

      if (error) throw error
      toast({ title: "Documento eliminado correctamente" })
      loadDocuments()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Documentos del Cliente</span>
          {!isClient && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingDoc(null)
                    setDocumentName("")
                    setFile(null)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Documento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingDoc ? "Editar Documento" : "Crear Documento"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="docName">Nombre del Documento</Label>
                    <Input
                      id="docName"
                      placeholder="Ej: Constancia de Situación Fiscal"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="docFile">Archivo</Label>
                    <Input
                      id="docFile"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    {editingDoc && !file && (
                      <p className="text-sm text-muted-foreground mt-1">Archivo actual: {editingDoc.file_name}</p>
                    )}
                  </div>
                  <Button onClick={handleSaveDocument} className="w-full">
                    {editingDoc ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando documentos...</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay documentos cargados aún</p>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{doc.document_type}</h4>
                      <p className="text-sm text-muted-foreground truncate">{doc.file_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(doc.file_url, "_blank")}>
                      <Upload className="h-4 w-4" />
                    </Button>
                    {!isClient && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingDoc(doc)
                            setDocumentName(doc.document_type)
                            setFile(null)
                            setIsCreateOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteDocument(doc)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
