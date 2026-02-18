"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Plus, FileText, Search, ChevronDown, ChevronUp,
    Calendar, DollarSign, Hash, X
} from "lucide-react"

interface Invoice {
    id: string
    agent_name: string
    issue_date: string
    serie: string
    folio: number
    recipient_name: string
    total: number
    pending_amount: number
    payment_method: string
    uuid_sat: string
    status: string
    notes: string
    created_at: string
}

const PAYMENT_METHODS: Record<string, string> = {
    "01": "Efectivo",
    "02": "Cheque nominativo",
    "03": "Transferencia electrónica",
    "04": "Tarjeta de crédito",
    "28": "Tarjeta de débito",
    "99": "Por definir",
}

interface InvoicesTabProps {
    clientId: string
    clientName: string
    canEdit: boolean
}

export function InvoicesTab({ clientId, clientName, canEdit }: InvoicesTabProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterYear, setFilterYear] = useState(new Date().getFullYear())
    const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)

    // Form state
    const [form, setForm] = useState({
        agentName: "",
        issueDate: new Date().toISOString().split("T")[0],
        serie: "CFDI",
        folio: "",
        recipientName: "",
        total: "",
        pendingAmount: "",
        paymentMethod: "03",
        uuidSat: "",
        status: "vigente",
        notes: "",
    })

    useEffect(() => {
        loadInvoices()
    }, [clientId, filterYear, filterMonth])

    async function loadInvoices() {
        setLoading(true)
        try {
            const res = await fetch(
                `/api/invoicing/invoices?clientId=${clientId}&year=${filterYear}&month=${filterMonth}`
            )
            const result = await res.json()
            if (res.ok && result.data) setInvoices(result.data)
        } catch (err) {
            console.error("Error loading invoices:", err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.recipientName) return

        setSaving(true)
        try {
            const res = await fetch("/api/invoicing/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientId,
                    agentName: form.agentName,
                    issueDate: form.issueDate,
                    serie: form.serie,
                    folio: form.folio ? parseInt(form.folio) : null,
                    recipientName: form.recipientName,
                    total: parseFloat(form.total) || 0,
                    pendingAmount: form.pendingAmount ? parseFloat(form.pendingAmount) : parseFloat(form.total) || 0,
                    paymentMethod: form.paymentMethod,
                    uuidSat: form.uuidSat,
                    status: form.status,
                    notes: form.notes,
                }),
            })

            if (res.ok) {
                setShowForm(false)
                setForm({
                    agentName: form.agentName,
                    issueDate: new Date().toISOString().split("T")[0],
                    serie: "CFDI",
                    folio: "",
                    recipientName: "",
                    total: "",
                    pendingAmount: "",
                    paymentMethod: "03",
                    uuidSat: "",
                    status: "vigente",
                    notes: "",
                })
                loadInvoices()
            }
        } catch (err) {
            console.error("Error creating invoice:", err)
        } finally {
            setSaving(false)
        }
    }

    const filtered = invoices.filter(inv =>
        inv.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.folio?.toString().includes(searchTerm) ||
        inv.agent_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold">Facturas Emitidas</h3>
                    <p className="text-sm text-muted-foreground">
                        {monthNames[filterMonth - 1]} {filterYear} • {filtered.length} factura{filtered.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                        {monthNames.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(parseInt(e.target.value))}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    {canEdit && (
                        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-1">
                            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {showForm ? "Cancelar" : "Nueva Factura"}
                        </Button>
                    )}
                </div>
            </div>

            {/* New Invoice Form */}
            {showForm && (
                <Card className="border-2 border-primary/20 bg-primary/5 animate-fade-in-up">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Registrar Nueva Factura
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Agente</label>
                                <Input
                                    placeholder="Nombre del agente"
                                    value={form.agentName}
                                    onChange={e => setForm({ ...form, agentName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Fecha *</label>
                                <Input
                                    type="date"
                                    value={form.issueDate}
                                    onChange={e => setForm({ ...form, issueDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Serie</label>
                                <select
                                    value={form.serie}
                                    onChange={e => setForm({ ...form, serie: e.target.value })}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="CFDI">CFDI</option>
                                    <option value="CTA PORTE">Carta Porte</option>
                                    <option value="PGO">Complemento de Pago</option>
                                    <option value="NC">Nota de Crédito</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Folio</label>
                                <Input
                                    type="number"
                                    placeholder="Ej: 1409"
                                    value={form.folio}
                                    onChange={e => setForm({ ...form, folio: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">Razón Social / Receptor *</label>
                                <Input
                                    placeholder="Nombre del cliente receptor"
                                    value={form.recipientName}
                                    onChange={e => setForm({ ...form, recipientName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Total ($)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={form.total}
                                    onChange={e => setForm({ ...form, total: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Pendiente ($)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={form.pendingAmount}
                                    onChange={e => setForm({ ...form, pendingAmount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Forma de Pago</label>
                                <select
                                    value={form.paymentMethod}
                                    onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    {Object.entries(PAYMENT_METHODS).map(([code, label]) => (
                                        <option key={code} value={code}>{code} - {label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">UUID</label>
                                <Input
                                    placeholder="Folio fiscal (opcional)"
                                    value={form.uuidSat}
                                    onChange={e => setForm({ ...form, uuidSat: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Estado</label>
                                <select
                                    value={form.status}
                                    onChange={e => setForm({ ...form, status: e.target.value })}
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="vigente">Vigente</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                            </div>
                            <div className="col-span-full flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                                <Button type="submit" disabled={saving}>
                                    {saving ? "Guardando..." : "Registrar Factura"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por razón social, folio o agente..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Cargando facturas...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">No hay facturas registradas para este periodo</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Agente</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Serie</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Folio</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Razón Social</th>
                                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Pendiente</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">F. Pago</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(inv => (
                                        <tr key={inv.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">{inv.agent_name || "—"}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {inv.issue_date ? new Date(inv.issue_date + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">{inv.serie}</td>
                                            <td className="px-4 py-3 whitespace-nowrap font-mono">{inv.folio || "—"}</td>
                                            <td className="px-4 py-3 max-w-[200px] truncate" title={inv.recipient_name}>{inv.recipient_name}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                                                ${Number(inv.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <span className={Number(inv.pending_amount) > 0 ? "text-orange-600 font-medium" : "text-green-600"}>
                                                    ${Number(inv.pending_amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                    {inv.payment_method} {PAYMENT_METHODS[inv.payment_method] ? `- ${PAYMENT_METHODS[inv.payment_method]}` : ""}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <Badge
                                                    variant={inv.status === "vigente" ? "default" : "destructive"}
                                                    className={inv.status === "vigente" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                                                >
                                                    {inv.status === "vigente" ? "Vigente" : "Cancelado"}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Totals */}
            {filtered.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-blue-600 font-medium">Total Facturas</p>
                            <p className="text-xl font-bold text-blue-700">{filtered.length}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-100">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-green-600 font-medium">Vigentes</p>
                            <p className="text-xl font-bold text-green-700">{filtered.filter(i => i.status === "vigente").length}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-50 border-purple-100">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-purple-600 font-medium">Monto Total</p>
                            <p className="text-lg font-bold text-purple-700">
                                ${filtered.reduce((s, i) => s + Number(i.total), 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-orange-50 border-orange-100">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-orange-600 font-medium">Pendiente</p>
                            <p className="text-lg font-bold text-orange-700">
                                ${filtered.reduce((s, i) => s + Number(i.pending_amount), 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
