"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Check, X, Clock, Palmtree, User, CalendarDays, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface VacationRequest {
    id: string
    user_name: string
    user_email: string
    start_date: string
    end_date: string
    days_count: number
    reason: string | null
    status: "pending" | "approved" | "rejected" | "cancelled"
    reviewed_by_name: string | null
    reviewed_at: string | null
    review_notes: string | null
    created_at: string
}

interface VacationManagerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    isAdmin: boolean
    onUpdated: () => void
}

const STATUS_BADGES: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending: { label: "Pendiente", className: "bg-amber-100 text-amber-800", icon: <Clock className="h-3 w-3" /> },
    approved: { label: "Aprobada", className: "bg-green-100 text-green-800", icon: <Check className="h-3 w-3" /> },
    rejected: { label: "Rechazada", className: "bg-red-100 text-red-800", icon: <X className="h-3 w-3" /> },
    cancelled: { label: "Cancelada", className: "bg-gray-100 text-gray-800", icon: <X className="h-3 w-3" /> },
}

function formatDate(dateStr: string) {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", {
        day: "numeric", month: "short", year: "numeric",
    })
}

export default function VacationManager({ open, onOpenChange, isAdmin, onUpdated }: VacationManagerProps) {
    const [requests, setRequests] = useState<VacationRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [reviewNotes, setReviewNotes] = useState("")
    const [reviewingId, setReviewingId] = useState<string | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")

    const loadRequests = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filter !== "all") params.set("status", filter)
            const res = await fetch(`/api/calendar/vacations?${params.toString()}`)
            const data = await res.json()
            if (res.ok) setRequests(data.data || [])
        } catch (err) {
            console.error("Error loading vacations:", err)
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => {
        if (open) loadRequests()
    }, [open, loadRequests])

    async function handleReview(id: string, action: "approve" | "reject") {
        setActionLoading(true)
        try {
            const res = await fetch("/api/calendar/vacations/review", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action, review_notes: reviewNotes.trim() || null }),
            })
            if (res.ok) {
                setReviewingId(null)
                setReviewNotes("")
                loadRequests()
                onUpdated()
            }
        } catch (err) {
            console.error("Error reviewing:", err)
        } finally {
            setActionLoading(false)
        }
    }

    const pendingCount = requests.filter(r => r.status === "pending").length

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Palmtree className="h-5 w-5 text-pink-600" />
                        {isAdmin ? "Gestión de Vacaciones" : "Mis Vacaciones"}
                        {pendingCount > 0 && (
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* Filters */}
                <div className="flex items-center gap-1.5">
                    {(["all", "pending", "approved", "rejected"] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                filter === f
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {f === "all" ? "Todas" : STATUS_BADGES[f].label}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-3 mt-2">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            No hay solicitudes de vacaciones
                        </div>
                    ) : (
                        requests.map(req => {
                            const badge = STATUS_BADGES[req.status]
                            const isReviewing = reviewingId === req.id

                            return (
                                <div key={req.id} className={cn(
                                    "border rounded-xl p-4 transition-all",
                                    req.status === "pending" && "border-amber-200 bg-amber-50/30",
                                    req.status === "approved" && "border-green-200/50",
                                    req.status === "rejected" && "border-red-200/50 opacity-70",
                                )}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-semibold">{req.user_name}</span>
                                        </div>
                                        <span className={cn(
                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                                            badge.className
                                        )}>
                                            {badge.icon} {badge.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                                        <span className="flex items-center gap-1">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            {formatDate(req.start_date)} — {formatDate(req.end_date)}
                                        </span>
                                        <span className="font-medium text-foreground">
                                            {req.days_count} {req.days_count === 1 ? "día" : "días"}
                                        </span>
                                    </div>

                                    {req.reason && (
                                        <p className="text-xs text-muted-foreground mb-2 flex items-start gap-1">
                                            <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                                            {req.reason}
                                        </p>
                                    )}

                                    {req.reviewed_by_name && (
                                        <p className="text-[11px] text-muted-foreground/70 mt-1">
                                            Revisado por {req.reviewed_by_name}
                                            {req.review_notes && ` — "${req.review_notes}"`}
                                        </p>
                                    )}

                                    {/* Admin actions for pending requests */}
                                    {isAdmin && req.status === "pending" && (
                                        <div className="mt-3 pt-2 border-t border-border">
                                            {isReviewing ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={reviewNotes}
                                                        onChange={e => setReviewNotes(e.target.value)}
                                                        placeholder="Notas (opcional)..."
                                                        className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background resize-none h-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleReview(req.id, "approve")}
                                                            disabled={actionLoading}
                                                            className="bg-green-600 hover:bg-green-700 text-xs h-8"
                                                        >
                                                            <Check className="h-3.5 w-3.5 mr-1" />
                                                            Aprobar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleReview(req.id, "reject")}
                                                            disabled={actionLoading}
                                                            className="text-xs h-8"
                                                        >
                                                            <X className="h-3.5 w-3.5 mr-1" />
                                                            Rechazar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => { setReviewingId(null); setReviewNotes("") }}
                                                            className="text-xs h-8"
                                                        >
                                                            Cancelar
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setReviewingId(req.id)}
                                                    className="text-xs h-8"
                                                >
                                                    Revisar solicitud
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
