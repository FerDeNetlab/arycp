"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Plus, Trash2, Scale, FileText, Calendar, Gavel,
  Clock, MapPin, CheckCircle2, AlertCircle, Users
} from "lucide-react"
import { toast } from "sonner"

interface JudicialFullSectionProps {
  clientId: string
  clientName: string
  clientEmail?: string
  userRole?: string
}

interface JudicialCase {
  id: string
  case_type: string
  case_number: string
  authority: string
  process_stage: string
  status: string
  start_date: string
  lawyer_responsible: string
  comments: string
  is_reviewed: boolean
}

interface JudicialAction {
  id: string
  case_id: string
  action_type: string
  action_date: string
  description: string
  status: string
  is_reviewed: boolean
}

interface JudicialHearing {
  id: string
  case_id: string
  hearing_type: string
  hearing_date: string
  hearing_time: string
  location: string
  attended: boolean
  result: string
  comments: string
  is_reviewed: boolean
}

interface JudicialDocument {
  id: string
  case_id: string
  document_type: string
  document_date: string
  file_url: string
  file_name: string
  is_reviewed: boolean
  comments: string
}

const CASE_TYPES = [
  { value: "laboral", label: "Laboral" },
  { value: "civil", label: "Civil" },
  { value: "mercantil", label: "Mercantil" },
  { value: "administrativo", label: "Administrativo" },
  { value: "familiar", label: "Familiar" },
  { value: "otro", label: "Otro" },
]

const PROCESS_STAGES = [
  { value: "inicio", label: "Inicio" },
  { value: "demanda_presentada", label: "Demanda Presentada" },
  { value: "en_tramite", label: "En Trámite" },
  { value: "audiencias", label: "Audiencias" },
  { value: "resolucion", label: "Resolución" },
  { value: "concluido", label: "Concluido" },
]

const CASE_STATUSES = [
  { value: "activo", label: "Activo", color: "bg-blue-100 text-blue-700" },
  { value: "en_proceso", label: "En Proceso", color: "bg-yellow-100 text-yellow-700" },
  { value: "concluido", label: "Concluido", color: "bg-green-100 text-green-700" },
]

const ACTION_TYPES = [
  { value: "presentacion_escrito", label: "Presentación de Escrito" },
  { value: "notificacion", label: "Notificación" },
  { value: "acuerdo", label: "Acuerdo" },
  { value: "resolucion", label: "Resolución" },
  { value: "otro", label: "Otro" },
]

const HEARING_TYPES = [
  { value: "audiencia", label: "Audiencia" },
  { value: "citatorio", label: "Citatorio" },
  { value: "vencimiento", label: "Vencimiento de Término" },
]

const DOCUMENT_TYPES = [
  { value: "demanda", label: "Demanda" },
  { value: "contestacion", label: "Contestación" },
  { value: "acuerdo", label: "Acuerdo" },
  { value: "sentencia", label: "Sentencia" },
  { value: "notificacion", label: "Notificación" },
  { value: "otro", label: "Otro" },
]

export function JudicialFullSection({ clientId, clientName, userRole }: JudicialFullSectionProps) {
  const isClient = userRole === "cliente"
  const [cases, setCases] = useState<JudicialCase[]>([])
  const [actions, setActions] = useState<JudicialAction[]>([])
  const [hearings, setHearings] = useState<JudicialHearing[]>([])
  const [documents, setDocuments] = useState<JudicialDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState<string | null>(null)

  // Dialog states
  const [showCaseDialog, setShowCaseDialog] = useState(false)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [showHearingDialog, setShowHearingDialog] = useState(false)
  const [showDocumentDialog, setShowDocumentDialog] = useState(false)

  // Form states
  const [newCase, setNewCase] = useState({
    case_type: "",
    case_number: "",
    authority: "",
    process_stage: "inicio",
    status: "activo",
    start_date: "",
    lawyer_responsible: "",
    comments: "",
  })

  const [newAction, setNewAction] = useState({
    case_id: "",
    action_type: "",
    action_date: "",
    description: "",
  })

  const [newHearing, setNewHearing] = useState({
    case_id: "",
    hearing_type: "",
    hearing_date: "",
    hearing_time: "",
    location: "",
    comments: "",
  })

  const [newDocument, setNewDocument] = useState({
    case_id: "",
    document_type: "",
    document_date: "",
    file_url: "",
    file_name: "",
    comments: "",
  })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [clientId])

  const loadData = async () => {
    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) {
      setLoading(false)
      return
    }

    // Cargar casos
    const { data: casesData } = await supabase
      .from("judicial_cases")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (casesData) setCases(casesData)

    // Cargar actuaciones
    const { data: actionsData } = await supabase
      .from("judicial_actions")
      .select("*")
      .eq("client_id", clientId)
      .order("action_date", { ascending: false })

    if (actionsData) setActions(actionsData)

    // Cargar audiencias
    const { data: hearingsData } = await supabase
      .from("judicial_hearings")
      .select("*")
      .eq("client_id", clientId)
      .order("hearing_date", { ascending: true })

    if (hearingsData) setHearings(hearingsData)

    // Cargar documentos
    const { data: documentsData } = await supabase
      .from("judicial_documents")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (documentsData) setDocuments(documentsData)

    setLoading(false)
  }

  // CRUD para Casos
  const handleAddCase = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    const { error } = await supabase.from("judicial_cases").insert({
      client_id: clientId,
      user_id: userData.user.id,
      ...newCase,
      created_by: userData.user.id,
    })

    if (error) {
      toast.error("Error al crear el caso")
      return
    }

    toast.success("Caso creado correctamente")
    setShowCaseDialog(false)
    setNewCase({
      case_type: "",
      case_number: "",
      authority: "",
      process_stage: "inicio",
      status: "activo",
      start_date: "",
      lawyer_responsible: "",
      comments: "",
    })
    loadData()
  }

  const handleUpdateCaseStatus = async (caseId: string, status: string) => {
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("judicial_cases")
      .update({ status, updated_by: userData?.user?.id, updated_at: new Date().toISOString() })
      .eq("id", caseId)

    if (!error) {
      loadData()
      toast.success("Estado actualizado")
    }
  }

  const handleUpdateCaseStage = async (caseId: string, process_stage: string) => {
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("judicial_cases")
      .update({ process_stage, updated_by: userData?.user?.id, updated_at: new Date().toISOString() })
      .eq("id", caseId)

    if (!error) {
      loadData()
      toast.success("Etapa actualizada")
    }
  }

  const handleDeleteCase = async (caseId: string) => {
    const { error } = await supabase.from("judicial_cases").delete().eq("id", caseId)
    if (!error) {
      loadData()
      toast.success("Caso eliminado")
    }
  }

  const handleToggleCaseReviewed = async (caseId: string, isReviewed: boolean) => {
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("judicial_cases")
      .update({ is_reviewed: isReviewed, updated_by: userData?.user?.id })
      .eq("id", caseId)

    if (!error) loadData()
  }

  // CRUD para Actuaciones
  const handleAddAction = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    const { error } = await supabase.from("judicial_actions").insert({
      client_id: clientId,
      user_id: userData.user.id,
      ...newAction,
      created_by: userData.user.id,
    })

    if (error) {
      toast.error("Error al crear la actuación")
      return
    }

    toast.success("Actuación creada correctamente")
    setShowActionDialog(false)
    setNewAction({ case_id: "", action_type: "", action_date: "", description: "" })
    loadData()
  }

  const handleUpdateActionStatus = async (actionId: string, status: string) => {
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("judicial_actions")
      .update({ status, updated_by: userData?.user?.id })
      .eq("id", actionId)

    if (!error) {
      loadData()
      toast.success("Estado actualizado")
    }
  }

  const handleDeleteAction = async (actionId: string) => {
    const { error } = await supabase.from("judicial_actions").delete().eq("id", actionId)
    if (!error) {
      loadData()
      toast.success("Actuación eliminada")
    }
  }

  // CRUD para Audiencias
  const handleAddHearing = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    const { error } = await supabase.from("judicial_hearings").insert({
      client_id: clientId,
      user_id: userData.user.id,
      ...newHearing,
      created_by: userData.user.id,
    })

    if (error) {
      toast.error("Error al crear la audiencia")
      return
    }

    toast.success("Audiencia creada correctamente")
    setShowHearingDialog(false)
    setNewHearing({ case_id: "", hearing_type: "", hearing_date: "", hearing_time: "", location: "", comments: "" })
    loadData()
  }

  const handleToggleHearingAttended = async (hearingId: string, attended: boolean) => {
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("judicial_hearings")
      .update({ attended, updated_by: userData?.user?.id })
      .eq("id", hearingId)

    if (!error) loadData()
  }

  const handleUpdateHearingResult = async (hearingId: string, result: string) => {
    const { data: userData } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("judicial_hearings")
      .update({ result, updated_by: userData?.user?.id })
      .eq("id", hearingId)

    if (!error) loadData()
  }

  const handleDeleteHearing = async (hearingId: string) => {
    const { error } = await supabase.from("judicial_hearings").delete().eq("id", hearingId)
    if (!error) {
      loadData()
      toast.success("Audiencia eliminada")
    }
  }

  // CRUD para Documentos
  const handleAddDocument = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    const { error } = await supabase.from("judicial_documents").insert({
      client_id: clientId,
      user_id: userData.user.id,
      ...newDocument,
      created_by: userData.user.id,
    })

    if (error) {
      toast.error("Error al crear el documento")
      return
    }

    toast.success("Documento creado correctamente")
    setShowDocumentDialog(false)
    setNewDocument({ case_id: "", document_type: "", document_date: "", file_url: "", file_name: "", comments: "" })
    loadData()
  }

  const handleDeleteDocument = async (documentId: string) => {
    const { error } = await supabase.from("judicial_documents").delete().eq("id", documentId)
    if (!error) {
      loadData()
      toast.success("Documento eliminado")
    }
  }

  const getCaseById = (caseId: string) => cases.find(c => c.id === caseId)

  // Filtrar por caso seleccionado
  const filteredActions = selectedCase ? actions.filter(a => a.case_id === selectedCase) : actions
  const filteredHearings = selectedCase ? hearings.filter(h => h.case_id === selectedCase) : hearings
  const filteredDocuments = selectedCase ? documents.filter(d => d.case_id === selectedCase) : documents

  // Estadísticas
  const activeCases = cases.filter(c => c.status === "activo").length
  const upcomingHearings = hearings.filter(h => new Date(h.hearing_date) >= new Date() && !h.attended).length
  const pendingActions = actions.filter(a => a.status === "pendiente").length

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando información judicial...</div>
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Scale className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-700">{cases.length}</p>
                <p className="text-sm text-purple-600">Asuntos Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Gavel className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{activeCases}</p>
                <p className="text-sm text-blue-600">Casos Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-700">{upcomingHearings}</p>
                <p className="text-sm text-orange-600">Audiencias Próximas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-700">{pendingActions}</p>
                <p className="text-sm text-yellow-600">Actuaciones Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro por caso */}
      {cases.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label>Filtrar por Asunto:</Label>
              <Select value={selectedCase || "all"} onValueChange={(v) => setSelectedCase(v === "all" ? null : v)}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Todos los asuntos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los asuntos</SelectItem>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.case_number || "Sin número"} - {CASE_TYPES.find(t => t.value === c.case_type)?.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cases" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Asuntos ({cases.length})
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Actuaciones ({filteredActions.length})
          </TabsTrigger>
          <TabsTrigger value="hearings" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Audiencias ({filteredHearings.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos ({filteredDocuments.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Asuntos/Expedientes */}
        <TabsContent value="cases">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-purple-600" />
                Asuntos Judiciales
              </CardTitle>
              {!isClient && (
                <Dialog open={showCaseDialog} onOpenChange={setShowCaseDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Asunto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Nuevo Asunto Judicial</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo de Asunto *</Label>
                          <Select value={newCase.case_type} onValueChange={(v) => setNewCase({ ...newCase, case_type: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {CASE_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Número de Expediente</Label>
                          <Input
                            value={newCase.case_number}
                            onChange={(e) => setNewCase({ ...newCase, case_number: e.target.value })}
                            placeholder="Ej: 123/2024"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Juzgado/Autoridad</Label>
                        <Input
                          value={newCase.authority}
                          onChange={(e) => setNewCase({ ...newCase, authority: e.target.value })}
                          placeholder="Ej: Juzgado Primero Civil"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Fecha de Inicio</Label>
                          <Input
                            type="date"
                            value={newCase.start_date}
                            onChange={(e) => setNewCase({ ...newCase, start_date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Abogado Responsable</Label>
                          <Input
                            value={newCase.lawyer_responsible}
                            onChange={(e) => setNewCase({ ...newCase, lawyer_responsible: e.target.value })}
                            placeholder="Nombre del abogado"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Comentarios</Label>
                        <Textarea
                          value={newCase.comments}
                          onChange={(e) => setNewCase({ ...newCase, comments: e.target.value })}
                          placeholder="Notas adicionales..."
                        />
                      </div>
                      <Button onClick={handleAddCase} className="w-full bg-purple-600 hover:bg-purple-700" disabled={!newCase.case_type}>
                        Crear Asunto
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {cases.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay asuntos judiciales registrados</p>
              ) : (
                <div className="space-y-4">
                  {cases.map((caseItem) => (
                    <Card key={caseItem.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                {CASE_TYPES.find(t => t.value === caseItem.case_type)?.label}
                              </Badge>
                              {caseItem.case_number && (
                                <span className="font-mono text-sm">Exp: {caseItem.case_number}</span>
                              )}
                              <Badge className={CASE_STATUSES.find(s => s.value === caseItem.status)?.color}>
                                {CASE_STATUSES.find(s => s.value === caseItem.status)?.label}
                              </Badge>
                            </div>

                            {caseItem.authority && (
                              <p className="text-sm"><strong>Autoridad:</strong> {caseItem.authority}</p>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {caseItem.start_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Inicio: {new Date(caseItem.start_date).toLocaleDateString()}
                                </span>
                              )}
                              {caseItem.lawyer_responsible && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {caseItem.lawyer_responsible}
                                </span>
                              )}
                            </div>

                            {caseItem.comments && (
                              <p className="text-sm text-muted-foreground">{caseItem.comments}</p>
                            )}

                            {!isClient && (
                              <div className="flex items-center gap-4 pt-2">
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">Etapa:</Label>
                                  <Select
                                    value={caseItem.process_stage}
                                    onValueChange={(v) => handleUpdateCaseStage(caseItem.id, v)}
                                  >
                                    <SelectTrigger className="h-7 text-xs w-[150px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PROCESS_STAGES.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">Estado:</Label>
                                  <Select
                                    value={caseItem.status}
                                    onValueChange={(v) => handleUpdateCaseStatus(caseItem.id, v)}
                                  >
                                    <SelectTrigger className="h-7 text-xs w-[120px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {CASE_STATUSES.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                            {isClient && (
                              <div className="flex items-center gap-4 pt-2">
                                <Badge variant="outline">
                                  Etapa: {PROCESS_STAGES.find(s => s.value === caseItem.process_stage)?.label}
                                </Badge>
                              </div>
                            )}
                          </div>

                          {!isClient && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={caseItem.is_reviewed}
                                  onCheckedChange={(checked) => handleToggleCaseReviewed(caseItem.id, !!checked)}
                                />
                                <Label className="text-xs">Revisado</Label>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteCase(caseItem.id)}
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

        {/* Tab: Actuaciones */}
        <TabsContent value="actions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Actuaciones
              </CardTitle>
              <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700" disabled={cases.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Actuación
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Actuación</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Asunto *</Label>
                      <Select value={newAction.case_id} onValueChange={(v) => setNewAction({ ...newAction, case_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar asunto" />
                        </SelectTrigger>
                        <SelectContent>
                          {cases.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.case_number || "Sin número"} - {CASE_TYPES.find(t => t.value === c.case_type)?.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo *</Label>
                        <Select value={newAction.action_type} onValueChange={(v) => setNewAction({ ...newAction, action_type: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de actuación" />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTION_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha *</Label>
                        <Input
                          type="date"
                          value={newAction.action_date}
                          onChange={(e) => setNewAction({ ...newAction, action_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={newAction.description}
                        onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                        placeholder="Descripción de la actuación..."
                      />
                    </div>
                    <Button
                      onClick={handleAddAction}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={!newAction.case_id || !newAction.action_type || !newAction.action_date}
                    >
                      Crear Actuación
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {filteredActions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {cases.length === 0 ? "Primero crea un asunto judicial" : "No hay actuaciones registradas"}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredActions.map((action) => {
                    const caseInfo = getCaseById(action.case_id)
                    return (
                      <div key={action.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {ACTION_TYPES.find(t => t.value === action.action_type)?.label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(action.action_date).toLocaleDateString()}
                            </span>
                            {caseInfo && (
                              <Badge variant="secondary" className="text-xs">
                                Exp: {caseInfo.case_number || "S/N"}
                              </Badge>
                            )}
                          </div>
                          {action.description && (
                            <p className="text-sm mt-1">{action.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={action.status}
                            onValueChange={(v) => handleUpdateActionStatus(action.id, v)}
                          >
                            <SelectTrigger className="h-8 w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="realizada">Realizada</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleDeleteAction(action.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Audiencias */}
        <TabsContent value="hearings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Audiencias y Fechas
              </CardTitle>
              <Dialog open={showHearingDialog} onOpenChange={setShowHearingDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700" disabled={cases.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Audiencia
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Audiencia</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Asunto *</Label>
                      <Select value={newHearing.case_id} onValueChange={(v) => setNewHearing({ ...newHearing, case_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar asunto" />
                        </SelectTrigger>
                        <SelectContent>
                          {cases.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.case_number || "Sin número"} - {CASE_TYPES.find(t => t.value === c.case_type)?.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo *</Label>
                      <Select value={newHearing.hearing_type} onValueChange={(v) => setNewHearing({ ...newHearing, hearing_type: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de fecha" />
                        </SelectTrigger>
                        <SelectContent>
                          {HEARING_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fecha *</Label>
                        <Input
                          type="date"
                          value={newHearing.hearing_date}
                          onChange={(e) => setNewHearing({ ...newHearing, hearing_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hora</Label>
                        <Input
                          type="time"
                          value={newHearing.hearing_time}
                          onChange={(e) => setNewHearing({ ...newHearing, hearing_time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Lugar</Label>
                      <Input
                        value={newHearing.location}
                        onChange={(e) => setNewHearing({ ...newHearing, location: e.target.value })}
                        placeholder="Dirección o sala"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Comentarios</Label>
                      <Textarea
                        value={newHearing.comments}
                        onChange={(e) => setNewHearing({ ...newHearing, comments: e.target.value })}
                      />
                    </div>
                    <Button
                      onClick={handleAddHearing}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={!newHearing.case_id || !newHearing.hearing_type || !newHearing.hearing_date}
                    >
                      Crear Audiencia
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {filteredHearings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {cases.length === 0 ? "Primero crea un asunto judicial" : "No hay audiencias registradas"}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredHearings.map((hearing) => {
                    const caseInfo = getCaseById(hearing.case_id)
                    const isPast = new Date(hearing.hearing_date) < new Date()
                    const isUpcoming = !isPast && !hearing.attended

                    return (
                      <Card key={hearing.id} className={`border-l-4 ${isUpcoming ? "border-l-orange-500 bg-orange-50/50" : hearing.attended ? "border-l-green-500" : "border-l-gray-300"}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <Badge variant={isUpcoming ? "default" : "secondary"} className={isUpcoming ? "bg-orange-500" : ""}>
                                  {HEARING_TYPES.find(t => t.value === hearing.hearing_type)?.label}
                                </Badge>
                                <span className="font-medium">
                                  {new Date(hearing.hearing_date).toLocaleDateString()}
                                  {hearing.hearing_time && ` - ${hearing.hearing_time}`}
                                </span>
                                {caseInfo && (
                                  <Badge variant="outline" className="text-xs">
                                    Exp: {caseInfo.case_number || "S/N"}
                                  </Badge>
                                )}
                              </div>

                              {hearing.location && (
                                <p className="text-sm flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {hearing.location}
                                </p>
                              )}

                              {hearing.comments && (
                                <p className="text-sm text-muted-foreground">{hearing.comments}</p>
                              )}

                              {hearing.attended && (
                                <div className="space-y-2">
                                  <Label className="text-xs">Resultado:</Label>
                                  <Input
                                    value={hearing.result || ""}
                                    onChange={(e) => handleUpdateHearingResult(hearing.id, e.target.value)}
                                    placeholder="Resultado de la audiencia..."
                                    className="text-sm"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={hearing.attended}
                                  onCheckedChange={(checked) => handleToggleHearingAttended(hearing.id, !!checked)}
                                />
                                <Label className="text-xs">
                                  {hearing.attended ? (
                                    <span className="flex items-center gap-1 text-green-600">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Asistida
                                    </span>
                                  ) : (
                                    "Marcar asistencia"
                                  )}
                                </Label>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500"
                                onClick={() => handleDeleteHearing(hearing.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Documentos Judiciales
              </CardTitle>
              <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Documento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo Documento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {cases.length > 0 && (
                      <div className="space-y-2">
                        <Label>Asunto (opcional)</Label>
                        <Select value={newDocument.case_id} onValueChange={(v) => setNewDocument({ ...newDocument, case_id: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sin asunto específico" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin asunto específico</SelectItem>
                            {cases.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.case_number || "Sin número"} - {CASE_TYPES.find(t => t.value === c.case_type)?.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo *</Label>
                        <Select value={newDocument.document_type} onValueChange={(v) => setNewDocument({ ...newDocument, document_type: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de documento" />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha</Label>
                        <Input
                          type="date"
                          value={newDocument.document_date}
                          onChange={(e) => setNewDocument({ ...newDocument, document_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre del archivo *</Label>
                      <Input
                        value={newDocument.file_name}
                        onChange={(e) => setNewDocument({ ...newDocument, file_name: e.target.value })}
                        placeholder="Ej: Demanda inicial"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL del archivo *</Label>
                      <Input
                        value={newDocument.file_url}
                        onChange={(e) => setNewDocument({ ...newDocument, file_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Comentarios</Label>
                      <Textarea
                        value={newDocument.comments}
                        onChange={(e) => setNewDocument({ ...newDocument, comments: e.target.value })}
                      />
                    </div>
                    <Button
                      onClick={handleAddDocument}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={!newDocument.document_type || !newDocument.file_url || !newDocument.file_name}
                    >
                      Crear Documento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {filteredDocuments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay documentos registrados</p>
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => {
                    const caseInfo = doc.case_id ? getCaseById(doc.case_id) : null
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-600" />
                            <Badge variant="outline">
                              {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label}
                            </Badge>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="font-medium text-purple-600 hover:underline">
                              {doc.file_name}
                            </a>
                            {caseInfo && (
                              <Badge variant="secondary" className="text-xs">
                                Exp: {caseInfo.case_number || "S/N"}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            {doc.document_date && (
                              <span>{new Date(doc.document_date).toLocaleDateString()}</span>
                            )}
                            {doc.comments && <span>{doc.comments}</span>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
