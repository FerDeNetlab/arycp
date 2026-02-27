"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Trash2,
  FileText,
  DollarSign,
  Upload,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  CreditCard,
  FolderOpen,
  User
} from "lucide-react"
import { toast } from "sonner"

interface FiscalFullSectionProps {
  clientId: string
  clientName: string
  clientEmail?: string | null
  userRole?: string
}

interface FiscalProfile {
  id: string
  taxpayer_type: string | null
  tax_regime: string | null
  periodicity: string | null
  notes: string | null
}

interface FiscalObligation {
  id: string
  obligation_type: string
  period_month: number
  period_year: number
  status: string
  due_date: string | null
  presentation_date: string | null
  responsible: string | null
  comments: string | null
  result: string | null
  amount: number | null
  evidence_url: string | null
  is_reviewed: boolean
}

interface FiscalPayment {
  id: string
  obligation_id: string | null
  amount: number
  capture_line: string | null
  complementary_number: string | null
  payment_date: string | null
  status: string
  receipt_url: string | null
  comments: string | null
}

interface FiscalDocument {
  id: string
  document_type: string
  period_month: number | null
  period_year: number | null
  file_url: string
  file_name: string | null
  is_reviewed: boolean
  comments: string | null
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const OBLIGATION_TYPES = [
  "ISR Provisional",
  "IVA Mensual",
  "IEPS",
  "Retenciones ISR",
  "Retenciones IVA",
  "Declaración Anual PF",
  "Declaración Anual PM",
  "DIOT",
  "Contabilidad Electrónica",
  "Otro"
]

const DOCUMENT_TYPES = [
  { value: "acuse", label: "Acuse de Declaración" },
  { value: "declaracion", label: "Declaración Completa" },
  { value: "opinion_cumplimiento", label: "Opinión de Cumplimiento" },
  { value: "constancia_fiscal", label: "Constancia de Situación Fiscal" },
  { value: "pago_comprobante", label: "Comprobante de Pago" },
  { value: "otro", label: "Otro" }
]

const TAX_REGIMES = [
  "General de Ley Personas Morales",
  "Personas Morales con Fines no Lucrativos",
  "Régimen Simplificado de Confianza (RESICO)",
  "Actividades Empresariales y Profesionales",
  "Arrendamiento",
  "Sueldos y Salarios",
  "Intereses",
  "Dividendos",
  "Otro"
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function FiscalFullSection({ clientId, clientName, clientEmail, userRole }: FiscalFullSectionProps) {
  const isClient = userRole === "cliente"
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState("obligations")
  const [loading, setLoading] = useState(true)

  // Data states
  const [profile, setProfile] = useState<FiscalProfile | null>(null)
  const [obligations, setObligations] = useState<FiscalObligation[]>([])
  const [payments, setPayments] = useState<FiscalPayment[]>([])
  const [documents, setDocuments] = useState<FiscalDocument[]>([])

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Dialog states
  const [showObligationDialog, setShowObligationDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showDocumentDialog, setShowDocumentDialog] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)

  // Form states
  const [obligationForm, setObligationForm] = useState({
    obligation_type: "",
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    due_date: "",
    responsible: "",
    comments: ""
  })

  const [paymentForm, setPaymentForm] = useState({
    status: "pendiente",
    amount: "",
    capture_line: "",
    complementary_number: "",
    payment_date: "",
    comments: ""
  })

  const [documentForm, setDocumentForm] = useState({
    document_type: "",
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    comments: ""
  })
  const [documentFile, setDocumentFile] = useState<File | null>(null)

  const [profileForm, setProfileForm] = useState({
    taxpayer_type: "",
    tax_regime: "",
    periodicity: "",
    notes: ""
  })

  useEffect(() => {
    loadAllData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  useEffect(() => {
    loadObligations()
    loadPayments()
    loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear])

  const loadAllData = async () => {
    setLoading(true)
    await Promise.all([
      loadProfile(),
      loadObligations(),
      loadPayments(),
      loadDocuments()
    ])
    setLoading(false)
  }

  const loadProfile = async () => {
    const { data } = await supabase
      .from("fiscal_profiles")
      .select("*")
      .eq("client_id", clientId)
      .single()

    if (data) {
      setProfile(data)
      setProfileForm({
        taxpayer_type: data.taxpayer_type || "",
        tax_regime: data.tax_regime || "",
        periodicity: data.periodicity || "",
        notes: data.notes || ""
      })
    }
  }

  const loadObligations = async () => {
    const { data } = await supabase
      .from("fiscal_obligations")
      .select("*")
      .eq("client_id", clientId)
      .eq("period_month", selectedMonth)
      .eq("period_year", selectedYear)
      .order("due_date")

    if (data) setObligations(data)
  }

  const loadPayments = async () => {
    const { data } = await supabase
      .from("fiscal_payments")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (data) setPayments(data)
  }

  const loadDocuments = async () => {
    const { data } = await supabase
      .from("fiscal_documents")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (data) setDocuments(data)
  }

  const saveProfile = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    if (profile) {
      await supabase
        .from("fiscal_profiles")
        .update({
          ...profileForm,
          updated_at: new Date().toISOString()
        })
        .eq("id", profile.id)
    } else {
      await supabase
        .from("fiscal_profiles")
        .insert({
          client_id: clientId,
          user_id: userData.user.id,
          ...profileForm
        })
    }

    toast.success("Perfil fiscal guardado")
    setShowProfileDialog(false)
    loadProfile()
  }

  const addObligation = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    const { error } = await supabase
      .from("fiscal_obligations")
      .insert({
        client_id: clientId,
        user_id: userData.user.id,
        ...obligationForm,
        status: "pendiente"
      })

    if (!error) {
      toast.success("Obligación agregada")
      setShowObligationDialog(false)
      setObligationForm({
        obligation_type: "",
        period_month: selectedMonth,
        period_year: selectedYear,
        due_date: "",
        responsible: "",
        comments: ""
      })
      loadObligations()
    }
  }

  const updateObligationStatus = async (id: string, status: string) => {
    await supabase
      .from("fiscal_obligations")
      .update({
        status,
        presentation_date: status === "presentada" || status === "pagada" ? new Date().toISOString().split("T")[0] : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    loadObligations()
  }

  const updateObligationResult = async (id: string, result: string, amount?: number) => {
    await supabase
      .from("fiscal_obligations")
      .update({
        result,
        amount: amount || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)

    loadObligations()
  }

  const toggleObligationReview = async (id: string, isReviewed: boolean) => {
    await supabase
      .from("fiscal_obligations")
      .update({ is_reviewed: isReviewed })
      .eq("id", id)

    loadObligations()
  }

  const deleteObligation = async (id: string) => {
    await supabase.from("fiscal_obligations").delete().eq("id", id)
    toast.success("Obligación eliminada")
    loadObligations()
  }

  const addPayment = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    const { error } = await supabase
      .from("fiscal_payments")
      .insert({
        client_id: clientId,
        user_id: userData.user.id,
        amount: parseFloat(paymentForm.amount),
        capture_line: paymentForm.capture_line || null,
        complementary_number: paymentForm.complementary_number || null,
        payment_date: paymentForm.payment_date || null,
        comments: paymentForm.comments || null,
        status: paymentForm.status
      })

    if (!error) {
      toast.success("Pago registrado")
      setShowPaymentDialog(false)
      setPaymentForm({
        status: "pendiente",
        amount: "",
        capture_line: "",
        complementary_number: "",
        payment_date: "",
        comments: ""
      })
      loadPayments()
    }
  }

  const markPaymentAsPaid = async (id: string) => {
    await supabase
      .from("fiscal_payments")
      .update({
        status: "pagado",
        payment_date: new Date().toISOString().split("T")[0]
      })
      .eq("id", id)

    toast.success("Pago marcado como pagado")
    loadPayments()
  }

  const deletePayment = async (id: string) => {
    await supabase.from("fiscal_payments").delete().eq("id", id)
    toast.success("Pago eliminado")
    loadPayments()
  }

  const addDocument = async () => {
    if (!documentFile) {
      toast.error("Selecciona un archivo")
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    // Upload file
    // This function is only called from onClick handlers, not during render
    const timestamp = Date.now()
    const fileName = `${clientId}/${timestamp}_${documentFile.name}`
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("client-documents")
      .upload(fileName, documentFile)

    if (uploadError) {
      toast.error("Error al subir archivo")
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from("client-documents")
      .getPublicUrl(fileName)

    const { error } = await supabase
      .from("fiscal_documents")
      .insert({
        client_id: clientId,
        user_id: userData.user.id,
        document_type: documentForm.document_type,
        period_month: documentForm.period_month,
        period_year: documentForm.period_year,
        file_url: publicUrl,
        file_name: documentFile.name,
        comments: documentForm.comments || null
      })

    if (!error) {
      toast.success("Documento agregado")
      setShowDocumentDialog(false)
      setDocumentForm({
        document_type: "",
        period_month: selectedMonth,
        period_year: selectedYear,
        comments: ""
      })
      setDocumentFile(null)
      loadDocuments()
    }
  }

  const toggleDocumentReview = async (id: string, isReviewed: boolean) => {
    await supabase
      .from("fiscal_documents")
      .update({ is_reviewed: isReviewed })
      .eq("id", id)

    loadDocuments()
  }

  const deleteDocument = async (id: string) => {
    await supabase.from("fiscal_documents").delete().eq("id", id)
    toast.success("Documento eliminado")
    loadDocuments()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendiente":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
      case "en_proceso":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><FileText className="h-3 w-3 mr-1" />En Proceso</Badge>
      case "presentada":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><FileCheck className="h-3 w-3 mr-1" />Presentada</Badge>
      case "pagada":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Pagada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getResultBadge = (result: string | null, amount: number | null) => {
    if (!result) return null
    switch (result) {
      case "a_pagar":
        return <Badge className="bg-red-100 text-red-700">A Pagar: ${amount?.toLocaleString() || 0}</Badge>
      case "en_ceros":
        return <Badge className="bg-gray-100 text-gray-700">En Ceros</Badge>
      case "a_favor":
        return <Badge className="bg-green-100 text-green-700">A Favor: ${amount?.toLocaleString() || 0}</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando información fiscal...</div>
  }

  return (
    <div className="space-y-6">
      {/* Perfil Fiscal */}
      <Card className="border-2 border-orange-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              Perfil Fiscal
            </CardTitle>
            {!isClient && (
              <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    {profile ? "Editar" : "Configurar"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Perfil Fiscal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Tipo de Contribuyente</Label>
                      <Select value={profileForm.taxpayer_type} onValueChange={(v) => setProfileForm({ ...profileForm, taxpayer_type: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="persona_fisica">Persona Física</SelectItem>
                          <SelectItem value="persona_moral">Persona Moral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Régimen Fiscal</Label>
                      <Select value={profileForm.tax_regime} onValueChange={(v) => setProfileForm({ ...profileForm, tax_regime: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {TAX_REGIMES.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Periodicidad de Declaraciones</Label>
                      <Select value={profileForm.periodicity} onValueChange={(v) => setProfileForm({ ...profileForm, periodicity: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mensual">Mensual</SelectItem>
                          <SelectItem value="bimestral">Bimestral</SelectItem>
                          <SelectItem value="trimestral">Trimestral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notas</Label>
                      <Textarea
                        value={profileForm.notes}
                        onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
                        placeholder="Notas adicionales..."
                      />
                    </div>
                    <Button onClick={saveProfile} className="w-full">Guardar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <p className="font-medium">{profile.taxpayer_type === "persona_fisica" ? "Persona Física" : profile.taxpayer_type === "persona_moral" ? "Persona Moral" : "Sin definir"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Régimen:</span>
                <p className="font-medium">{profile.tax_regime || "Sin definir"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Periodicidad:</span>
                <p className="font-medium capitalize">{profile.periodicity || "Sin definir"}</p>
              </div>
              {profile.notes && (
                <div className="col-span-2 md:col-span-4">
                  <span className="text-muted-foreground">Notas:</span>
                  <p className="font-medium">{profile.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay perfil fiscal configurado</p>
          )}
        </CardContent>
      </Card>

      {/* Filtro de período */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Período:</span>
            </div>
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="obligations" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Obligaciones
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Documentos
          </TabsTrigger>
        </TabsList>

        {/* Tab Obligaciones */}
        <TabsContent value="obligations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Obligaciones Fiscales - {MONTHS[selectedMonth - 1]} {selectedYear}</h3>
            <Dialog open={showObligationDialog} onOpenChange={setShowObligationDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Obligación
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Obligación Fiscal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo de Obligación</Label>
                    <Select value={obligationForm.obligation_type} onValueChange={(v) => setObligationForm({ ...obligationForm, obligation_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {OBLIGATION_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mes</Label>
                      <Select value={obligationForm.period_month.toString()} onValueChange={(v) => setObligationForm({ ...obligationForm, period_month: parseInt(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m, i) => (
                            <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Año</Label>
                      <Select value={obligationForm.period_year.toString()} onValueChange={(v) => setObligationForm({ ...obligationForm, period_year: parseInt(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[2023, 2024, 2025, 2026].map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Fecha Límite</Label>
                    <Input
                      type="date"
                      value={obligationForm.due_date}
                      onChange={(e) => setObligationForm({ ...obligationForm, due_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Responsable</Label>
                    <Input
                      value={obligationForm.responsible}
                      onChange={(e) => setObligationForm({ ...obligationForm, responsible: e.target.value })}
                      placeholder="Nombre del responsable"
                    />
                  </div>
                  <div>
                    <Label>Comentarios</Label>
                    <Textarea
                      value={obligationForm.comments}
                      onChange={(e) => setObligationForm({ ...obligationForm, comments: e.target.value })}
                    />
                  </div>
                  <Button onClick={addObligation} className="w-full">Agregar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {obligations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                No hay obligaciones para este período
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {obligations.map((ob) => (
                <Card key={ob.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{ob.obligation_type}</h4>
                          {getStatusBadge(ob.status)}
                          {getResultBadge(ob.result, ob.amount)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {ob.due_date && <p>Fecha límite: {new Date(ob.due_date).toLocaleDateString()}</p>}
                          {ob.responsible && <p>Responsable: {ob.responsible}</p>}
                          {ob.comments && <p>Notas: {ob.comments}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Checkbox
                            checked={ob.is_reviewed}
                            onCheckedChange={(c) => toggleObligationReview(ob.id, !!c)}
                          />
                          <span className="text-xs text-muted-foreground">Revisado</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteObligation(ob.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Controles de estado y resultado */}
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                      <Select value={ob.status} onValueChange={(v) => updateObligationStatus(ob.id, v)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_proceso">En Proceso</SelectItem>
                          <SelectItem value="presentada">Presentada</SelectItem>
                          <SelectItem value="pagada">Pagada</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={ob.result || ""} onValueChange={(v) => updateObligationResult(ob.id, v)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Resultado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="a_pagar">A Pagar</SelectItem>
                          <SelectItem value="en_ceros">En Ceros</SelectItem>
                          <SelectItem value="a_favor">A Favor</SelectItem>
                        </SelectContent>
                      </Select>
                      {(ob.result === "a_pagar" || ob.result === "a_favor") && (
                        <Input
                          type="number"
                          placeholder="Monto"
                          className="w-32"
                          value={ob.amount || ""}
                          onChange={(e) => updateObligationResult(ob.id, ob.result!, parseFloat(e.target.value))}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Pagos */}
        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Pagos Fiscales</h3>
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Nuevo Pago
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Pago</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Estado de Pago</Label>
                    <Select value={paymentForm.status} onValueChange={(v) => setPaymentForm({ ...paymentForm, status: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar estado..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">No Pagado</SelectItem>
                        <SelectItem value="pagado">Pagado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Monto</Label>
                    <Input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Línea de Captura</Label>
                    <Input
                      value={paymentForm.capture_line}
                      onChange={(e) => setPaymentForm({ ...paymentForm, capture_line: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>No. Complementaria</Label>
                    <Input
                      value={paymentForm.complementary_number}
                      onChange={(e) => setPaymentForm({ ...paymentForm, complementary_number: e.target.value })}
                      placeholder="Ej: 1, 2, 3..."
                    />
                  </div>
                  <div>
                    <Label>Fecha de Pago</Label>
                    <Input
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Comentarios</Label>
                    <Textarea
                      value={paymentForm.comments}
                      onChange={(e) => setPaymentForm({ ...paymentForm, comments: e.target.value })}
                    />
                  </div>
                  <Button onClick={addPayment} className="w-full">Registrar Pago</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {payments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                No hay pagos registrados
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {payments.map((pay) => (
                <Card key={pay.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold">${pay.amount.toLocaleString()}</span>
                          <Badge variant={pay.status === "pagado" ? "default" : "outline"} className={pay.status === "pagado" ? "bg-green-600" : ""}>
                            {pay.status === "pagado" ? "Pagado" : "Pendiente"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {pay.capture_line && <p>Línea de captura: {pay.capture_line}</p>}
                          {pay.complementary_number && <p>No. Complementaria: {pay.complementary_number}</p>}
                          {pay.payment_date && <p>Fecha: {new Date(pay.payment_date).toLocaleDateString()}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pay.status !== "pagado" && (
                          <Button variant="outline" size="sm" onClick={() => markPaymentAsPaid(pay.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Marcar Pagado
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => deletePayment(pay.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Documentos */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Documentos Fiscales</h3>
            <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Upload className="h-4 w-4 mr-1" />
                  Subir Documento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Subir Documento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo de Documento</Label>
                    <Select value={documentForm.document_type} onValueChange={(v) => setDocumentForm({ ...documentForm, document_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mes</Label>
                      <Select value={documentForm.period_month.toString()} onValueChange={(v) => setDocumentForm({ ...documentForm, period_month: parseInt(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m, i) => (
                            <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Año</Label>
                      <Select value={documentForm.period_year.toString()} onValueChange={(v) => setDocumentForm({ ...documentForm, period_year: parseInt(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[2023, 2024, 2025, 2026].map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Archivo</Label>
                    <Input
                      type="file"
                      onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>
                  <div>
                    <Label>Comentarios</Label>
                    <Textarea
                      value={documentForm.comments}
                      onChange={(e) => setDocumentForm({ ...documentForm, comments: e.target.value })}
                    />
                  </div>
                  <Button onClick={addDocument} className="w-full">Subir</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {documents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                No hay documentos
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-sm">
                            {DOCUMENT_TYPES.find(d => d.value === doc.document_type)?.label || doc.document_type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {doc.period_month && doc.period_year && `${MONTHS[doc.period_month - 1]} ${doc.period_year}`}
                        </p>
                        {doc.file_name && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block truncate max-w-[180px]">
                            {doc.file_name}
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          <Checkbox
                            checked={doc.is_reviewed}
                            onCheckedChange={(c) => toggleDocumentReview(doc.id, !!c)}
                          />
                          <span className="text-xs text-muted-foreground">Revisado</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteDocument(doc.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Resumen */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="py-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            Resumen del Período
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Obligaciones:</span>
              <p className="font-semibold">{obligations.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Pendientes:</span>
              <p className="font-semibold text-yellow-600">{obligations.filter(o => o.status === "pendiente").length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Pagos Pendientes:</span>
              <p className="font-semibold text-red-600">{payments.filter(p => p.status === "pendiente").length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Documentos:</span>
              <p className="font-semibold">{documents.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
