"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
    Clock, CheckCircle2, AlertCircle, Play, Loader2,
    CalendarDays, Building2, Tag, ListTodo, MessageSquare,
} from "lucide-react"

type Task = {
    id: string
    title: string
    description: string | null
    client_id: string | null
    assigned_to: string | null
    assigned_to_name: string | null
    module: string | null
    status: string
    priority: string
    estimated_hours: number | null
    due_date: string | null
    started_at: string | null
    completed_at: string | null
    created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-800", icon: Clock },
    en_proceso: { label: "En Proceso", color: "bg-blue-100 text-blue-800", icon: Play },
    completada: { label: "Completada", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
    cancelada: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: AlertCircle },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    normal: { label: "Normal", color: "bg-slate-100 text-slate-700" },
    alta: { label: "Alta", color: "bg-orange-100 text-orange-700" },
    urgente: { label: "Urgente", color: "bg-red-100 text-red-700" },
}

const MODULES: Record<string, string> = {
    accounting: "Contabilidad",
    fiscal: "Fiscal",
    legal: "Legal",
    labor: "Laboral",
    procedures: "Trámites",
    compliance: "Cumplimiento",
    invoicing: "Facturación",
    general: "General",
    supervision: "Supervisión",
}

export function MyTasksPanel() {
    const { toast } = useToast()
    const supabase = createClient()
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("activas")
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [clientNames, setClientNames] = useState<Record<string, string>>({})

    const loadTasks = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .eq("assigned_to", user.id)
                .order("created_at", { ascending: false })

            if (error) throw error
            setTasks(data || [])

            // Load client names for tasks that have client_id
            const clientIds = [...new Set((data || []).filter(t => t.client_id).map(t => t.client_id!))]
            if (clientIds.length > 0) {
                const { data: clients } = await supabase
                    .from("clients")
                    .select("id, business_name, name")
                    .in("id", clientIds)
                const names: Record<string, string> = {}
                for (const c of clients || []) {
                    names[c.id] = c.business_name || c.name || "Sin nombre"
                }
                setClientNames(names)
            }
        } catch {
            toast({ title: "Error al cargar tareas", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [supabase, toast])

    useEffect(() => { loadTasks() }, [loadTasks])

    const filteredTasks = filter === "activas"
        ? tasks.filter(t => t.status === "pendiente" || t.status === "en_proceso")
        : filter === "completadas"
            ? tasks.filter(t => t.status === "completada")
            : tasks

    async function handleStatusChange(taskId: string, newStatus: string) {
        setUpdatingId(taskId)
        try {
            const res = await fetch("/api/my-tasks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId, status: newStatus }),
            })
            if (!res.ok) throw new Error("Error")
            const statusLabel = STATUS_CONFIG[newStatus]?.label || newStatus
            toast({ title: `✅ Estado actualizado: ${statusLabel}` })
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

    const getNextLabel = (current: string) => {
        if (current === "pendiente") return "Iniciar"
        if (current === "en_proceso") return "Completar"
        return null
    }

    const counts = {
        todas: tasks.length,
        activas: tasks.filter(t => t.status === "pendiente" || t.status === "en_proceso").length,
        completadas: tasks.filter(t => t.status === "completada").length,
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="border">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-amber-600">{counts.activas}</p>
                        <p className="text-xs text-muted-foreground">Pendientes</p>
                    </CardContent>
                </Card>
                <Card className="border">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{counts.completadas}</p>
                        <p className="text-xs text-muted-foreground">Completadas</p>
                    </CardContent>
                </Card>
                <Card className="border">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-slate-600">{counts.todas}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {([
                    { key: "activas", label: "Activas" },
                    { key: "completadas", label: "Completadas" },
                    { key: "todas", label: "Todas" },
                ] as const).map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                            ${filter === f.key
                                ? "bg-emerald-600 text-white"
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
                        <p className="text-muted-foreground text-sm">
                            {filter === "activas"
                                ? "🎉 No tienes tareas pendientes."
                                : filter === "completadas"
                                    ? "Aún no has completado tareas."
                                    : "No tienes tareas asignadas."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredTasks.map(task => {
                        const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pendiente
                        const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.normal
                        const StatusIcon = statusCfg.icon
                        const nextStatus = getNextStatus(task.status)
                        const nextLabel = getNextLabel(task.status)
                        const moduleName = MODULES[task.module || ""] || task.module
                        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completada"

                        return (
                            <Card key={task.id} className={`border transition-colors ${isOverdue ? "border-red-300 bg-red-50/30" : "hover:border-emerald-200"}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${statusCfg.color}`}>
                                            <StatusIcon className="h-4 w-4" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-foreground">{task.title}</h3>
                                                    {task.description && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                            <MessageSquare className="h-3 w-3 inline mr-1" />
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {isOverdue && (
                                                        <Badge variant="outline" className="text-[10px] bg-red-100 text-red-700 border-0">
                                                            Vencida
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className={`text-[10px] ${priorityCfg.color} border-0`}>
                                                        {priorityCfg.label}
                                                    </Badge>
                                                    <Badge variant="outline" className={`text-[10px] ${statusCfg.color} border-0`}>
                                                        {statusCfg.label}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Meta */}
                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                {task.client_id && clientNames[task.client_id] && (
                                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <Building2 className="h-3 w-3" />
                                                        {clientNames[task.client_id]}
                                                    </span>
                                                )}
                                                {moduleName && (
                                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <Tag className="h-3 w-3" />
                                                        {moduleName}
                                                    </span>
                                                )}
                                                {task.due_date && (
                                                    <span className={`flex items-center gap-1 text-[11px] ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
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

                                            {/* Actions */}
                                            {nextStatus && (
                                                <div className="mt-3">
                                                    <Button
                                                        size="sm"
                                                        className={`h-7 text-xs ${nextStatus === "completada"
                                                            ? "bg-green-600 hover:bg-green-700 text-white"
                                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                                            }`}
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
        </div>
    )
}
