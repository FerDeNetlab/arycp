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
  DollarSign, UserPlus, UserMinus, AlertCircle, Check, Clock
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Payroll {
  id: string
  payroll_type: string
  period: string
  status: string
  completed_date: string | null
  comments: string | null
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
  const supabase = createClient()

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
              Altas/Bajas IMSS
            </TabsTrigger>
            <TabsTrigger value="taxes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Impuestos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payroll" className="mt-6">
            <PayrollSection clientId={clientId} supabase={supabase} isClient={isClient} />
          </TabsContent>

          <TabsContent value="incidents" className="mt-6">
            <IncidentsSection clientId={clientId} supabase={supabase} isClient={isClient} />
          </TabsContent>

          <TabsContent value="imss" className="mt-6">
            <IMSSSection clientId={clientId} supabase={supabase} isClient={isClient} />
          </TabsContent>

          <TabsContent value="taxes" className="mt-6">
            <TaxesSection clientId={clientId} supabase={supabase} isClient={isClient} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Sección de Nóminas
function PayrollSection({ clientId, supabase, isClient }: { clientId: string; supabase: any; isClient: boolean }) {
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    payroll_type: "quincenal",
    period: "",
    status: "pendiente",
    comments: ""
  })

  useEffect(() => {
    loadPayrolls()
  }, [clientId])

  const loadPayrolls = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from("labor_payroll")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (data) setPayrolls(data)
    setIsLoading(false)
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !formData.period.trim()) return

    await supabase.from("labor_payroll").insert({
      client_id: clientId,
      user_id: user.id,
      payroll_type: formData.payroll_type,
      period: formData.period,
      status: formData.status,
      comments: formData.comments || null
    })

    setFormData({ payroll_type: "quincenal", period: "", status: "pendiente", comments: "" })
    setIsDialogOpen(false)
    loadPayrolls()
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase
      .from("labor_payroll")
      .update({
        status,
        completed_date: status === "realizada" ? new Date().toISOString().split("T")[0] : null
      })
      .eq("id", id)
    loadPayrolls()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta nómina?")) return
    await supabase.from("labor_payroll").delete().eq("id", id)
    loadPayrolls()
  }

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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nómina</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
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
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Período</label>
                  <Input
                    placeholder="Ej: 1ra Quincena Enero 2026"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
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
                      {payroll.completed_date && ` - Realizada: ${new Date(payroll.completed_date).toLocaleDateString()}`}
                    </p>
                    {payroll.comments && <p className="text-xs text-muted-foreground mt-1">{payroll.comments}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isClient && (
                    <>
                      <Select value={payroll.status} onValueChange={(v) => handleUpdateStatus(payroll.id, v)}>
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

// Sección de Incidencias
function IncidentsSection({ clientId, supabase, isClient }: { clientId: string; supabase: any; isClient: boolean }) {
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

// Sección de Altas/Bajas IMSS
function IMSSSection({ clientId, supabase, isClient }: { clientId: string; supabase: any; isClient: boolean }) {
  const [movements, setMovements] = useState<IMSSMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [formData, setFormData] = useState({
    employee_name: "",
    movement_type: "alta",
    comments: ""
  })

  useEffect(() => {
    loadMovements()
  }, [clientId, selectedYear, selectedMonth])

  const loadMovements = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from("labor_imss")
      .select("*")
      .eq("client_id", clientId)
      .eq("year", selectedYear)
      .eq("month", selectedMonth)
      .order("created_at", { ascending: false })

    if (data) setMovements(data)
    setIsLoading(false)
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !formData.employee_name.trim()) return

    await supabase.from("labor_imss").insert({
      client_id: clientId,
      user_id: user.id,
      employee_name: formData.employee_name,
      movement_type: formData.movement_type,
      month: selectedMonth,
      year: selectedYear,
      comments: formData.comments || null
    })

    setFormData({ employee_name: "", movement_type: "alta", comments: "" })
    setIsDialogOpen(false)
    loadMovements()
  }

  const handleCheckboxChange = async (id: string, field: string, value: boolean) => {
    const updateData: any = { [field]: value }
    if (field === "sent_to_imss" && value) {
      updateData.sent_date = new Date().toISOString().split("T")[0]
    }
    if (field === "registered_in_imss" && value) {
      updateData.registration_date = new Date().toISOString().split("T")[0]
    }

    await supabase.from("labor_imss").update(updateData).eq("id", id)
    loadMovements()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este movimiento?")) return
    await supabase.from("labor_imss").delete().eq("id", id)
    loadMovements()
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Altas y Bajas IMSS</h3>
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
                Nuevo Movimiento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Movimiento IMSS</DialogTitle>
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
                  <label className="text-sm font-medium mb-2 block">Tipo de Movimiento</label>
                  <Select value={formData.movement_type} onValueChange={(v) => setFormData({ ...formData, movement_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Comentarios</label>
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
      ) : movements.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay movimientos IMSS para {MONTHS[selectedMonth - 1]} {selectedYear}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {movements.map((movement) => (
            <div key={movement.id} className="p-4 border rounded-lg hover:border-green-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded ${movement.movement_type === "alta" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {movement.movement_type === "alta" ? <UserPlus className="h-4 w-4" /> : <UserMinus className="h-4 w-4" />}
                  </div>
                  <div>
                    <h4 className="font-medium">{movement.employee_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {movement.movement_type === "alta" ? "Alta" : "Baja"} - {MONTHS[movement.month - 1]} {movement.year}
                    </p>
                    {movement.comments && <p className="text-xs text-muted-foreground mt-1">{movement.comments}</p>}
                  </div>
                </div>
                {!isClient && (
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(movement.id)} className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-6 pl-12">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={movement.sent_to_imss}
                    onCheckedChange={(checked) => handleCheckboxChange(movement.id, "sent_to_imss", !!checked)}
                    disabled={isClient}
                  />
                  <span className="text-sm">Enviado al IMSS</span>
                  {movement.sent_date && <span className="text-xs text-muted-foreground">({new Date(movement.sent_date).toLocaleDateString()})</span>}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={movement.registered_in_imss}
                    onCheckedChange={(checked) => handleCheckboxChange(movement.id, "registered_in_imss", !!checked)}
                    disabled={isClient}
                  />
                  <span className="text-sm">Registrado en IMSS</span>
                  {movement.registration_date && <span className="text-xs text-muted-foreground">({new Date(movement.registration_date).toLocaleDateString()})</span>}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={movement.reviewed}
                    onCheckedChange={(checked) => handleCheckboxChange(movement.id, "reviewed", !!checked)}
                    disabled={isClient}
                  />
                  <span className="text-sm">Revisado</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Sección de Impuestos Laborales
function TaxesSection({ clientId, supabase, isClient }: { clientId: string; supabase: any; isClient: boolean }) {
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
