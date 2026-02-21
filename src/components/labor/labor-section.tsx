"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Briefcase, Plus, Trash2, Edit2, Users, FileText, Calendar,
  DollarSign, UserPlus, UserMinus, AlertCircle, Check, Clock,
  CheckCircle2, XCircle, ArrowUpDown
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Payroll {
  id: string
  payroll_type: string
  period: string
  status: string
  completed_date: string | null
  comments: string | null
  stamping_day: string | null
  has_subsidy: boolean
  has_aguinaldo: boolean
  aguinaldo_sent: boolean
  created_at: string
}

interface Incident {
  id: string
  employee_name: string
  incident_type: string
  start_date: string
  end_date: string | null
  comments: string | null
  status: string
  created_at: string
}

interface IMSSMovement {
  id: string
  employee_name: string
  movement_type: string
  sent_to_imss: boolean
  registered_in_imss: boolean
  sent_date: string | null
  registration_date: string | null
  reviewed: boolean
  comments: string | null
  month: number
  year: number
  performed_by: string | null
  confirmed: boolean
  request_date: string | null
  patron_registration: string | null
  incapacity_type: string | null
  folios: string | null
  confirmation_date: string | null
  integrated_salary: number | null
  requested_by: string | null
  request_medium: string | null
  created_at: string
}

interface LaborTax {
  id: string
  tax_type: string
  month: number
  year: number
  status: string
  completed_date: string | null
  responsible: string | null
  receipt_url: string | null
  sent: boolean
  comments: string | null
  created_at: string
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export function LaborSection({ clientId, userRole }: { clientId: string; userRole?: string }) {
  const isClient = userRole === "cliente"
  const [activeTab, setActiveTab] = useState("payroll")

  return (
    <Card className="border-2 border-green-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-green-600" />
          Gestión Laboral
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="payroll" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Nóminas
            </TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Incidencias
            </TabsTrigger>
            <TabsTrigger value="imss" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Movimientos IMSS
            </TabsTrigger>
            <TabsTrigger value="taxes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Impuestos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payroll" className="mt-6">
            <PayrollSection clientId={clientId} isClient={isClient} />
          </TabsContent>

          <TabsContent value="incidents" className="mt-6">
            <IncidentsSection clientId={clientId} isClient={isClient} />
          </TabsContent>

          <TabsContent value="imss" className="mt-6">
            <IMSSSection clientId={clientId} isClient={isClient} />
          </TabsContent>

          <TabsContent value="taxes" className="mt-6">
            <TaxesSection clientId={clientId} isClient={isClient} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// ===========================================
// Sección de Nóminas (Enhanced)
// ===========================================
function PayrollSection({ clientId, isClient }: { clientId: string; isClient: boolean }) {
  const { toast } = useToast()
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    payroll_type: "semanal",
    period: "",
    status: "pendiente",
    comments: "",
    stamping_day: "",
    has_subsidy: false,
    has_aguinaldo: false,
    aguinaldo_sent: false,
  })

  useEffect(() => {
    loadPayrolls()
  }, [clientId])

  const loadPayrolls = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/labor/payroll?clientId=${clientId}`)
      const result = await res.json()
      if (result.data) setPayrolls(result.data)
    } catch (err) {
      console.error("Error loading payrolls:", err)
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!formData.period.trim()) return
    try {
      const res = await fetch("/api/labor/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, ...formData }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Nómina registrada" })
      setFormData({ payroll_type: "semanal", period: "", status: "pendiente", comments: "", stamping_day: "", has_subsidy: false, has_aguinaldo: false, aguinaldo_sent: false })
      setIsDialogOpen(false)
      loadPayrolls()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleUpdate = async (id: string, updates: Record<string, any>) => {
    try {
      await fetch("/api/labor/payroll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      })
      loadPayrolls()
    } catch (err) {
      console.error("Error updating payroll:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta nómina?")) return
    try {
      await fetch(`/api/labor/payroll?id=${id}`, { method: "DELETE" })
      loadPayrolls()
    } catch (err) {
      console.error("Error deleting payroll:", err)
    }
  }

  const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Control de Nóminas</h3>
        {!isClient && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Nómina
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Nómina</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Nómina</label>
                    <Select value={formData.payroll_type} onValueChange={(v) => setFormData({ ...formData, payroll_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="quincenal">Quincenal</SelectItem>
                        <SelectItem value="mensual">Mensual</SelectItem>
                        <SelectItem value="asimilados">Asimilados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Día de Timbrado</label>
                    <Select value={formData.stamping_day} onValueChange={(v) => setFormData({ ...formData, stamping_day: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((day) => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Período</label>
                  <Input
                    placeholder="Ej: 1ra Quincena Enero 2026"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.has_subsidy}
                      onCheckedChange={(c) => setFormData({ ...formData, has_subsidy: !!c })}
                    />
                    <span className="text-sm">Subsidio</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.has_aguinaldo}
                      onCheckedChange={(c) => setFormData({ ...formData, has_aguinaldo: !!c })}
                    />
                    <span className="text-sm">Aguinaldo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.aguinaldo_sent}
                      onCheckedChange={(c) => setFormData({ ...formData, aguinaldo_sent: !!c })}
                    />
                    <span className="text-sm">Aguinaldo Enviado</span>
                  </label>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Observaciones</label>
                  <Textarea
                    placeholder="Notas adicionales..."
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  />
                </div>
                <Button onClick={handleSave} className="w-full" disabled={!formData.period.trim()}>
                  Registrar Nómina
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando...</div>
      ) : payrolls.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay nóminas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payrolls.map((payroll) => (
            <div key={payroll.id} className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${payroll.status === "realizada" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">{payroll.period}</h4>
                    <p className="text-sm text-muted-foreground">
                      Nómina {payroll.payroll_type}
                      {payroll.stamping_day && ` · Timbrado: ${payroll.stamping_day}`}
                      {payroll.completed_date && ` · Realizada: ${new Date(payroll.completed_date).toLocaleDateString()}`}
                    </p>
                    {payroll.comments && <p className="text-xs text-muted-foreground mt-1">{payroll.comments}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Status indicators */}
                  <div className="flex items-center gap-3 mr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${payroll.has_subsidy ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>
                      Subsidio {payroll.has_subsidy ? "✓" : "—"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${payroll.has_aguinaldo ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"}`}>
                      Aguinaldo {payroll.has_aguinaldo ? "✓" : "—"}
                    </span>
                    {payroll.has_aguinaldo && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${payroll.aguinaldo_sent ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                        {payroll.aguinaldo_sent ? "Enviado ✓" : "No enviado"}
                      </span>
                    )}
                  </div>
                  {!isClient && (
                    <>
                      <Select value={payroll.status} onValueChange={(v) => handleUpdate(payroll.id, { status: v, completed_date: v === "realizada" ? new Date().toISOString().split("T")[0] : null })}>
                        <SelectTrigger className={`w-32 ${payroll.status === "realizada" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="realizada">Realizada</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(payroll.id)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {isClient && (
                    <Badge variant={payroll.status === "realizada" ? "default" : "outline"}>
                      {payroll.status === "realizada" ? "Realizada" : "Pendiente"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===========================================
// Sección de Incidencias (unchanged)
// ===========================================
function IncidentsSection({ clientId, isClient }: { clientId: string; isClient: boolean }) {
  const supabase = createClient()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    employee_name: "",
    incident_type: "faltas",
    start_date: "",
    end_date: "",
    comments: ""
  })

  useEffect(() => {
    loadIncidents()
  }, [clientId])

  const loadIncidents = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from("labor_incidents")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (data) setIncidents(data)
    setIsLoading(false)
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !formData.employee_name.trim() || !formData.start_date) return

    await supabase.from("labor_incidents").insert({
      client_id: clientId,
      user_id: user.id,
      employee_name: formData.employee_name,
      incident_type: formData.incident_type,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      comments: formData.comments || null,
      status: "pendiente"
    })

    setFormData({ employee_name: "", incident_type: "faltas", start_date: "", end_date: "", comments: "" })
    setIsDialogOpen(false)
    loadIncidents()
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase.from("labor_incidents").update({ status }).eq("id", id)
    loadIncidents()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta incidencia?")) return
    await supabase.from("labor_incidents").delete().eq("id", id)
    loadIncidents()
  }

  const getIncidentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      faltas: "Faltas",
      vacaciones: "Vacaciones",
      horas_extra: "Horas Extra",
      incapacidades: "Incapacidades"
    }
    return types[type] || type
  }

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case "vacaciones": return <Calendar className="h-4 w-4" />
      case "incapacidades": return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Incidencias de Empleados</h3>
        {!isClient && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Incidencia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Incidencia</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nombre del Empleado</label>
                  <Input
                    placeholder="Nombre completo"
                    value={formData.employee_name}
                    onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Incidencia</label>
                  <Select value={formData.incident_type} onValueChange={(v) => setFormData({ ...formData, incident_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faltas">Faltas</SelectItem>
                      <SelectItem value="vacaciones">Vacaciones</SelectItem>
                      <SelectItem value="horas_extra">Horas Extra</SelectItem>
                      <SelectItem value="incapacidades">Incapacidades</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Fecha Inicio</label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Fecha Fin (opcional)</label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Comentarios</label>
                  <Textarea
                    placeholder="Notas adicionales..."
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  />
                </div>
                <Button onClick={handleSave} className="w-full" disabled={!formData.employee_name.trim() || !formData.start_date}>
                  Registrar Incidencia
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando...</div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay incidencias registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div key={incident.id} className="p-4 border rounded-lg hover:border-green-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 text-orange-700 rounded">
                    {getIncidentIcon(incident.incident_type)}
                  </div>
                  <div>
                    <h4 className="font-medium">{incident.employee_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {getIncidentTypeLabel(incident.incident_type)} - {new Date(incident.start_date).toLocaleDateString()}
                      {incident.end_date && ` al ${new Date(incident.end_date).toLocaleDateString()}`}
                    </p>
                    {incident.comments && <p className="text-xs text-muted-foreground mt-1">{incident.comments}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isClient && (
                    <>
                      <Select value={incident.status} onValueChange={(v) => handleUpdateStatus(incident.id, v)}>
                        <SelectTrigger className={`w-32 ${incident.status === "aplicada" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="aplicada">Aplicada</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(incident.id)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {isClient && (
                    <Badge variant={incident.status === "aplicada" ? "default" : "outline"}>
                      {incident.status === "aplicada" ? "Aplicada" : "Pendiente"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===========================================
// Sección de Movimientos IMSS (Full Rewrite)
// ===========================================
function IMSSSection({ clientId, isClient }: { clientId: string; isClient: boolean }) {
  const { toast } = useToast()
  const [movements, setMovements] = useState<IMSSMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>("todos")
  const [formData, setFormData] = useState({
    employee_name: "",
    movement_type: "alta",
    performed_by: "",
    patron_registration: "",
    incapacity_type: "",
    folios: "",
    integrated_salary: "",
    requested_by: "",
    request_medium: "",
    comments: "",
    request_date: "",
  })

  useEffect(() => {
    loadMovements()
  }, [clientId])

  const loadMovements = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/labor/imss?clientId=${clientId}`)
      const result = await res.json()
      if (result.data) setMovements(result.data)
    } catch (err) {
      console.error("Error loading IMSS movements:", err)
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!formData.employee_name.trim()) return
    const now = new Date()
    try {
      const res = await fetch("/api/labor/imss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          employee_name: formData.employee_name,
          movement_type: formData.movement_type,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          performed_by: formData.performed_by || null,
          request_date: formData.request_date || now.toISOString().split("T")[0],
          patron_registration: formData.patron_registration || null,
          incapacity_type: formData.movement_type === "incapacidad" ? formData.incapacity_type : null,
          folios: formData.folios || null,
          integrated_salary: formData.integrated_salary ? parseFloat(formData.integrated_salary) : null,
          requested_by: formData.requested_by || null,
          request_medium: formData.request_medium || null,
          comments: formData.comments || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "Movimiento registrado" })
      setFormData({
        employee_name: "", movement_type: "alta", performed_by: "", patron_registration: "",
        incapacity_type: "", folios: "", integrated_salary: "", requested_by: "", request_medium: "", comments: "", request_date: "",
      })
      setIsDialogOpen(false)
      loadMovements()
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleToggleConfirmed = async (mov: IMSSMovement) => {
    const newConfirmed = !mov.confirmed
    try {
      await fetch("/api/labor/imss", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: mov.id,
          confirmed: newConfirmed,
          confirmation_date: newConfirmed ? new Date().toISOString().split("T")[0] : null,
        }),
      })
      loadMovements()
    } catch (err) {
      console.error("Error toggling confirmed:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este movimiento?")) return
    try {
      await fetch(`/api/labor/imss?id=${id}`, { method: "DELETE" })
      loadMovements()
    } catch (err) {
      console.error("Error deleting movement:", err)
    }
  }

  const getMovementLabel = (type: string) => {
    const types: Record<string, string> = {
      alta: "Alta",
      baja: "Baja",
      modificacion_salario: "Modificación Salario",
      incapacidad: "Incapacidad",
    }
    return types[type] || type
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case "alta": return "bg-green-100 text-green-700 border-green-300"
      case "baja": return "bg-red-100 text-red-700 border-red-300"
      case "modificacion_salario": return "bg-blue-100 text-blue-700 border-blue-300"
      case "incapacidad": return "bg-orange-100 text-orange-700 border-orange-300"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "alta": return <UserPlus className="h-4 w-4" />
      case "baja": return <UserMinus className="h-4 w-4" />
      case "modificacion_salario": return <ArrowUpDown className="h-4 w-4" />
      case "incapacidad": return <AlertCircle className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const filteredMovements = filterType === "todos"
    ? movements
    : movements.filter((m) => m.movement_type === filterType)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Movimientos IMSS</h3>
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los movimientos</SelectItem>
                <SelectItem value="alta">Solo Altas</SelectItem>
                <SelectItem value="baja">Solo Bajas</SelectItem>
                <SelectItem value="modificacion_salario">Modif. Salario</SelectItem>
                <SelectItem value="incapacidad">Incapacidades</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {movements.length > 0 && (
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">{movements.filter(m => m.movement_type === "alta").length} Altas</Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700">{movements.filter(m => m.movement_type === "baja").length} Bajas</Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">{movements.filter(m => m.movement_type === "modificacion_salario").length} MS</Badge>
            </div>
          )}
        </div>
        {!isClient && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Movimiento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Movimiento IMSS</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Row 1: Type and Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Movimiento *</label>
                    <Select value={formData.movement_type} onValueChange={(v) => setFormData({ ...formData, movement_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="modificacion_salario">Modificación de Salario</SelectItem>
                        <SelectItem value="incapacidad">Incapacidad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Fecha de Solicitud</label>
                    <Input
                      type="date"
                      value={formData.request_date}
                      onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Row 2: Employee and Registration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nombre del Empleado *</label>
                    <Input
                      placeholder="Nombre completo"
                      value={formData.employee_name}
                      onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Registro Patronal</label>
                    <Input
                      placeholder="Ej: C-1247336104"
                      value={formData.patron_registration}
                      onChange={(e) => setFormData({ ...formData, patron_registration: e.target.value })}
                    />
                  </div>
                </div>

                {/* Conditional: Incapacity type */}
                {formData.movement_type === "incapacidad" && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Incapacidad</label>
                    <Select value={formData.incapacity_type} onValueChange={(v) => setFormData({ ...formData, incapacity_type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EG">EG (Enfermedad General)</SelectItem>
                        <SelectItem value="RT">RT (Riesgo de Trabajo)</SelectItem>
                        <SelectItem value="MA">MA (Maternidad)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Row 3: Salary and Folios */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sueldo Integrado</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ej: 292.55"
                      value={formData.integrated_salary}
                      onChange={(e) => setFormData({ ...formData, integrated_salary: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Folios</label>
                    <Input
                      placeholder="Ej: 018/030/042"
                      value={formData.folios}
                      onChange={(e) => setFormData({ ...formData, folios: e.target.value })}
                    />
                  </div>
                </div>

                {/* Row 4: Requester info */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Quién Realiza</label>
                    <Input
                      placeholder="Nombre"
                      value={formData.performed_by}
                      onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Quién Solicita</label>
                    <Input
                      placeholder="Nombre"
                      value={formData.requested_by}
                      onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Medio de Solicitud</label>
                    <Select value={formData.request_medium} onValueChange={(v) => setFormData({ ...formData, request_medium: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="oficina">Oficina</SelectItem>
                        <SelectItem value="telefono">Teléfono</SelectItem>
                        <SelectItem value="correo">Correo</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Observations */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Observaciones</label>
                  <Textarea
                    placeholder="Notas adicionales..."
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  />
                </div>

                <Button onClick={handleSave} className="w-full" disabled={!formData.employee_name.trim()}>
                  Registrar Movimiento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando...</div>
      ) : filteredMovements.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay movimientos IMSS registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMovements.map((mov) => (
            <div key={mov.id} className={`p-4 border-2 rounded-lg transition-colors ${mov.confirmed ? "border-green-300 bg-green-50/30" : "border-gray-200 hover:border-yellow-300"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded ${getMovementColor(mov.movement_type)}`}>
                    {getMovementIcon(mov.movement_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{mov.employee_name}</h4>
                      <Badge variant="outline" className={getMovementColor(mov.movement_type)}>
                        {getMovementLabel(mov.movement_type)}
                      </Badge>
                      {mov.incapacity_type && (
                        <Badge variant="outline" className="bg-orange-50">{mov.incapacity_type}</Badge>
                      )}
                      {mov.confirmed ? (
                        <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Confirmado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-700 border-yellow-300"><Clock className="h-3 w-3 mr-1" /> Pendiente</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      {mov.request_date && <span>📅 Solicitud: {new Date(mov.request_date).toLocaleDateString()}</span>}
                      {mov.confirmation_date && <span>✅ Confirmado: {new Date(mov.confirmation_date).toLocaleDateString()}</span>}
                      {mov.patron_registration && <span>🏢 Reg: {mov.patron_registration}</span>}
                      {mov.integrated_salary && <span>💰 ${mov.integrated_salary.toLocaleString()}</span>}
                      {mov.folios && <span>📋 Folios: {mov.folios}</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                      {mov.performed_by && <span>Realizó: {mov.performed_by}</span>}
                      {mov.requested_by && <span>Solicitó: {mov.requested_by}</span>}
                      {mov.request_medium && <span>Vía: {mov.request_medium}</span>}
                    </div>
                    {mov.comments && <p className="text-xs text-muted-foreground mt-1 italic">{mov.comments}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {!isClient && (
                    <>
                      <Button
                        variant={mov.confirmed ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleConfirmed(mov)}
                        className={mov.confirmed ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {mov.confirmed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(mov.id)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===========================================
// Sección de Impuestos Laborales (unchanged)
// ===========================================
function TaxesSection({ clientId, isClient }: { clientId: string; isClient: boolean }) {
  const supabase = createClient()
  const [taxes, setTaxes] = useState<LaborTax[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [formData, setFormData] = useState({
    tax_type: "ISN",
    responsible: "",
    comments: ""
  })

  useEffect(() => {
    loadTaxes()
  }, [clientId, selectedYear, selectedMonth])

  const loadTaxes = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from("labor_taxes")
      .select("*")
      .eq("client_id", clientId)
      .eq("year", selectedYear)
      .eq("month", selectedMonth)
      .order("created_at", { ascending: false })

    if (data) setTaxes(data)
    setIsLoading(false)
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("labor_taxes").insert({
      client_id: clientId,
      user_id: user.id,
      tax_type: formData.tax_type,
      month: selectedMonth,
      year: selectedYear,
      responsible: formData.responsible || null,
      comments: formData.comments || null,
      status: "pendiente"
    })

    setFormData({ tax_type: "ISN", responsible: "", comments: "" })
    setIsDialogOpen(false)
    loadTaxes()
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase
      .from("labor_taxes")
      .update({
        status,
        completed_date: status === "realizado" ? new Date().toISOString().split("T")[0] : null
      })
      .eq("id", id)
    loadTaxes()
  }

  const handleSentChange = async (id: string, sent: boolean) => {
    await supabase.from("labor_taxes").update({ sent }).eq("id", id)
    loadTaxes()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este impuesto?")) return
    await supabase.from("labor_taxes").delete().eq("id", id)
    loadTaxes()
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Impuestos Laborales</h3>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, idx) => (
                  <SelectItem key={idx} value={(idx + 1).toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {!isClient && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Impuesto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Impuesto Laboral</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Impuesto</label>
                  <Select value={formData.tax_type} onValueChange={(v) => setFormData({ ...formData, tax_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ISN">ISN (Impuesto Sobre Nóminas)</SelectItem>
                      <SelectItem value="ISR">ISR Retenciones</SelectItem>
                      <SelectItem value="IMSS">Cuotas IMSS</SelectItem>
                      <SelectItem value="INFONAVIT">Aportaciones INFONAVIT</SelectItem>
                      <SelectItem value="SAR">SAR (Sistema de Ahorro para el Retiro)</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Responsable</label>
                  <Input
                    placeholder="Nombre del responsable"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Comentarios</label>
                  <Textarea
                    placeholder="Notas adicionales..."
                    value={formData.comments}
                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  Registrar Impuesto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando...</div>
      ) : taxes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay impuestos registrados para {MONTHS[selectedMonth - 1]} {selectedYear}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {taxes.map((tax) => (
            <div key={tax.id} className="p-4 border rounded-lg hover:border-green-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded ${tax.status === "realizado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">{tax.tax_type}</h4>
                    <p className="text-sm text-muted-foreground">
                      {MONTHS[tax.month - 1]} {tax.year}
                      {tax.responsible && ` - Responsable: ${tax.responsible}`}
                    </p>
                    {tax.completed_date && (
                      <p className="text-xs text-green-600 mt-1">Realizado: {new Date(tax.completed_date).toLocaleDateString()}</p>
                    )}
                    {tax.comments && <p className="text-xs text-muted-foreground mt-1">{tax.comments}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isClient && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tax.id)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 pl-12">
                {!isClient && (
                  <>
                    <Select value={tax.status} onValueChange={(v) => handleUpdateStatus(tax.id, v)}>
                      <SelectTrigger className={`w-32 ${tax.status === "realizado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="realizado">Realizado</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={tax.sent}
                        onCheckedChange={(checked) => handleSentChange(tax.id, !!checked)}
                      />
                      <span className="text-sm">Enviado al cliente</span>
                    </label>
                  </>
                )}
                {isClient && (
                  <Badge variant={tax.status === "realizado" ? "default" : "outline"}>
                    {tax.status === "realizado" ? "Realizado" : "Pendiente"}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
