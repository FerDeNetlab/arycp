"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ArrowLeft,
    Clock,
    Download,
    Send,
    User,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
    Paperclip,
    MessageSquare,
    UserCheck,
} from "lucide-react"
import { InvoiceRequestView } from "./invoice-request-view"
import { EmployeeRequestView } from "./employee-request-view"

interface ServiceRequest {
    id: string
    client_id: string
    client_name: string | null
    requested_by_name: string | null
    module: string
    request_type: string
    title: string
    description: string | null
    priority: string
    status: string
    assigned_to: string | null
    assigned_to_name: string | null
    admin_notes: string | null
    attachments: { name: string; url: string; size: number }[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any>
    created_at: string
    updated_at: string
}

interface Comment {
    id: string
    user_name: string | null
    user_role: string | null
    message: string
    attachments: { name: string; url: string }[]
    created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700", icon: Clock },
    en_proceso: { label: "En Proceso", color: "bg-blue-100 text-blue-700", icon: Loader2 },
    completada: { label: "Completada", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    rechazada: { label: "Rechazada", color: "bg-red-100 text-red-700", icon: XCircle },
}

interface RequestDetailProps {
    request: ServiceRequest
    onBack: () => void
    isClient?: boolean
}

export function RequestDetail({ request, onBack, isClient = false }: RequestDetailProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState("")
    const [sending, setSending] = useState(false)
    const [status, setStatus] = useState(request.status)
    const [updating, setUpdating] = useState(false)
    const [assignedName, setAssignedName] = useState(request.assigned_to_name || "")
    const [taking, setTaking] = useState(false)
    const commentsEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [request.id])

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [comments])

    async function loadComments() {
        try {
            const res = await fetch(`/api/service-requests/${request.id}/comments`)
            const result = await res.json()
            if (res.ok) setComments(result.data || [])
        } catch (err) {
            console.error("Error loading comments:", err)
        }
    }

    async function handleSendComment() {
        if (!newComment.trim()) return
        setSending(true)
        try {
            const res = await fetch(`/api/service-requests/${request.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: newComment }),
            })
            if (res.ok) {
                setNewComment("")
                loadComments()
            }
        } catch (err) {
            console.error("Error sending comment:", err)
        } finally {
            setSending(false)
        }
    }

    async function handleStatusChange(newStatus: string) {
        setUpdating(true)
        try {
            const res = await fetch(`/api/service-requests/${request.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            })
            if (res.ok) {
                setStatus(newStatus)
            }
        } catch (err) {
            console.error("Error updating status:", err)
        } finally {
            setUpdating(false)
        }
    }

    async function handleTakeRequest() {
        setTaking(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get user name
            const { data: profile } = await supabase
                .from("users")
                .select("full_name")
                .eq("id", user.id)
                .single()
            const userName = profile?.full_name || user.email || "Contador"

            const res = await fetch(`/api/service-requests/${request.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assignedTo: user.id,
                    assignedToName: userName,
                    status: "en_proceso",
                }),
            })
            if (res.ok) {
                setAssignedName(userName)
                setStatus("en_proceso")
            }
        } catch (err) {
            console.error("Error taking request:", err)
        } finally {
            setTaking(false)
        }
    }

    function formatDate(d: string) {
        return new Date(d).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    function formatFileSize(bytes: number) {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.pendiente
    const StatusIcon = statusCfg.icon

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold truncate">{request.title}</h2>
                        {request.priority === "urgente" && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs gap-0.5">
                                <AlertTriangle className="h-3 w-3" /> Urgente
                            </Badge>
                        )}
                        <Badge variant="outline" className={`${statusCfg.color} text-xs gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusCfg.label}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {request.client_name && `${request.client_name} · `}
                        {request.metadata?.moduleLabel || request.module} · {request.metadata?.requestTypeLabel || request.request_type}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Description */}
                    {request.description && (
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Descripción</h3>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{request.description}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Invoice data (structured CFDI fields) */}
                    {request.metadata?.invoiceData && (
                        <InvoiceRequestView
                            data={request.metadata.invoiceData}
                            requestType={request.request_type}
                        />
                    )}

                    {/* Employee data (structured alta/baja fields) */}
                    {request.metadata?.employeeData && (
                        <EmployeeRequestView
                            data={request.metadata.employeeData}
                            requestType={request.request_type}
                        />
                    )}

                    {/* Attachments */}
                    {request.attachments && request.attachments.length > 0 && (
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                                    <Paperclip className="h-3.5 w-3.5" />
                                    Archivos adjuntos ({request.attachments.length})
                                </h3>
                                <div className="space-y-1.5">
                                    {request.attachments.map((att, i) => (
                                        <a
                                            key={i}
                                            href={att.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                                        >
                                            <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <span className="truncate flex-1">{att.name}</span>
                                            <span className="text-xs text-muted-foreground">{formatFileSize(att.size)}</span>
                                        </a>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Comments */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5" />
                                Conversación
                            </h3>

                            {comments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay comentarios aún
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto mb-3">
                                    {comments.map(comment => (
                                        <div
                                            key={comment.id}
                                            className={`flex gap-2 ${comment.user_role === "cliente" ? "justify-start" : "justify-end"}`}
                                        >
                                            <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                                                comment.user_role === "cliente"
                                                    ? "bg-muted"
                                                    : "bg-indigo-50 border border-indigo-100"
                                            }`}>
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-[11px] font-medium">{comment.user_name}</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {formatDate(comment.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap">{comment.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={commentsEndRef} />
                                </div>
                            )}

                            {/* Comment input */}
                            <div className="flex gap-2">
                                <Textarea
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    rows={2}
                                    className="flex-1 resize-none"
                                    onKeyDown={e => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendComment()
                                        }
                                    }}
                                />
                                <Button
                                    size="icon"
                                    onClick={handleSendComment}
                                    disabled={!newComment.trim() || sending}
                                    className="self-end"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar info */}
                <div className="space-y-4">
                    {/* Request info */}
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase">Información</h3>

                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-xs text-muted-foreground">Solicitante</span>
                                    <p className="font-medium">{request.requested_by_name || "—"}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">Empresa</span>
                                    <p className="font-medium">{request.client_name || "—"}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">Módulo</span>
                                    <p>{request.metadata?.moduleLabel || request.module}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">Tipo</span>
                                    <p>{request.metadata?.requestTypeLabel || request.request_type}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">Fecha</span>
                                    <p className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(request.created_at)}
                                    </p>
                                </div>
                                {assignedName && (
                                    <div>
                                        <span className="text-xs text-muted-foreground">Asignada a</span>
                                        <p className="font-medium flex items-center gap-1">
                                            <UserCheck className="h-3.5 w-3.5 text-green-600" />
                                            {assignedName}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status management (contadoras/admin only) */}
                    {!isClient && (
                        <Card>
                            <CardContent className="p-4 space-y-3">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase">Gestionar</h3>

                                {/* Take request button — shown when unassigned */}
                                {!assignedName && status === "pendiente" && (
                                    <Button
                                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                                        onClick={handleTakeRequest}
                                        disabled={taking}
                                    >
                                        <UserCheck className="h-4 w-4" />
                                        {taking ? "Tomando..." : "Tomar Solicitud"}
                                    </Button>
                                )}

                                {assignedName && status === "pendiente" && (
                                    <p className="text-xs text-muted-foreground text-center">
                                        Asignada — cambia estado a "En Proceso" para comenzar
                                    </p>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground">Cambiar estado</label>
                                    <Select value={status} onValueChange={handleStatusChange} disabled={updating}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pendiente">Pendiente</SelectItem>
                                            <SelectItem value="en_proceso">En Proceso</SelectItem>
                                            <SelectItem value="completada">Completada</SelectItem>
                                            <SelectItem value="rechazada">Rechazada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
