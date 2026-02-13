"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, CheckCheck, UserPlus, AlertCircle, Info, Clock, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadNotifications()
        // Poll every 30 seconds for new notifications
        const interval = setInterval(loadNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
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

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <Button
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 p-0"
                onClick={() => setIsOpen(!isOpen)}
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
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[11px] text-muted-foreground">{formatTimeAgo(notification.created_at)}</span>
                                                {notification.from_user_name && (
                                                    <>
                                                        <span className="text-[11px] text-muted-foreground">•</span>
                                                        <span className="text-[11px] text-muted-foreground">De: {notification.from_user_name}</span>
                                                    </>
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
