"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
    Plus, Clock, CheckCircle2, AlertCircle, Play, Loader2,
    CalendarDays, User2, Building2, Tag, ListTodo,
} from "lucide-react"

type Task = {
    id: string
    title: string
    description: string | null
    client_id: string | null
    assigned_to: string | null
    assigned_to_name: string | null
    module: string | null
    category: string | null
    status: string
    priority: string
    estimated_hours: number | null
    due_date: string | null
    started_at: string | null
    completed_at: string | null
    created_at: string
}

type Employee = { id: string; name: string }
type Client = { id: string; name: string }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
    en_proceso: { label: "En Proceso", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Play },
    completada: { label: "Completada", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
    cancelada: { label: "Cancelada", color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    normal: { label: "Normal", color: "bg-slate-100 text-slate-700" },
    alta: { label: "Alta", color: "bg-orange-100 text-orange-700" },
    urgente: { label: "Urgente", color: "bg-red-100 text-red-700" },
}

const MODULES = [
    { value: "accounting", label: "Contabilidad" },
    { value: "fiscal", label: "Fiscal" },
    { value: "legal", label: "Legal" },
    { value: "labor", label: "Laboral" },
    { value: "procedures", label: "Trámites" },
    { value: "compliance", label: "Cumplimiento" },
    { value: "invoicing", label: "Facturación" },
    { value: "general", label: "General" },
]

const emptyForm = {
    title: "",
    description: "",
    client_id: "",
    assigned_to: "",
    module: "general",
    priority: "normal",
    estimated_hours: "",
    due_date: "",
}

export function TasksPanel() {
    const { toast } = useToast()
    const [tasks, setTasks] = useState<Task[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("todas")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [submitting, setSubmitting] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const loadTasks = useCallback(async () => {
        try {
            const [tasksRes, settingsRes] = await Promise.all([
                fetch("/api/supervision/tasks"),
                fetch("/api/supervision/settings"),
            ])
            const tasksData = await tasksRes.json()
            const settingsData = await settingsRes.json()
            setTasks(tasksData.tasks || [])
            setEmployees(settingsData.employees || [])

            // Use clients from settings, fallback to /api/clients/list
            let clientList = settingsData.clients || []
            if (clientList.length === 0) {
                try {
                    const clientsRes = await fetch("/api/clients/list")
                    const clientsData = await clientsRes.json()
                    clientList = (clientsData.clients || []).map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (c: any) => ({ id: c.id, name: c.business_name || c.name || "Sin nombre" })
                    )
                } catch (e) {
                    console.error("Error fetching clients fallback:", e)
                }
            }
            setClients(clientList)
        } catch {
            toast({ title: "Error al cargar tareas", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => { loadTasks() }, [loadTasks])

    const filteredTasks = filter === "todas"
        ? tasks
        : tasks.filter(t => t.status === filter)

    async function handleCreate() {
        if (!form.title.trim()) {
            toast({ title: "El título es obligatorio", variant: "destructive" })
            return
        }
        setSubmitting(true)
        try {
            const emp = employees.find(e => e.id === form.assigned_to)
            const res = await fetch("/api/supervision/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description || null,
                    client_id: form.client_id || null,
                    assigned_to: form.assigned_to || null,
                    assigned_to_name: emp?.name || null,
                    module: form.module || null,
                    priority: form.priority || "normal",
                    estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
                    due_date: form.due_date || null,
                }),
            })
            if (!res.ok) throw new Error("Error al crear tarea")
            toast({ title: "✅ Tarea creada exitosamente" })
            setDialogOpen(false)
            setForm(emptyForm)
            await loadTasks()
        } catch {
            toast({ title: "Error al crear la tarea", variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    async function handleStatusChange(taskId: string, newStatus: string) {
        setUpdatingId(taskId)
        try {
            const res = await fetch("/api/supervision/tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId, status: newStatus }),
            })
            if (!res.ok) throw new Error("Error")
            const statusLabel = STATUS_CONFIG[newStatus]?.label || newStatus
            toast({ title: `Estado actualizado: ${statusLabel}` })
            await loadTasks()
        } catch {
            toast({ title: "Error al actualizar", variant: "destructive" })
        } finally {
            setUpdatingId(null)
        }
    }

    const getNextStatus = (current: string) => {
        if (current === "pendiente") return "en_proceso"
        if (current === "en_proceso") return "completada"
        return null
    }

    const getNextStatusLabel = (current: string) => {
        if (current === "pendiente") return "Iniciar"
        if (current === "en_proceso") return "Completar"
        return null
    }

    // Summary counts
    const counts = {
        todas: tasks.length,
        pendiente: tasks.filter(t => t.status === "pendiente").length,
        en_proceso: tasks.filter(t => t.status === "en_proceso").length,
        completada: tasks.filter(t => t.status === "completada").length,
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with action */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {counts.todas} tarea{counts.todas !== 1 ? "s" : ""} · {counts.pendiente} pendiente{counts.pendiente !== 1 ? "s" : ""} · {counts.en_proceso} en proceso
                    </p>
                </div>
                <Button
                    onClick={() => { setForm(emptyForm); setDialogOpen(true) }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Nueva Tarea
                </Button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {([
                    { key: "todas", label: "Todas" },
                    { key: "pendiente", label: "Pendientes" },
                    { key: "en_proceso", label: "En Proceso" },
                    { key: "completada", label: "Completadas" },
                ] as const).map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                            ${filter === f.key
                                ? "bg-indigo-600 text-white"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        {f.label} ({counts[f.key]})
                    </button>
                ))}
            </div>

            {/* Task list */}
            {filteredTasks.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="p-10 text-center">
                        <ListTodo className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No hay tareas {filter !== "todas" ? "con este estado" : "creadas aún"}.</p>
                        {filter === "todas" && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="mt-3"
                                onClick={() => { setForm(emptyForm); setDialogOpen(true) }}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Crear primera tarea
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredTasks.map(task => {
                        const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pendiente
                        const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.normal
                        const StatusIcon = statusCfg.icon
                        const nextStatus = getNextStatus(task.status)
                        const nextLabel = getNextStatusLabel(task.status)
                        const moduleName = MODULES.find(m => m.value === task.module)?.label || task.module

                        return (
                            <Card key={task.id} className="border hover:border-indigo-200 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Status icon */}
                                        <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${statusCfg.color}`}>
                                            <StatusIcon className="h-4 w-4" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-foreground">{task.title}</h3>
                                                    {task.description && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <Badge variant="outline" className={`text-[10px] ${priorityCfg.color} border-0`}>
                                                        {priorityCfg.label}
                                                    </Badge>
                                                    <Badge variant="outline" className={`text-[10px] ${statusCfg.color} border-0`}>
                                                        {statusCfg.label}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Meta info */}
                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                {task.assigned_to_name && (
                                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <User2 className="h-3 w-3" />
                                                        {task.assigned_to_name}
                                                    </span>
                                                )}
                                                {task.client_id && (
                                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <Building2 className="h-3 w-3" />
                                                        {clients.find(c => c.id === task.client_id)?.name || "Cliente"}
                                                    </span>
                                                )}
                                                {moduleName && (
                                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <Tag className="h-3 w-3" />
                                                        {moduleName}
                                                    </span>
                                                )}
                                                {task.due_date && (
                                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <CalendarDays className="h-3 w-3" />
                                                        {new Date(task.due_date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                                                    </span>
                                                )}
                                                {task.estimated_hours && (
                                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {task.estimated_hours}h est.
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action buttons */}
                                            {nextStatus && (
                                                <div className="mt-3">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs"
                                                        disabled={updatingId === task.id}
                                                        onClick={() => handleStatusChange(task.id, nextStatus)}
                                                    >
                                                        {updatingId === task.id ? (
                                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                        ) : nextStatus === "en_proceso" ? (
                                                            <Play className="h-3 w-3 mr-1" />
                                                        ) : (
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        )}
                                                        {nextLabel}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Create Task Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nueva Tarea</DialogTitle>
                        <DialogDescription>
                            Asigna una tarea a un empleado. Recibirá una notificación automática.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Title */}
                        <div>
                            <Label className="text-xs font-medium">Título *</Label>
                            <Input
                                placeholder="Ej. Preparar declaración mensual"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="mt-1"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <Label className="text-xs font-medium">Descripción</Label>
                            <textarea
                                placeholder="Detalles adicionales de la tarea..."
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[70px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Assigned to + Client */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-medium">Asignar a</Label>
                                <select
                                    value={form.assigned_to}
                                    onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                                    className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">Sin asignar</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="text-xs font-medium">Cliente</Label>
                                <select
                                    value={form.client_id}
                                    onChange={e => setForm({ ...form, client_id: e.target.value })}
                                    className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">Sin cliente</option>
                                    {clients.map(cl => (
                                        <option key={cl.id} value={cl.id}>{cl.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Module + Priority */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-medium">Módulo</Label>
                                <select
                                    value={form.module}
                                    onChange={e => setForm({ ...form, module: e.target.value })}
                                    className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {MODULES.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="text-xs font-medium">Prioridad</Label>
                                <select
                                    value={form.priority}
                                    onChange={e => setForm({ ...form, priority: e.target.value })}
                                    className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="alta">Alta</option>
                                    <option value="urgente">Urgente</option>
                                </select>
                            </div>
                        </div>

                        {/* Hours + Due date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-medium">Horas estimadas</Label>
                                <Input
                                    type="number"
                                    placeholder="Ej. 2"
                                    value={form.estimated_hours}
                                    onChange={e => setForm({ ...form, estimated_hours: e.target.value })}
                                    className="mt-1"
                                    min={0.5}
                                    step={0.5}
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-medium">Fecha límite</Label>
                                <Input
                                    type="date"
                                    value={form.due_date}
                                    onChange={e => setForm({ ...form, due_date: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={submitting}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    Crear Tarea
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
