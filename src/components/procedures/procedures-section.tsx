"use client"

import { useEffect, useState, useRef } from "react"
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
import { useToast } from "@/hooks/use-toast"
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
  AlertCircle,
  FileText,
  Pencil,
  Upload,
  Loader2,
  ExternalLink,
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
  { value: "alta_isn", label: "Alta de ISN", icon: FileText },
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

const ESTADOS_MEXICO = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
]

const emptyISNData = {
  rfc: "",
  razon_social: "",
  domicilio_fiscal: "",
  estado: "",
  fecha_solicitud: new Date().toISOString().split("T")[0],
  fecha_estimada_resolucion: "",
  fecha_resolucion: "",
  numero_registro_isn: "",
  porcentaje_isn: "",
  periodo_inicio: "",
  base_calculo: "",
  archivo_nombre: "",
  archivo_url: "",
  notas_adicionales: "",
}

export function ProceduresSection({ clientId, clientName, userRole }: ProceduresSectionProps) {
  const isClient = userRole === "cliente"
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null)
  const [activeTab, setActiveTab] = useState("alta_patronal_imss")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { toast } = useToast()

  const [newProcedure, setNewProcedure] = useState({
    procedure_type: "",
    start_date: new Date().toISOString().split("T")[0],
    responsible: "",
    comments: "",
    specific_data: {} as Record<string, unknown>,
  })

  useEffect(() => {
    loadProcedures()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Auto-calculate estimated resolution date (+5 business days) for ISN
  function calcEstimatedResolution(dateStr: string): string {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    let businessDays = 0
    while (businessDays < 5) {
      d.setDate(d.getDate() + 1)
      if (d.getDay() !== 0 && d.getDay() !== 6) businessDays++
    }
    return d.toISOString().split("T")[0]
  }

  // Log activity for supervision metrics
  function logAction(action: string, description: string) {
    fetch("/api/activity/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: "procedures", action, clientId, clientName, description }),
    }).catch(() => { /* fire and forget */ })
  }

  const handleCreateProcedure = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    const specificData = { ...newProcedure.specific_data }

    // Auto-calc estimated resolution for ISN
    if (newProcedure.procedure_type === "alta_isn") {
      const solicitud = (specificData as typeof emptyISNData).fecha_solicitud
      if (solicitud && !(specificData as typeof emptyISNData).fecha_estimada_resolucion) {
        (specificData as typeof emptyISNData).fecha_estimada_resolucion = calcEstimatedResolution(solicitud)
      }
    }

    const { error } = await supabase.from("procedures").insert({
      client_id: clientId,
      user_id: userData.user.id,
      procedure_type: newProcedure.procedure_type,
      start_date: newProcedure.start_date,
      responsible: newProcedure.responsible,
      comments: newProcedure.comments,
      specific_data: specificData,
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
      const typeLabel = PROCEDURE_TYPES.find(t => t.value === newProcedure.procedure_type)?.label || newProcedure.procedure_type
      logAction("crear_tramite", `Creó trámite: ${typeLabel}`)
      toast({ title: "✅ Trámite creado exitosamente" })
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
    const statusLabel = STATUS_OPTIONS.find(s => s.value === status)?.label || status
    logAction("cambiar_status_tramite", `Cambió status de trámite a: ${statusLabel}`)
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

  // --- Edit procedure ---
  const openEditDialog = (procedure: Procedure) => {
    setEditingProcedure({ ...procedure })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingProcedure) return
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase.from("procedures").update({
      responsible: editingProcedure.responsible,
      comments: editingProcedure.comments,
      specific_data: editingProcedure.specific_data,
      updated_by: userData?.user?.id,
      updated_at: new Date().toISOString(),
    }).eq("id", editingProcedure.id)

    if (!error) {
      setEditDialogOpen(false)
      setEditingProcedure(null)
      loadProcedures()
      logAction("editar_tramite", `Editó trámite`)
      toast({ title: "✅ Trámite actualizado" })
    }
  }

  // --- File upload for ISN ---
  const handleFileUpload = async (file: File, procedureId: string) => {
    setUploading(true)
    try {
      const filePath = `procedures/${procedureId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from("client-documents")
        .upload(filePath, file, { contentType: file.type || "application/octet-stream", upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("client-documents").getPublicUrl(filePath)
      const fileUrl = urlData?.publicUrl || filePath

      // Update specific_data with file info
      const procedure = procedures.find(p => p.id === procedureId)
      if (procedure) {
        const updatedData = { ...(procedure.specific_data || {}), archivo_nombre: file.name, archivo_url: fileUrl }
        await supabase.from("procedures").update({ specific_data: updatedData, updated_at: new Date().toISOString() }).eq("id", procedureId)

        // Also update editingProcedure if open
        if (editingProcedure?.id === procedureId) {
          setEditingProcedure({ ...editingProcedure, specific_data: updatedData })
        }
        loadProcedures()
        toast({ title: "✅ Archivo subido exitosamente" })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast({ title: "Error al subir archivo", description: msg, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status)
    return statusOption ? (
      <Badge className={statusOption.color}>{statusOption.label}</Badge>
    ) : null
  }

  const proceduresByType = (type: string) => procedures.filter((p) => p.procedure_type === type)

  // --- ISN specific fields renderer ---
  function renderISNFields(
    data: typeof emptyISNData,
    onChange: (field: string, value: string) => void,
    readOnly = false
  ) {
    return (
      <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Datos del Alta de ISN
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">RFC</label>
            <Input placeholder="ABC123456XYZ" value={data.rfc || ""} readOnly={readOnly}
              onChange={e => onChange("rfc", e.target.value)} className="h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Razón Social</label>
            <Input placeholder="Empresa SA de CV" value={data.razon_social || ""} readOnly={readOnly}
              onChange={e => onChange("razon_social", e.target.value)} className="h-9" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Domicilio Fiscal</label>
            <Input placeholder="Calle, número, colonia, CP" value={data.domicilio_fiscal || ""} readOnly={readOnly}
              onChange={e => onChange("domicilio_fiscal", e.target.value)} className="h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Estado</label>
            {readOnly ? (
              <Input value={data.estado || ""} readOnly className="h-9" />
            ) : (
              <Select value={data.estado || ""} onValueChange={v => onChange("estado", v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_MEXICO.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Porcentaje ISN (%)</label>
            <Input placeholder="3.0" type="number" step="0.1" value={data.porcentaje_isn || ""} readOnly={readOnly}
              onChange={e => onChange("porcentaje_isn", e.target.value)} className="h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha de Solicitud</label>
            <Input type="date" value={data.fecha_solicitud || ""} readOnly={readOnly}
              onChange={e => {
                onChange("fecha_solicitud", e.target.value)
                if (!readOnly) onChange("fecha_estimada_resolucion", calcEstimatedResolution(e.target.value))
              }} className="h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha Estimada de Resolución</label>
            <Input type="date" value={data.fecha_estimada_resolucion || ""} readOnly
              className="h-9 bg-slate-100" />
            <p className="text-[10px] text-slate-400 mt-0.5">Se calcula automáticamente (5 días hábiles)</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha Real de Resolución</label>
            <Input type="date" value={data.fecha_resolucion || ""} readOnly={readOnly}
              onChange={e => onChange("fecha_resolucion", e.target.value)} className="h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">No. Registro ISN</label>
            <Input placeholder="Se asigna al resolver" value={data.numero_registro_isn || ""} readOnly={readOnly}
              onChange={e => onChange("numero_registro_isn", e.target.value)} className="h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Período de Inicio</label>
            <Input placeholder="Ej: Marzo 2025" value={data.periodo_inicio || ""} readOnly={readOnly}
              onChange={e => onChange("periodo_inicio", e.target.value)} className="h-9" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Base de Cálculo</label>
            <Input placeholder="Nómina, prestaciones..." value={data.base_calculo || ""} readOnly={readOnly}
              onChange={e => onChange("base_calculo", e.target.value)} className="h-9" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Notas Adicionales</label>
            <Textarea placeholder="Observaciones del trámite..." value={data.notas_adicionales || ""} readOnly={readOnly}
              onChange={e => onChange("notas_adicionales", e.target.value)} rows={2} />
          </div>
        </div>
      </div>
    )
  }

  // --- ISN card detail renderer ---
  function renderISNDetail(data: typeof emptyISNData, procedureId: string) {
    return (
      <div className="mt-3 space-y-2 bg-slate-50 rounded-lg p-3 border">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Datos ISN</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
          {data.rfc && <div><span className="text-slate-500">RFC:</span> <span className="font-medium">{data.rfc}</span></div>}
          {data.razon_social && <div className="col-span-2"><span className="text-slate-500">Razón Social:</span> <span className="font-medium">{data.razon_social}</span></div>}
          {data.estado && <div><span className="text-slate-500">Estado:</span> <span className="font-medium">{data.estado}</span></div>}
          {data.porcentaje_isn && <div><span className="text-slate-500">% ISN:</span> <span className="font-medium">{data.porcentaje_isn}%</span></div>}
          {data.numero_registro_isn && <div><span className="text-slate-500">Registro:</span> <span className="font-medium text-cyan-700">{data.numero_registro_isn}</span></div>}
          {data.fecha_solicitud && <div><span className="text-slate-500">Solicitud:</span> <span className="font-medium">{new Date(data.fecha_solicitud + "T12:00:00").toLocaleDateString("es-MX")}</span></div>}
          {data.fecha_estimada_resolucion && <div><span className="text-slate-500">Est. Resolución:</span> <span className="font-medium">{new Date(data.fecha_estimada_resolucion + "T12:00:00").toLocaleDateString("es-MX")}</span></div>}
          {data.fecha_resolucion && <div><span className="text-slate-500">Resolución:</span> <span className="font-medium text-green-600">{new Date(data.fecha_resolucion + "T12:00:00").toLocaleDateString("es-MX")}</span></div>}
          {data.periodo_inicio && <div><span className="text-slate-500">Período:</span> <span className="font-medium">{data.periodo_inicio}</span></div>}
          {data.base_calculo && <div><span className="text-slate-500">Base:</span> <span className="font-medium">{data.base_calculo}</span></div>}
        </div>
        {data.notas_adicionales && <p className="text-xs text-slate-500 mt-1">{data.notas_adicionales}</p>}
        {data.archivo_url ? (
          <a href={data.archivo_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-800 font-medium mt-1">
            <ExternalLink className="h-3 w-3" /> {data.archivo_nombre || "Ver constancia"}
          </a>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Sin constancia adjunta
            </span>
            {!isClient && (
              <>
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], procedureId) }} />
                <Button variant="outline" size="sm" className="h-6 text-xs gap-1"
                  onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  Subir
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

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
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Trámite</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Trámite</label>
                  <Select
                    value={newProcedure.procedure_type}
                    onValueChange={(value) => {
                      const sd = value === "alta_isn" ? { ...emptyISNData } : {}
                      setNewProcedure({ ...newProcedure, procedure_type: value, specific_data: sd })
                    }}
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

                {/* ISN-specific fields */}
                {newProcedure.procedure_type === "alta_isn" && renderISNFields(
                  newProcedure.specific_data as typeof emptyISNData,
                  (field, value) => setNewProcedure({
                    ...newProcedure,
                    specific_data: { ...newProcedure.specific_data, [field]: value }
                  })
                )}

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

      {/* Tabs por tipo de trámite — horizontal scroll to avoid overlap */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <TabsList className="inline-flex h-auto gap-2 bg-transparent p-0 whitespace-nowrap">
            {PROCEDURE_TYPES.map((type) => {
              const Icon = type.icon
              const count = proceduresByType(type.value).length
              return (
                <TabsTrigger
                  key={type.value}
                  value={type.value}
                  className="data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-800 border shrink-0"
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
        </div>

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

                                {/* ISN-specific detail */}
                                {procedure.procedure_type === "alta_isn" &&
                                  renderISNDetail(procedure.specific_data as typeof emptyISNData, procedure.id)}

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
                                <div className="flex flex-col gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-500 hover:text-cyan-700"
                                    onClick={() => openEditDialog(procedure)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteProcedure(procedure.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Editar Trámite
            </DialogTitle>
          </DialogHeader>
          {editingProcedure && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Responsable</label>
                <Input
                  value={editingProcedure.responsible || ""}
                  onChange={e => setEditingProcedure({ ...editingProcedure, responsible: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Comentarios</label>
                <Textarea
                  value={editingProcedure.comments || ""}
                  onChange={e => setEditingProcedure({ ...editingProcedure, comments: e.target.value })}
                />
              </div>

              {/* ISN-specific edit fields */}
              {editingProcedure.procedure_type === "alta_isn" && renderISNFields(
                (editingProcedure.specific_data || {}) as typeof emptyISNData,
                (field, value) => setEditingProcedure({
                  ...editingProcedure,
                  specific_data: { ...editingProcedure.specific_data, [field]: value }
                })
              )}

              {/* File upload in edit dialog for ISN */}
              {editingProcedure.procedure_type === "alta_isn" && (
                <div className="border-2 border-dashed border-cyan-200 rounded-lg p-4 text-center bg-cyan-50/50">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="edit-file-input"
                    onChange={e => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0], editingProcedure.id)
                    }} />
                  {(editingProcedure.specific_data as typeof emptyISNData).archivo_url ? (
                    <div className="space-y-2">
                      <a href={(editingProcedure.specific_data as typeof emptyISNData).archivo_url}
                        target="_blank" rel="noopener noreferrer"
                        className="text-cyan-600 hover:text-cyan-800 text-sm font-medium flex items-center justify-center gap-1">
                        <ExternalLink className="h-4 w-4" />
                        {(editingProcedure.specific_data as typeof emptyISNData).archivo_nombre || "Ver archivo"}
                      </a>
                      <Button variant="outline" size="sm" className="gap-1"
                        onClick={() => document.getElementById("edit-file-input")?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Reemplazar archivo
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" className="gap-2 border-cyan-300 text-cyan-700 hover:bg-cyan-100"
                      onClick={() => document.getElementById("edit-file-input")?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading ? "Subiendo..." : "Subir constancia ISN"}
                    </Button>
                  )}
                </div>
              )}

              <Button onClick={handleSaveEdit} className="w-full bg-cyan-600 hover:bg-cyan-700">
                Guardar Cambios
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
