"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
    Plus, Search, Pencil, Trash2, ClipboardList,
    ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion,
    KeyRound, Stamp, Building, FileCheck, HardHat,
    Upload, FileDown, FileUp, Loader2
} from "lucide-react"

interface Registration {
    id: string
    client_id: string
    type: string
    label: string
    registration_number: string
    issued_date: string
    expiration_date: string
    status: string
    notes: string
    file_url: string
    created_at: string
    updated_at: string
}

const REGISTRATION_TYPES = [
    { value: "efirma", label: "e.Firma (FIEL)", icon: KeyRound, color: "blue" },
    { value: "csd", label: "CSD (Sello Digital)", icon: Stamp, color: "purple" },
    { value: "imss", label: "IMSS", icon: Building, color: "green" },
    { value: "isn", label: "ISN", icon: FileCheck, color: "orange" },
    { value: "fonacot", label: "FONACOT", icon: HardHat, color: "cyan" },
    { value: "repse", label: "REPSE", icon: ShieldCheck, color: "indigo" },
    { value: "otro", label: "Otro", icon: ClipboardList, color: "gray" },
]

function getTypeInfo(type: string) {
    return REGISTRATION_TYPES.find(t => t.value === type) || REGISTRATION_TYPES[6]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeStatus(expirationDate: string | null): { label: string; color: string; icon: any } {
    if (!expirationDate) return { label: "Sin fecha", color: "gray", icon: ShieldQuestion }
    const now = new Date()
    const exp = new Date(expirationDate + "T23:59:59")
    const diffDays = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { label: "Vencido", color: "red", icon: ShieldX }
    if (diffDays <= 30) return { label: "Por vencer", color: "yellow", icon: ShieldAlert }
    return { label: "Vigente", color: "green", icon: ShieldCheck }
}

function getStatusBadge(expirationDate: string | null) {
    const { label, color } = computeStatus(expirationDate)
    const colorMap: Record<string, string> = {
        green: "bg-green-100 text-green-700 hover:bg-green-100",
        yellow: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
        red: "bg-red-100 text-red-700 hover:bg-red-100",
        gray: "bg-gray-100 text-gray-500 hover:bg-gray-100",
    }
    return <Badge className={colorMap[color] || colorMap.gray}>{label}</Badge>
}

function formatDate(date: string | null) {
    if (!date) return "—"
    return new Date(date + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
}

function daysUntilExpiration(expirationDate: string | null): string {
    if (!expirationDate) return ""
    const now = new Date()
    const exp = new Date(expirationDate + "T23:59:59")
    const diffDays = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return `Venció hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? "s" : ""}`
    if (diffDays === 0) return "Vence hoy"
    return `Vence en ${diffDays} día${diffDays !== 1 ? "s" : ""}`
}

interface ComplianceSectionProps {
    clientId: string
    clientName: string
    canEdit: boolean
}

const emptyForm = {
    type: "efirma",
    label: "",
    registrationNumber: "",
    issuedDate: "",
    expirationDate: "",
    notes: "",
}

export function ComplianceSection({ clientId, clientName, canEdit }: ComplianceSectionProps) {
    const { toast } = useToast()
    const [registrations, setRegistrations] = useState<Registration[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState("all")

    // Create state
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createForm, setCreateForm] = useState({ ...emptyForm })
    const [isSaving, setIsSaving] = useState(false)
    const [isParsing, setIsParsing] = useState(false)
    const cerInputRef = useRef<HTMLInputElement>(null)

    // Edit state
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingReg, setEditingReg] = useState<Registration | null>(null)
    const [editForm, setEditForm] = useState({ ...emptyForm })
    const [isEditSaving, setIsEditSaving] = useState(false)

    // Delete state
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [deletingReg, setDeletingReg] = useState<Registration | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Upload state
    const [uploadingId, setUploadingId] = useState<string | null>(null)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fileInputRef = useRef<HTMLInputElement>(null)

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { loadRegistrations() }, [clientId])

    async function loadRegistrations() {
        setLoading(true)
        try {
            const res = await fetch(`/api/compliance/registrations?clientId=${clientId}`)
            const result = await res.json()
            if (res.ok && result.data) setRegistrations(result.data)
        } catch (err) {
            console.error("Error loading registrations:", err)
        } finally {
            setLoading(false)
        }
    }

    // --- Parse .cer ---
    async function handleCerUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setIsParsing(true)
        try {
            const formData = new FormData()
            formData.append("file", file)

            const res = await fetch("/api/compliance/parse-cer", {
                method: "POST",
                body: formData,
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            // Auto-fill the form but keep the user's selected type
            const currentType = createForm.type
            const typeLabel = REGISTRATION_TYPES.find(t => t.value === currentType)?.label || currentType
            setCreateForm(prev => ({
                ...prev,
                label: `${typeLabel} — ${result.name || ""}`,
                registrationNumber: result.rfc || "",
                issuedDate: result.issuedDate || "",
                expirationDate: result.expirationDate || "",
                notes: `No. Serie: ${result.serialNumber || "—"}\nEmail: ${result.email || "—"}\nCURP: ${result.curp || "—"}`,
            }))

            toast({ title: "✅ Certificado leído correctamente" })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            toast({ title: "Error al leer .cer", description: err.message, variant: "destructive" })
        } finally {
            setIsParsing(false)
            if (cerInputRef.current) cerInputRef.current.value = ""
        }
    }

    // --- Upload file (PDF/cer) to a registration ---
    async function handleFileUpload(registrationId: string, file: File) {
        setUploadingId(registrationId)
        try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("registrationId", registrationId)

            const res = await fetch("/api/compliance/upload", {
                method: "POST",
                body: formData,
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            toast({ title: "✅ Archivo adjuntado" })
            loadRegistrations()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            toast({ title: "Error al subir archivo", description: err.message, variant: "destructive" })
        } finally {
            setUploadingId(null)
        }
    }

    function triggerFileUpload(registrationId: string) {
        setUploadingId(registrationId)
        const input = document.createElement("input")
        input.type = "file"
        input.accept = ".pdf,.cer,.doc,.docx,.jpg,.png"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input.onchange = (e: any) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(registrationId, file)
            else setUploadingId(null)
        }
        input.click()
    }

    // --- Create ---
    async function handleCreate() {
        if (!createForm.label) return
        setIsSaving(true)
        try {
            const res = await fetch("/api/compliance/registrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientId, type: createForm.type, label: createForm.label,
                    registrationNumber: createForm.registrationNumber,
                    issuedDate: createForm.issuedDate || null,
                    expirationDate: createForm.expirationDate || null,
                    notes: createForm.notes,
                }),
            })
            if (res.ok) {
                toast({ title: "✅ Registro creado" })
                setIsCreateOpen(false)
                setCreateForm({ ...emptyForm })
                loadRegistrations()
            } else {
                const r = await res.json()
                toast({ title: "Error", description: r.error, variant: "destructive" })
            }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            toast({ title: "Error al crear", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    // --- Edit ---
    function openEdit(reg: Registration) {
        setEditingReg(reg)
        setEditForm({
            type: reg.type || "otro", label: reg.label || "",
            registrationNumber: reg.registration_number || "",
            issuedDate: reg.issued_date || "", expirationDate: reg.expiration_date || "",
            notes: reg.notes || "",
        })
        setIsEditOpen(true)
    }

    async function handleEdit() {
        if (!editingReg) return
        setIsEditSaving(true)
        try {
            const res = await fetch("/api/compliance/registrations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingReg.id, type: editForm.type, label: editForm.label,
                    registrationNumber: editForm.registrationNumber,
                    issuedDate: editForm.issuedDate || null,
                    expirationDate: editForm.expirationDate || null,
                    notes: editForm.notes,
                }),
            })
            if (res.ok) {
                toast({ title: "✅ Registro actualizado" })
                setIsEditOpen(false)
                setEditingReg(null)
                loadRegistrations()
            } else {
                const r = await res.json()
                toast({ title: "Error", description: r.error, variant: "destructive" })
            }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            toast({ title: "Error al actualizar", variant: "destructive" })
        } finally {
            setIsEditSaving(false)
        }
    }

    // --- Delete ---
    function openDelete(reg: Registration) { setDeletingReg(reg); setIsDeleteOpen(true) }

    async function handleDelete() {
        if (!deletingReg) return
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/compliance/registrations?id=${deletingReg.id}`, { method: "DELETE" })
            if (res.ok) {
                toast({ title: "✅ Registro eliminado" })
                setIsDeleteOpen(false); setDeletingReg(null); loadRegistrations()
            } else {
                const r = await res.json()
                toast({ title: "Error", description: r.error, variant: "destructive" })
            }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            toast({ title: "Error al eliminar", variant: "destructive" })
        } finally {
            setIsDeleting(false)
        }
    }

    // --- Filtering ---
    const filtered = registrations.filter(r => {
        const matchesSearch = r.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.notes?.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch && (filterType === "all" || r.type === filterType)
    })

    const counts = {
        total: registrations.length,
        vigente: registrations.filter(r => computeStatus(r.expiration_date).label === "Vigente").length,
        porVencer: registrations.filter(r => computeStatus(r.expiration_date).label === "Por vencer").length,
        vencido: registrations.filter(r => computeStatus(r.expiration_date).label === "Vencido").length,
    }

    // --- Shared form fields ---
    function renderFormFields(form: typeof emptyForm, setForm: (f: typeof emptyForm) => void, showCerButton?: boolean) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {showCerButton && (
                    <div className="sm:col-span-2">
                        <div className="border-2 border-dashed border-indigo-200 rounded-lg p-4 text-center bg-indigo-50/50 hover:border-indigo-400 transition-colors">
                            <input ref={cerInputRef} type="file" accept=".cer" className="hidden"
                                onChange={handleCerUpload} />
                            <Button variant="outline" onClick={() => cerInputRef.current?.click()}
                                disabled={isParsing}
                                className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-100">
                                {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                                {isParsing ? "Leyendo certificado..." : "Subir archivo .cer para auto-llenar"}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                                Sube un archivo .cer y los campos se llenarán automáticamente
                            </p>
                        </div>
                    </div>
                )}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tipo de Registro *</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                        {REGISTRATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Descripción *</label>
                    <Input placeholder="Ej: e.Firma de Juan Pérez" value={form.label}
                        onChange={e => setForm({ ...form, label: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Número de Registro / RFC</label>
                    <Input placeholder="RFC, No. Patronal, etc." value={form.registrationNumber}
                        onChange={e => setForm({ ...form, registrationNumber: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Fecha de Emisión</label>
                    <Input type="date" value={form.issuedDate}
                        onChange={e => setForm({ ...form, issuedDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Fecha de Vencimiento</label>
                    <Input type="date" value={form.expirationDate}
                        onChange={e => setForm({ ...form, expirationDate: e.target.value })} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Notas</label>
                    <textarea placeholder="Observaciones..." value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold">Registros de {clientName}</h3>
                    <p className="text-sm text-muted-foreground">{registrations.length} registro{registrations.length !== 1 ? "s" : ""}</p>
                </div>
                {canEdit && (
                    <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1 bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4" /> Nuevo Registro
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por descripción, número o notas..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="all">Todos los tipos</option>
                    {REGISTRATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
            </div>

            {/* Summary */}
            {registrations.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="bg-indigo-50 border-indigo-100">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-indigo-600 font-medium">Total</p>
                            <p className="text-xl font-bold text-indigo-700">{counts.total}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-100">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-green-600 font-medium">Vigentes</p>
                            <p className="text-xl font-bold text-green-700">{counts.vigente}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 border-yellow-100">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-yellow-600 font-medium">Por Vencer</p>
                            <p className="text-xl font-bold text-yellow-700">{counts.porVencer}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-100">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-red-600 font-medium">Vencidos</p>
                            <p className="text-xl font-bold text-red-700">{counts.vencido}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Cargando registros...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center">
                            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">
                                {registrations.length === 0 ? "No hay registros para este cliente" : "No se encontraron registros con ese filtro"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descripción</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">No. Registro</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Emitido</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vence</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vigencia</th>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Archivo</th>
                                        {canEdit && <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(reg => {
                                        const typeInfo = getTypeInfo(reg.type)
                                        const statusInfo = computeStatus(reg.expiration_date)
                                        const TypeIcon = typeInfo.icon
                                        return (
                                            <tr key={reg.id} className={`border-b hover:bg-muted/30 transition-colors ${statusInfo.label === "Vencido" ? "bg-red-50/50" : statusInfo.label === "Por vencer" ? "bg-yellow-50/30" : ""}`}>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-xs font-medium">{typeInfo.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 max-w-[200px]">
                                                    <span className="font-medium">{reg.label}</span>
                                                    {reg.notes && (
                                                        <p className="text-xs text-muted-foreground truncate mt-0.5" title={reg.notes}>{reg.notes}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{reg.registration_number || "—"}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDate(reg.issued_date)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDate(reg.expiration_date)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(reg.expiration_date)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`text-xs ${statusInfo.label === "Vencido" ? "text-red-600 font-medium" : statusInfo.label === "Por vencer" ? "text-yellow-600 font-medium" : "text-muted-foreground"}`}>
                                                        {daysUntilExpiration(reg.expiration_date)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {reg.file_url ? (
                                                        <a href={reg.file_url} target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline">
                                                            <FileDown className="h-3.5 w-3.5" /> Ver archivo
                                                        </a>
                                                    ) : canEdit ? (
                                                        <Button variant="ghost" size="sm"
                                                            className="h-7 px-2 text-xs text-muted-foreground hover:text-indigo-600"
                                                            onClick={() => triggerFileUpload(reg.id)}
                                                            disabled={uploadingId === reg.id}>
                                                            {uploadingId === reg.id ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <><Upload className="h-3.5 w-3.5 mr-1" /> Adjuntar</>
                                                            )}
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                {canEdit && (
                                                    <td className="px-4 py-3 whitespace-nowrap text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button variant="ghost" size="sm"
                                                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                onClick={() => openEdit(reg)} title="Editar">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm"
                                                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => openDelete(reg)} title="Eliminar">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-indigo-600" /> Nuevo Registro
                        </DialogTitle>
                    </DialogHeader>
                    {renderFormFields(createForm, setCreateForm, true)}
                    <DialogFooter className="gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreate} disabled={isSaving || !createForm.label} className="bg-indigo-600 hover:bg-indigo-700">
                            {isSaving ? "Guardando..." : "Crear Registro"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-blue-600" /> Editar Registro
                        </DialogTitle>
                    </DialogHeader>
                    {renderFormFields(editForm, setEditForm)}
                    <DialogFooter className="gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                        <Button onClick={handleEdit} disabled={isEditSaving || !editForm.label}>
                            {isEditSaving ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" /> Eliminar Registro
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        ¿Estás seguro de que deseas eliminar <strong>{deletingReg?.label}</strong>? Esta acción no se puede deshacer.
                    </p>
                    <DialogFooter className="gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
