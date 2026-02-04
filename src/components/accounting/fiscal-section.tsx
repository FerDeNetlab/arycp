"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, AlertCircle, Pencil, Trash2, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { sendFiscalObservationsEmail } from "@/app/actions/send-email"

interface FiscalObservation {
  id: string
  observation_type: string | null
  title: string
  description: string
  status: string
  created_at: string
}

export function FiscalSection({ clientId, clientData }: { clientId: string; clientData: any }) {
  const [observations, setObservations] = useState<FiscalObservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingObservation, setEditingObservation] = useState<FiscalObservation | null>(null)
  const [isSendEmailOpen, setIsSendEmailOpen] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    importance: "normal",
  })

  useEffect(() => {
    loadObservations()
  }, [clientId])

  const loadObservations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("fiscal_observations")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setObservations(data || [])
    } catch (error) {
      console.error("Error loading observations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast({ title: "Error", description: "Debes iniciar sesión", variant: "destructive" })
        return
      }

      if (editingObservation) {
        const { error } = await supabase
          .from("fiscal_observations")
          .update({
            title: formData.title,
            description: formData.description,
            status: editingObservation.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingObservation.id)

        if (error) throw error
        toast({ title: "Observación actualizada correctamente" })
      } else {
        const { error } = await supabase.from("fiscal_observations").insert({
          client_id: clientId,
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          observation_type: formData.importance,
          status: "pending",
        })

        if (error) throw error
        toast({ title: "Observación creada correctamente" })
      }

      setIsDialogOpen(false)
      resetForm()
      loadObservations()
    } catch (error) {
      console.error("Error saving observation:", error)
      toast({ title: "Error al guardar", description: "Intenta de nuevo", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta observación?")) return

    try {
      const { error } = await supabase.from("fiscal_observations").delete().eq("id", id)

      if (error) throw error
      toast({ title: "Observación eliminada correctamente" })
      loadObservations()
    } catch (error) {
      console.error("Error deleting observation:", error)
      toast({ title: "Error al eliminar", description: "Intenta de nuevo", variant: "destructive" })
    }
  }

  const handleEdit = (observation: FiscalObservation) => {
    setEditingObservation(observation)
    setFormData({
      title: observation.title,
      description: observation.description,
      importance: observation.observation_type || "normal",
    })
    setIsDialogOpen(true)
  }

  const handleStatusChange = async (observationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("fiscal_observations")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", observationId)

      if (error) throw error
      toast({ title: "Estado actualizado correctamente" })
      loadObservations()
    } catch (error) {
      console.error("Error updating status:", error)
      toast({ title: "Error al actualizar", description: "Intenta de nuevo", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      importance: "normal",
    })
    setEditingObservation(null)
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) resetForm()
  }

  const handleSendObservations = async () => {
    if (!recipientEmail) {
      toast({ title: "Error", description: "Ingresa un correo electrónico", variant: "destructive" })
      return
    }

    if (observations.length === 0) {
      toast({ title: "Error", description: "No hay observaciones para enviar", variant: "destructive" })
      return
    }

    setIsSending(true)
    try {
      const result = await sendFiscalObservationsEmail({
        to: recipientEmail,
        clientName: clientData.business_name || clientData.name,
        observations: observations.map((obs) => ({
          title: obs.title,
          description: obs.description,
          type: obs.observation_type,
        })),
        clientId,
      })

      if (result.success) {
        toast({ title: "Correo enviado correctamente" })
        setIsSendEmailOpen(false)
        setRecipientEmail("")
      } else {
        toast({
          title: "Error al enviar",
          description: result.error || "Intenta de nuevo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending email:", error)
      toast({ title: "Error al enviar", description: "Intenta de nuevo", variant: "destructive" })
    } finally {
      setIsSending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      pending: { label: "Pendiente", variant: "outline" },
      completed: { label: "Completada", variant: "default" },
      in_progress: { label: "En Proceso", variant: "secondary" },
    }
    const statusInfo = statusMap[status] || statusMap.pending
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const getImportanceBadge = (importance: string | null) => {
    const importanceMap: Record<
      string,
      { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
    > = {
      normal: { label: "No mucha", variant: "secondary" },
      important: { label: "Importante", variant: "default" },
      very_important: { label: "Muy importante", variant: "destructive" },
    }
    const importanceInfo = importanceMap[importance || "normal"] || importanceMap.normal
    return <Badge variant={importanceInfo.variant}>{importanceInfo.label}</Badge>
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Observaciones Fiscales</span>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Observación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingObservation ? "Editar Observación" : "Nueva Observación Fiscal"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Reducir gastos deducibles"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe la recomendación o observación..."
                    rows={4}
                    required
                  />
                </div>

                {!editingObservation && (
                  <div className="space-y-2">
                    <Label htmlFor="importance">Importancia</Label>
                    <Select
                      value={formData.importance}
                      onValueChange={(value) => setFormData({ ...formData, importance: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">No mucha</SelectItem>
                        <SelectItem value="important">Importante</SelectItem>
                        <SelectItem value="very_important">Muy importante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingObservation ? "Actualizar" : "Crear"} Observación</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
          ) : observations.length > 0 ? (
            <>
              {observations.map((observation) => (
                <div key={observation.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-semibold">{observation.title}</h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Select
                            value={observation.status}
                            onValueChange={(value) => handleStatusChange(observation.id, value)}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="in_progress">En Proceso</SelectItem>
                              <SelectItem value="completed">Completada</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEdit(observation)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(observation.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{observation.description}</p>
                      {observation.observation_type && getImportanceBadge(observation.observation_type)}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No hay observaciones fiscales registradas</p>
          )}
        </div>

        {observations.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <Dialog open={isSendEmailOpen} onOpenChange={setIsSendEmailOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="default">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Observaciones
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar Observaciones Fiscales</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Correo del destinatario</Label>
                    <Input
                      id="recipient"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="cliente@ejemplo.com"
                      required
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Se enviarán {observations.length} observación{observations.length !== 1 ? "es" : ""} a{" "}
                    {clientData.business_name || clientData.name}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsSendEmailOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSendObservations} disabled={isSending}>
                      {isSending ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
