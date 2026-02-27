"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, CheckCheck, UserPlus, AlertCircle, Info, Clock, CheckCircle2, X, MessageSquare, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Badge } from "@/components/ui/badge"

interface Notification {
    id: string
    user_id: string
    from_user_id?: string
    from_user_name?: string
    type: string
    title: string
    message: string
    module?: string
    entity_type?: string
    entity_id?: string
    is_read: boolean
    created_at: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typeConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
    assignment: { icon: UserPlus, color: "text-blue-600", bgColor: "bg-blue-100" },
    alert: { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-100" },
    deadline: { icon: Clock, color: "text-orange-600", bgColor: "bg-orange-100" },
    completion: { icon: CheckCircle2, color: "text-emerald-600", bgColor: "bg-emerald-100" },
    info: { icon: Info, color: "text-primary", bgColor: "bg-primary/10" },
}

function formatTimeAgo(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Justo ahora"
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}

// Check if a notification supports replies (payroll alerts/completion from labor module)
function isPayrollNotification(n: Notification): boolean {
    // Primary check: module/entity_type fields
    if (n.module === "labor" && n.entity_type === "payroll" && (n.type === "alert" || n.type === "completion" || n.type === "info")) {
        return true
    }
    // Fallback: detect by title patterns (in case module/entity_type not populated)
    if (n.from_user_id && n.title && (
        n.title.includes("Nómina") || n.title.includes("nómina") ||
        n.title.includes("Respuesta:") || n.title.includes("pendiente") ||
        n.title.includes("Nómina lista") || n.title.includes("Nómina pendiente")
    )) {
        return true
    }
    return false
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [_loading, _setLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Reply state
    const [replyingTo, setReplyingTo] = useState<Notification | null>(null)
    const [replyText, setReplyText] = useState("")
    const [replySending, setReplySending] = useState(false)

    useEffect(() => {
        loadNotifications()
        const interval = setInterval(loadNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setReplyingTo(null)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    async function loadNotifications() {
        try {
            const res = await fetch("/api/notifications?limit=15")
            const result = await res.json()
            if (res.ok) {
                setNotifications(result.data || [])
                setUnreadCount(result.unreadCount || 0)
            }
        } catch (err) {
            console.error("Error loading notifications:", err)
        }
    }

    async function markAsRead(notificationId: string) {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId }),
            })
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
            )
            setUnreadCount((prev) => Math.max(0, prev - 1))
        } catch (err) {
            console.error("Error marking as read:", err)
        }
    }

    async function markAllAsRead() {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true }),
            })
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch (err) {
            console.error("Error marking all as read:", err)
        }
    }

    async function handleReply() {
        if (!replyingTo || !replyText.trim() || !replyingTo.from_user_id) return

        setReplySending(true)
        try {
            const res = await fetch("/api/labor/payroll-notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    payrollId: replyingTo.entity_id || undefined,
                    recipientUserId: replyingTo.from_user_id,
                    type: "reply",
                    reason: replyText,
                    replyToNotificationId: replyingTo.id,
                }),
            })

            if (!res.ok) {
                const result = await res.json()
                throw new Error(result.error)
            }

            // Mark original as read
            if (!replyingTo.is_read) {
                markAsRead(replyingTo.id)
            }

            setReplyingTo(null)
            setReplyText("")
            loadNotifications()
        } catch (err) {
            console.error("Error sending reply:", err)
        }
        setReplySending(false)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <Button
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 p-0"
                onClick={() => { setIsOpen(!isOpen); setReplyingTo(null) }}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </Button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-background border-2 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                        <h3 className="font-semibold text-sm">Notificaciones</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllAsRead}>
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Marcar todo leído
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Reply panel */}
                    {replyingTo && (
                        <div className="px-4 py-3 border-b bg-blue-50/50 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-blue-700">
                                    💬 Respondiendo a {replyingTo.from_user_name || "usuario"}
                                </p>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setReplyingTo(null)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{replyingTo.title}</p>
                            <textarea
                                className="w-full text-sm border rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                                rows={2}
                                placeholder="Escribe tu respuesta..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                autoFocus
                            />
                            <Button
                                size="sm"
                                className="w-full"
                                disabled={!replyText.trim() || replySending}
                                onClick={handleReply}
                            >
                                {replySending ? "Enviando..." : (
                                    <>
                                        <Send className="h-3.5 w-3.5 mr-1" />
                                        Enviar Respuesta
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Notifications List */}
                    <div className="overflow-y-auto max-h-[400px]">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                    <Bell className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">Sin notificaciones</p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const config = typeConfig[notification.type] || typeConfig.info
                                const TypeIcon = config.icon
                                const canReply = isPayrollNotification(notification) && notification.from_user_id

                                return (
                                    <div
                                        key={notification.id}
                                        className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer ${!notification.is_read ? "bg-primary/5" : ""
                                            }`}
                                        onClick={() => {
                                            if (!notification.is_read) markAsRead(notification.id)
                                        }}
                                    >
                                        <div className={`h-9 w-9 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                            <TypeIcon className={`h-4 w-4 ${config.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm leading-snug ${!notification.is_read ? "font-semibold" : ""}`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.is_read && (
                                                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 whitespace-pre-line">{notification.message}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[11px] text-muted-foreground">{formatTimeAgo(notification.created_at)}</span>
                                                {notification.from_user_name && (
                                                    <>
                                                        <span className="text-[11px] text-muted-foreground">•</span>
                                                        <span className="text-[11px] text-muted-foreground">De: {notification.from_user_name}</span>
                                                    </>
                                                )}
                                                {canReply && (
                                                    <button
                                                        className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/20 font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setReplyingTo(notification)
                                                            setReplyText("")
                                                            if (!notification.is_read) markAsRead(notification.id)
                                                        }}
                                                    >
                                                        <MessageSquare className="h-3.5 w-3.5" />
                                                        💬 Responder
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
