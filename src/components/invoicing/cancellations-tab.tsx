"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Plus, XCircle, Search, X, ChevronDown, ChevronUp, Edit2, Save, Upload, FileSpreadsheet } from "lucide-react"

interface Cancellation {
    id: string
    company_name: string
    folio_type: string
    folio_number: number
    issue_date: string
    recipient_name: string
    request_date: string
    system_status: string
    sat_status: string
    status_notes: string
    first_receipt_sent: string
    second_receipt_sent: string
    uuid_sat: string
    cancellation_reason: string
    replacement_cfdi: string
    created_at: string
}

const FOLIO_TYPES = [
    { value: "cfdi", label: "CFDI" },
    { value: "carta_porte", label: "Carta Porte" },
    { value: "pago", label: "Complemento de Pago" },
    { value: "nota_credito", label: "Nota de Crédito" },
]

const SYSTEM_STATUSES = [
    "Pendiente de cancelación",
    "Cancelado en sistema",
    "Rechazada",
    "Vigente",
    "Periodo cerrado",
]

const SAT_STATUSES = [
    "Pendiente de cancelación",
    "Cancelado",
    "Rechazada",
    "Vigente",
    "Firma vencida",
]

const COMMON_REASONS = [
    "Error en forma de pago",
    "Error en método de pago",
    "Error en conceptos",
    "Error en monto de pago",
    "Error en RFC",
    "Error en uso CFDI",
    "Error en fecha",
    "Error en retenciones",
    "Error en cantidad",
    "Error en IVA",
    "Cambio de razón social",
    "Cambio de forma de pago",
    "Cambio de régimen",
    "Cambio de uso del comprobante",
    "Factura duplicada",
    "No se llevó a cabo la operación",
    "Devolución de mercancía",
    "Errores con relación",
    "Errores sin relación",
]

interface CancellationsTabProps {
    clientId: string
    clientName: string
    canEdit: boolean
}

export function CancellationsTab({ clientId, clientName, canEdit }: CancellationsTabProps) {
    const { toast } = useToast()
    const [cancellations, setCancellations] = useState<Cancellation[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterYear, setFilterYear] = useState(new Date().getFullYear())
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Import state
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [importFile, setImportFile] = useState<File | null>(null)
    const [isImporting, setIsImporting] = useState(false)
    const importInputRef = useRef<HTMLInputElement>(null)

    const [form, setForm] = useState({
        companyName: "",
        folioType: "cfdi",
        folioNumber: "",
        issueDate: "",
        recipientName: "",
        requestDate: new Date().toISOString().split("T")[0],
        systemStatus: "Pendiente de cancelación",
        satStatus: "Pendiente de cancelación",
        statusNotes: "",
        firstReceiptSent: "",
        secondReceiptSent: "",
        uuidSat: "",
        cancellationReason: "",
        replacementCfdi: "",
    })

    useEffect(() => {
        loadCancellations()
    }, [clientId, filterYear, filterMonth])

    async function loadCancellations() {
        setLoading(true)
        try {
            const res = await fetch(
                `/api/invoicing/cancellations?clientId=${clientId}&year=${filterYear}&month=${filterMonth}`
            )
            const result = await res.json()
            if (res.ok && result.data) setCancellations(result.data)
        } catch (err) {
            console.error("Error:", err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch("/api/invoicing/cancellations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientId,
                    companyName: form.companyName,
                    folioType: form.folioType,
                    folioNumber: form.folioNumber ? parseInt(form.folioNumber) : null,
                    issueDate: form.issueDate || null,
                    recipientName: form.recipientName,
                    requestDate: form.requestDate,
                    systemStatus: form.systemStatus,
                    satStatus: form.satStatus,
                    statusNotes: form.statusNotes,
                    firstReceiptSent: form.firstReceiptSent || null,
                    secondReceiptSent: form.secondReceiptSent || null,
                    uuidSat: form.uuidSat,
                    cancellationReason: form.cancellationReason,
                    replacementCfdi: form.replacementCfdi,
                }),
            })
            if (res.ok) {
                setShowForm(false)
                resetForm()
                loadCancellations()
            }
        } catch (err) {
            console.error("Error:", err)
        } finally {
            setSaving(false)
        }
    }

    async function handleUpdateStatus(id: string, systemStatus: string, satStatus: string, statusNotes: string) {
        try {
            const res = await fetch("/api/invoicing/cancellations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, systemStatus, satStatus, statusNotes }),
            })
            if (res.ok) {
                setEditingId(null)
                loadCancellations()
            }
        } catch (err) {
            console.error("Error:", err)
        }
    }

    function resetForm() {
        setForm({
            companyName: "", folioType: "cfdi", folioNumber: "", issueDate: "",
            recipientName: "", requestDate: new Date().toISOString().split("T")[0],
            systemStatus: "Pendiente de cancelación", satStatus: "Pendiente de cancelación",
            statusNotes: "", firstReceiptSent: "", secondReceiptSent: "",
            uuidSat: "", cancellationReason: "", replacementCfdi: "",
        })
    }

    async function handleImportExcel() {
        if (!importFile) return
        setIsImporting(true)
        try {
            const formData = new FormData()
            formData.append("clientId", clientId)
            formData.append("file", importFile)

            const res = await fetch("/api/invoicing/import-cancellations", {
                method: "POST",
                body: formData,
            })

            const result = await res.json()

            if (!res.ok) {
                throw new Error(result.error || "Error al importar")
            }

            toast({
                title: `✅ ${result.imported} cancelaciones importadas`,
                description: result.skipped > 0 ? `${result.skipped} filas omitidas` : undefined,
            })

            setIsImportDialogOpen(false)
            setImportFile(null)
            loadCancellations()
        } catch (error: any) {
            toast({ title: "Error al importar", description: error.message, variant: "destructive" })
        } finally {
            setIsImporting(false)
        }
    }

    function getStatusBadge(status: string) {
        const s = (status || "").toLowerCase()
        if (s.includes("cancelado") || s.includes("cancelada")) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Cancelado</Badge>
        if (s.includes("pendiente")) return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pendiente</Badge>
        if (s.includes("rechazada")) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rechazada</Badge>
        if (s.includes("vigente")) return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Vigente</Badge>
        return <Badge variant="outline">{status || "—"}</Badge>
    }

    const filtered = cancellations.filter(c =>
        c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.folio_number?.toString().includes(searchTerm) ||
        c.uuid_sat?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold">Solicitudes de Cancelación</h3>
                    <p className="text-sm text-muted-foreground">
                        {monthNames[filterMonth - 1]} {filterYear} • {filtered.length} solicitud{filtered.length !== 1 ? "es" : ""}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                        {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <select value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                        {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {canEdit && (
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setIsImportDialogOpen(true)}
                                size="sm"
                                variant="outline"
                                className="gap-1 border-red-300 text-red-700 hover:bg-red-50"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                Importar Excel
                            </Button>
                            <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-1 bg-red-600 hover:bg-red-700">
                                {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                {showForm ? "Cancelar" : "Nueva Solicitud"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <Card className="border-2 border-red-200 bg-red-50/50 animate-fade-in-up">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            Registrar Solicitud de Cancelación
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Empresa</label>
                                <Input placeholder="Nombre de la empresa" value={form.companyName}
                                    onChange={e => setForm({ ...form, companyName: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Tipo de Folio</label>
                                <select value={form.folioType} onChange={e => setForm({ ...form, folioType: e.target.value })}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                                    {FOLIO_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Folio</label>
                                <Input type="number" placeholder="Número de folio" value={form.folioNumber}
                                    onChange={e => setForm({ ...form, folioNumber: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Fecha de Emisión</label>
                                <Input type="date" value={form.issueDate}
                                    onChange={e => setForm({ ...form, issueDate: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Cliente / Receptor</label>
                                <Input placeholder="Nombre del cliente" value={form.recipientName}
                                    onChange={e => setForm({ ...form, recipientName: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Fecha de Solicitud</label>
                                <Input type="date" value={form.requestDate}
                                    onChange={e => setForm({ ...form, requestDate: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Estado en Sistema</label>
                                <select value={form.systemStatus} onChange={e => setForm({ ...form, systemStatus: e.target.value })}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                                    {SYSTEM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Estado en SAT</label>
                                <select value={form.satStatus} onChange={e => setForm({ ...form, satStatus: e.target.value })}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                                    {SAT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Motivo de Cancelación</label>
                                <select value={form.cancellationReason} onChange={e => setForm({ ...form, cancellationReason: e.target.value })}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                                    <option value="">Seleccionar motivo...</option>
                                    {COMMON_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">UUID</label>
                                <Input placeholder="Folio fiscal" value={form.uuidSat}
                                    onChange={e => setForm({ ...form, uuidSat: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">CFDI que Sustituye</label>
                                <Input placeholder="Folio del reemplazo (opcional)" value={form.replacementCfdi}
                                    onChange={e => setForm({ ...form, replacementCfdi: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Fecha 1er Comprobante</label>
                                <Input type="date" value={form.firstReceiptSent}
                                    onChange={e => setForm({ ...form, firstReceiptSent: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Fecha 2do Comprobante</label>
                                <Input type="date" value={form.secondReceiptSent}
                                    onChange={e => setForm({ ...form, secondReceiptSent: e.target.value })} />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                                <label className="text-xs font-medium text-muted-foreground">Notas de Seguimiento</label>
                                <textarea
                                    placeholder="Notas, observaciones, historial de seguimiento..."
                                    value={form.statusNotes}
                                    onChange={e => setForm({ ...form, statusNotes: e.target.value })}
                                    className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="col-span-full flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Cancelar</Button>
                                <Button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700">
                                    {saving ? "Guardando..." : "Registrar Cancelación"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por empresa, cliente, folio o UUID..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Cargando cancelaciones...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center">
                            <XCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">No hay cancelaciones para este periodo</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empresa</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Folio</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Solicitud</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sistema</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">SAT</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Motivo</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(c => {
                                        const isExpanded = expandedId === c.id
                                        const folioLabel = FOLIO_TYPES.find(f => f.value === c.folio_type)?.label || c.folio_type?.toUpperCase()
                                        return (
                                            <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors group">
                                                <td className="px-4 py-3 whitespace-nowrap font-medium">{c.company_name || "—"}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{folioLabel}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap font-mono">{c.folio_number || "—"}</td>
                                                <td className="px-4 py-3 max-w-[150px] truncate" title={c.recipient_name}>{c.recipient_name || "—"}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                    {c.request_date ? new Date(c.request_date + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(c.system_status)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(c.sat_status)}</td>
                                                <td className="px-4 py-3 max-w-[150px] truncate text-xs text-muted-foreground" title={c.cancellation_reason}>
                                                    {c.cancellation_reason || "—"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                                                        onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>

                            {/* Expanded detail rows */}
                            {filtered.map(c => expandedId === c.id && (
                                <div key={`detail-${c.id}`} className="border-b bg-muted/10 px-6 py-4 space-y-3">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Fecha Emisión</span>
                                            <span>{c.issue_date ? new Date(c.issue_date + "T12:00:00").toLocaleDateString("es-MX") : "—"}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground block">UUID</span>
                                            <span className="font-mono text-xs break-all">{c.uuid_sat || "—"}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground block">1er Comprobante</span>
                                            <span>{c.first_receipt_sent ? new Date(c.first_receipt_sent + "T12:00:00").toLocaleDateString("es-MX") : "No enviado"}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground block">2do Comprobante</span>
                                            <span>{c.second_receipt_sent ? new Date(c.second_receipt_sent + "T12:00:00").toLocaleDateString("es-MX") : "No enviado"}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground block">CFDI que Sustituye</span>
                                            <span className="font-mono text-xs">{c.replacement_cfdi || "—"}</span>
                                        </div>
                                    </div>
                                    {c.status_notes && (
                                        <div>
                                            <span className="text-xs text-muted-foreground block mb-1">Notas de Seguimiento</span>
                                            <p className="text-sm bg-white p-3 rounded border whitespace-pre-wrap">{c.status_notes}</p>
                                        </div>
                                    )}
                                    {canEdit && (
                                        <div className="flex gap-2 pt-1">
                                            <Button variant="outline" size="sm" className="gap-1 text-xs"
                                                onClick={() => {
                                                    const newStatus = prompt("Nuevo estado en sistema:", c.system_status || "")
                                                    const newSat = prompt("Nuevo estado en SAT:", c.sat_status || "")
                                                    const newNotes = prompt("Notas:", c.status_notes || "")
                                                    if (newStatus !== null) handleUpdateStatus(c.id, newStatus!, newSat || c.sat_status, newNotes || c.status_notes)
                                                }}>
                                                <Edit2 className="h-3 w-3" /> Actualizar Estado
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary cards */}
            {filtered.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="bg-gray-50 border-gray-100">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-gray-600 font-medium">Total Solicitudes</p>
                            <p className="text-xl font-bold text-gray-700">{filtered.length}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-100">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-green-600 font-medium">Canceladas (SAT)</p>
                            <p className="text-xl font-bold text-green-700">
                                {filtered.filter(c => c.sat_status?.toLowerCase().includes("cancelad")).length}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 border-yellow-100">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-yellow-600 font-medium">Pendientes</p>
                            <p className="text-xl font-bold text-yellow-700">
                                {filtered.filter(c => c.sat_status?.toLowerCase().includes("pendiente")).length}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-100">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-red-600 font-medium">Rechazadas</p>
                            <p className="text-xl font-bold text-red-700">
                                {filtered.filter(c => c.sat_status?.toLowerCase().includes("rechazada")).length}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Import Excel Dialog */}
            {canEdit && (
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-red-600" />
                                Importar Cancelaciones desde Excel
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Sube el archivo Excel de cancelaciones. Usa el mismo formato que el de facturas.
                                Todas las filas se importarán con estado <strong>"Cancelado"</strong>.
                            </p>

                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                                <Input
                                    ref={importInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                    id="import-cancellations-excel"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0]
                                        if (f) setImportFile(f)
                                    }}
                                />
                                <Label htmlFor="import-cancellations-excel" className="cursor-pointer flex flex-col items-center gap-2">
                                    <FileSpreadsheet className="h-10 w-10 text-red-500" />
                                    <span className="text-sm font-medium">Seleccionar archivo Excel</span>
                                    <span className="text-xs text-muted-foreground">.xlsx o .xls</span>
                                </Label>
                            </div>

                            {importFile && (
                                <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                                    <FileSpreadsheet className="h-4 w-4 text-red-600 flex-shrink-0" />
                                    <span className="text-sm flex-1 truncate">{importFile.name}</span>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setImportFile(null)}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}

                            <Button
                                onClick={handleImportExcel}
                                className="w-full bg-red-600 hover:bg-red-700"
                                disabled={!importFile || isImporting}
                            >
                                {isImporting ? "Importando..." : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Importar Cancelaciones
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
