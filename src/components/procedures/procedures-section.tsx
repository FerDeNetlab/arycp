"use client"

import { useEffect, useState } from "react"
import { AssignToSelector } from "@/components/activity/assign-to-selector"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Trash2,
  Building2,
  UserCheck,
  KeyRound,
  FileCheck,
  CheckCircle2,
  MapPin,
  FileUp,
  Mail,
  Search as SearchIcon,
  Calendar,
  AlertCircle
} from "lucide-react"

interface Procedure {
  id: string
  client_id: string
  procedure_type: string
  status: string
  start_date: string
  end_date?: string
  responsible?: string
  comments?: string
  is_reviewed: boolean
  specific_data: Record<string, unknown>
  assigned_to?: string
  assigned_to_name?: string
  created_at: string
}

interface ProceduresSectionProps {
  clientId: string
  clientName: string
  userRole?: string
}

const PROCEDURE_TYPES = [
  { value: "alta_patronal_imss", label: "Alta patronal ante el IMSS", icon: Building2 },
  { value: "alta_representante_legal", label: "Alta de representante legal", icon: UserCheck },
  { value: "generacion_firma_electronica", label: "Generación de firma electrónica", icon: KeyRound },
  { value: "constancia_situacion_fiscal", label: "Constancias de situación fiscal", icon: FileCheck },
  { value: "opinion_cumplimiento", label: "Opiniones de cumplimiento", icon: CheckCircle2 },
  { value: "cambio_domicilio_fiscal", label: "Cambio de domicilio fiscal", icon: MapPin },
  { value: "aumento_disminucion_obligaciones", label: "Aumento/disminución de obligaciones", icon: FileUp },
  { value: "reactivacion_buzon_tributario", label: "Reactivación de buzón tributario", icon: Mail },
  { value: "revision_sat", label: "Revisiones del SAT", icon: SearchIcon },
]

const STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  { value: "en_proceso", label: "En Proceso", color: "bg-blue-100 text-blue-800" },
  { value: "completado", label: "Completado", color: "bg-green-100 text-green-800" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-800" },
]

export function ProceduresSection({ clientId, clientName, userRole }: ProceduresSectionProps) {
  const isClient = userRole === "cliente"
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("alta_patronal_imss")
  const supabase = createClient()

  const [newProcedure, setNewProcedure] = useState({
    procedure_type: "",
    start_date: new Date().toISOString().split("T")[0],
    responsible: "",
    comments: "",
    specific_data: {} as Record<string, unknown>,
  })

  useEffect(() => {
    loadProcedures()
  }, [clientId])

  const loadProcedures = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("procedures")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setProcedures(data)
    }
    setLoading(false)
  }

  const handleCreateProcedure = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    const { error } = await supabase.from("procedures").insert({
      client_id: clientId,
      user_id: userData.user.id,
      procedure_type: newProcedure.procedure_type,
      start_date: newProcedure.start_date,
      responsible: newProcedure.responsible,
      comments: newProcedure.comments,
      specific_data: newProcedure.specific_data,
      created_by: userData.user.id,
    })

    if (!error) {
      setDialogOpen(false)
      setNewProcedure({
        procedure_type: "",
        start_date: new Date().toISOString().split("T")[0],
        responsible: "",
        comments: "",
        specific_data: {},
      })
      loadProcedures()
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    const { data: userData } = await supabase.auth.getUser()
    const updateData: Record<string, unknown> = {
      status,
      updated_by: userData?.user?.id,
      updated_at: new Date().toISOString()
    }

    if (status === "completado") {
      updateData.end_date = new Date().toISOString().split("T")[0]
    }

    await supabase.from("procedures").update(updateData).eq("id", id)
    loadProcedures()
  }

  const handleUpdateReviewed = async (id: string, is_reviewed: boolean) => {
    const { data: userData } = await supabase.auth.getUser()
    await supabase.from("procedures").update({
      is_reviewed,
      updated_by: userData?.user?.id,
      updated_at: new Date().toISOString()
    }).eq("id", id)
    loadProcedures()
  }

  const handleDeleteProcedure = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este trámite?")) return
    await supabase.from("procedures").delete().eq("id", id)
    loadProcedures()
  }

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status)
    return statusOption ? (
      <Badge className={statusOption.color}>{statusOption.label}</Badge>
    ) : null
  }

  const getProcedureTypeLabel = (type: string) => {
    const procedureType = PROCEDURE_TYPES.find((p) => p.value === type)
    return procedureType ? procedureType.label : type
  }

  const getProcedureIcon = (type: string) => {
    const procedureType = PROCEDURE_TYPES.find((p) => p.value === type)
    return procedureType ? procedureType.icon : FileCheck
  }

  const proceduresByType = (type: string) => procedures.filter((p) => p.procedure_type === type)

  return (
    <div className="space-y-6">
      {/* Header con botón de nuevo trámite */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trámites</h2>
        {!isClient && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Trámite
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuevo Trámite</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Trámite</label>
                  <Select
                    value={newProcedure.procedure_type}
                    onValueChange={(value) => setNewProcedure({ ...newProcedure, procedure_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROCEDURE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha de Inicio</label>
                  <Input
                    type="date"
                    value={newProcedure.start_date}
                    onChange={(e) => setNewProcedure({ ...newProcedure, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Responsable</label>
                  <Input
                    placeholder="Nombre del responsable"
                    value={newProcedure.responsible}
                    onChange={(e) => setNewProcedure({ ...newProcedure, responsible: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Comentarios</label>
                  <Textarea
                    placeholder="Observaciones o notas adicionales"
                    value={newProcedure.comments}
                    onChange={(e) => setNewProcedure({ ...newProcedure, comments: e.target.value })}
                  />
                </div>

                <Button
                  onClick={handleCreateProcedure}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                  disabled={!newProcedure.procedure_type}
                >
                  Crear Trámite
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabs por tipo de trámite */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
          {PROCEDURE_TYPES.map((type) => {
            const Icon = type.icon
            const count = proceduresByType(type.value).length
            return (
              <TabsTrigger
                key={type.value}
                value={type.value}
                className="data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-800 border"
              >
                <Icon className="h-4 w-4 mr-2" />
                {type.label}
                {count > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-cyan-200 text-cyan-800">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {PROCEDURE_TYPES.map((type) => {
          const Icon = type.icon
          const typeProcedures = proceduresByType(type.value)

          return (
            <TabsContent key={type.value} value={type.value} className="mt-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-cyan-600" />
                    {type.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                  ) : typeProcedures.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay trámites de este tipo. Crea uno nuevo.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {typeProcedures.map((procedure) => (
                        <Card key={procedure.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                  {getStatusBadge(procedure.status)}
                                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Iniciado: {new Date(procedure.start_date).toLocaleDateString("es-MX")}
                                  </span>
                                  {procedure.end_date && (
                                    <span className="text-sm text-green-600 flex items-center gap-1">
                                      <CheckCircle2 className="h-4 w-4" />
                                      Completado: {new Date(procedure.end_date).toLocaleDateString("es-MX")}
                                    </span>
                                  )}
                                </div>

                                {procedure.responsible && (
                                  <p className="text-sm">
                                    <span className="font-medium">Responsable:</span> {procedure.responsible}
                                  </p>
                                )}

                                {procedure.comments && (
                                  <p className="text-sm text-muted-foreground">{procedure.comments}</p>
                                )}

                                {/* Assignment selector */}
                                {!isClient && (
                                  <div className="pt-1">
                                    <AssignToSelector
                                      entityType="procedure"
                                      entityId={procedure.id}
                                      module="procedures"
                                      currentAssignedTo={procedure.assigned_to}
                                      currentAssignedToName={procedure.assigned_to_name}
                                      onAssigned={(userId, userName) => {
                                        setProcedures(prev => prev.map(p =>
                                          p.id === procedure.id ? { ...p, assigned_to: userId, assigned_to_name: userName } : p
                                        ))
                                      }}
                                    />
                                  </div>
                                )}

                                {!isClient && (
                                  <div className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id={`reviewed-${procedure.id}`}
                                        checked={procedure.is_reviewed}
                                        onCheckedChange={(checked) =>
                                          handleUpdateReviewed(procedure.id, checked as boolean)
                                        }
                                      />
                                      <label htmlFor={`reviewed-${procedure.id}`} className="text-sm">
                                        Revisado
                                      </label>
                                    </div>

                                    <Select
                                      value={procedure.status}
                                      onValueChange={(value) => handleUpdateStatus(procedure.id, value)}
                                    >
                                      <SelectTrigger className="w-40 h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {STATUS_OPTIONS.map((status) => (
                                          <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>

                              {!isClient && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteProcedure(procedure.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Resumen de todos los trámites */}
      <Card className="border-2 border-cyan-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-cyan-600" />
            Resumen de Trámites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {procedures.filter((p) => p.status === "pendiente").length}
              </p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {procedures.filter((p) => p.status === "en_proceso").length}
              </p>
              <p className="text-sm text-muted-foreground">En Proceso</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {procedures.filter((p) => p.status === "completado").length}
              </p>
              <p className="text-sm text-muted-foreground">Completados</p>
            </div>
            <div className="text-center p-4 bg-cyan-50 rounded-lg">
              <p className="text-2xl font-bold text-cyan-600">{procedures.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
