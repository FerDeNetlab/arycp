"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Clock,
    Search,
    Filter,
    Inbox,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
    FileText,
    Receipt,
    Calculator,
    Scale,
    Briefcase,
    FileWarning,
} from "lucide-react"
import { RequestDetail } from "./request-detail"

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
    metadata: Record<string, string>
    created_at: string
    updated_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    en_proceso: { label: "En Proceso", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2 },
    completada: { label: "Completada", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
    rechazada: { label: "Rechazada", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
}

const MODULE_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
    invoicing: { label: "Facturación", icon: Receipt, color: "text-emerald-600" },
    procedures: { label: "Trámites", icon: FileText, color: "text-indigo-600" },
    fiscal: { label: "Fiscal", icon: FileWarning, color: "text-orange-600" },
    accounting: { label: "Contabilidad", icon: Calculator, color: "text-blue-600" },
    legal: { label: "Jurídico", icon: Scale, color: "text-purple-600" },
    labor: { label: "Laboral", icon: Briefcase, color: "text-pink-600" },
    general: { label: "General", icon: FileText, color: "text-gray-600" },
}

interface RequestListProps {
    isClient?: boolean
}

export function RequestList({ isClient = false }: RequestListProps) {
    const [requests, setRequests] = useState<ServiceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("all")
    const [moduleFilter, setModuleFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)

    useEffect(() => {
        loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, moduleFilter])

    async function loadRequests() {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (statusFilter !== "all") params.set("status", statusFilter)
            if (moduleFilter !== "all") params.set("module", moduleFilter)

            const res = await fetch(`/api/service-requests?${params}`)
            const result = await res.json()
            if (res.ok) setRequests(result.data || [])
        } catch (err) {
            console.error("Error loading requests:", err)
        } finally {
            setLoading(false)
        }
    }

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return requests
        const q = searchQuery.toLowerCase()
        return requests.filter(r =>
            r.title.toLowerCase().includes(q) ||
            r.client_name?.toLowerCase().includes(q) ||
            r.requested_by_name?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q)
        )
    }, [requests, searchQuery])

    const pendingCount = requests.filter(r => r.status === "pendiente").length

    function formatDate(d: string) {
        return new Date(d).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    if (selectedRequest) {
        return (
            <RequestDetail
                request={selectedRequest}
                onBack={() => {
                    setSelectedRequest(null)
                    loadRequests()
                }}
                isClient={isClient}
            />
        )
    }

    return (
        <div className="space-y-4">
            {/* Header stats */}
            {!isClient && pendingCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800 font-medium">
                        {pendingCount} solicitud{pendingCount > 1 ? "es" : ""} pendiente{pendingCount > 1 ? "s" : ""} de atención
                    </p>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar solicitudes..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                            <Filter className="h-3.5 w-3.5 mr-1.5" />
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="en_proceso">En Proceso</SelectItem>
                            <SelectItem value="completada">Completada</SelectItem>
                            <SelectItem value="rechazada">Rechazada</SelectItem>
                        </SelectContent>
                    </Select>
                    {!isClient && (
                        <Select value={moduleFilter} onValueChange={setModuleFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Módulo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {Object.entries(MODULE_CONFIG).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Cargando solicitudes...
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                    <Inbox className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">No hay solicitudes</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isClient ? "Tus solicitudes aparecerán aquí" : "Las solicitudes de clientes aparecerán aquí"}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(req => {
                        const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pendiente
                        const moduleCfg = MODULE_CONFIG[req.module] || MODULE_CONFIG.general
                        const StatusIcon = statusCfg.icon
                        const ModuleIcon = moduleCfg.icon

                        return (
                            <Card
                                key={req.id}
                                className="cursor-pointer hover:shadow-md transition-all group"
                                onClick={() => setSelectedRequest(req)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Module icon */}
                                        <div className={`mt-0.5 ${moduleCfg.color}`}>
                                            <ModuleIcon className="h-5 w-5" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="font-semibold text-sm truncate">{req.title}</h3>
                                                {req.priority === "urgente" && (
                                                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-[10px] gap-0.5 px-1.5">
                                                        <AlertTriangle className="h-2.5 w-2.5" /> Urgente
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                                {!isClient && req.client_name && (
                                                    <span className="font-medium text-foreground/70">{req.client_name}</span>
                                                )}
                                                <span>{moduleCfg.label}</span>
                                                <span>{req.metadata?.requestTypeLabel || req.request_type}</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(req.created_at)}
                                                </span>
                                            </div>

                                            {req.description && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{req.description}</p>
                                            )}
                                        </div>

                                        {/* Status badge */}
                                        <Badge variant="outline" className={`${statusCfg.color} text-[11px] gap-1 flex-shrink-0`}>
                                            <StatusIcon className="h-3 w-3" />
                                            {statusCfg.label}
                                        </Badge>
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
