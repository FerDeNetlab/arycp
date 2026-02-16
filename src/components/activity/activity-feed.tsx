"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    TrendingUp,
    FileText,
    Upload,
    UserPlus,
    CheckCircle2,
    AlertCircle,
    Calculator,
    FileWarning,
    Scale,
    Briefcase,
    ClipboardCheck,
    ArrowRight,
    RefreshCw,
    Bell,
    Check,
    AlertTriangle,
} from "lucide-react"

interface NotificationItem {
    id: string
    realId: string
    title: string
    message: string
    module: string
    type: string
    from_user_name: string
    is_read: boolean
    created_at: string
}

interface ActivityItem {
    id: string
    user_name: string
    client_name?: string
    module: string
    action: string
    description: string
    created_at: string
}

const moduleConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
    accounting: { icon: Calculator, color: "text-primary", bgColor: "bg-primary/10", label: "Contabilidad" },
    fiscal: { icon: FileWarning, color: "text-orange-600", bgColor: "bg-orange-100", label: "Fiscal" },
    legal: { icon: Scale, color: "text-purple-600", bgColor: "bg-purple-100", label: "Jurídico" },
    labor: { icon: Briefcase, color: "text-green-600", bgColor: "bg-green-100", label: "Laboral" },
    procedures: { icon: FileText, color: "text-cyan-600", bgColor: "bg-cyan-100", label: "Trámites" },
    procedure: { icon: FileText, color: "text-cyan-600", bgColor: "bg-cyan-100", label: "Trámites" },
    process: { icon: ClipboardCheck, color: "text-emerald-600", bgColor: "bg-emerald-100", label: "Procesos" },
    system: { icon: AlertCircle, color: "text-gray-600", bgColor: "bg-gray-100", label: "Sistema" },
}

const actionIcons: Record<string, any> = {
    created: FileText,
    updated: RefreshCw,
    assigned: UserPlus,
    assignment: UserPlus,
    completed: CheckCircle2,
    uploaded: Upload,
    imported: TrendingUp,
    alert: AlertCircle,
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

export function ActivityFeed({ limit = 15 }: { limit?: number }) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)
    const [markingRead, setMarkingRead] = useState<string | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [notifRes, actRes] = await Promise.all([
                fetch(`/api/notifications?limit=${limit}`),
                fetch(`/api/activity?limit=${limit}`),
            ])

            const notifResult = await notifRes.json()
            const actResult = await actRes.json()

            if (notifRes.ok && notifResult.data) {
                setNotifications(notifResult.data.map((n: any) => ({
                    id: `notif-${n.id}`,
                    realId: n.id,
                    title: n.title || "",
                    message: n.message || "",
                    module: n.module || "system",
                    type: n.type || "alert",
                    from_user_name: n.from_user_name || "",
                    is_read: n.is_read,
                    created_at: n.created_at,
                })))
            }

            if (actRes.ok && actResult.data) {
                // Filter out notification-type items from activity (we show those separately)
                const pureActivities = (actResult.data || []).filter((a: any) => !a.isNotification)
                setActivities(pureActivities)
            }
        } catch (err) {
            console.error("Error loading data:", err)
        } finally {
            setLoading(false)
        }
    }

    async function markAsRead(notifRealId: string) {
        setMarkingRead(notifRealId)
        try {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: notifRealId }),
            })
            if (res.ok) {
                // Move notification from unread to read
                setNotifications(prev =>
                    prev.map(n => n.realId === notifRealId ? { ...n, is_read: true } : n)
                )
            }
        } catch (err) {
            console.error("Error marking as read:", err)
        } finally {
            setMarkingRead(null)
        }
    }

    // Separate unread and read notifications
    const unreadNotifs = notifications.filter(n => !n.is_read)
    const readNotifs = notifications.filter(n => n.is_read)

    if (loading) {
        return (
            <Card className="border-2 animate-fade-in-up delay-3">
                <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-start gap-4 pb-4 border-b border-border animate-pulse">
                                <div className="h-9 w-9 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-muted rounded w-3/4" />
                                    <div className="h-3 bg-muted rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const hasContent = unreadNotifs.length > 0 || readNotifs.length > 0 || activities.length > 0

    return (
        <Card className="border-2 animate-fade-in-up delay-3">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    Actividad Reciente
                    {unreadNotifs.length > 0 && (
                        <Badge className="bg-red-100 text-red-700 text-xs">{unreadNotifs.length} nueva{unreadNotifs.length > 1 ? "s" : ""}</Badge>
                    )}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={loadData} className="h-8 w-8 p-0">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                {!hasContent ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
                        <p className="text-xs text-muted-foreground mt-1">Las actividades aparecerán aquí conforme se registren</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {/* ===== UNREAD NOTIFICATIONS - ALWAYS ON TOP, RED ALERT ===== */}
                        {unreadNotifs.map(notif => {
                            const modConfig = moduleConfig[notif.module] || moduleConfig.system
                            return (
                                <div
                                    key={notif.id}
                                    className="bg-red-50 border-l-4 border-l-red-500 rounded-r-xl p-3 mb-2 shadow-sm animate-fade-in-up"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-full bg-red-100 ring-2 ring-red-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <AlertTriangle className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-red-800">{notif.title}</p>
                                                <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0"></span>
                                            </div>
                                            <p className="text-sm text-red-700 mt-0.5 leading-snug">{notif.message}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] text-red-500">{formatTimeAgo(notif.created_at)}</span>
                                                    <span className="text-[11px] text-red-400">•</span>
                                                    <span className="text-[11px] text-red-500">De: {notif.from_user_name}</span>
                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${modConfig.color} border-current/20`}>
                                                        {modConfig.label}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs gap-1 bg-white hover:bg-green-50 border-green-300 text-green-700 hover:text-green-800"
                                                    disabled={markingRead === notif.realId}
                                                    onClick={() => markAsRead(notif.realId)}
                                                >
                                                    <Check className="h-3 w-3" />
                                                    Enterado
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Separator if there are unread notifs and other content */}
                        {unreadNotifs.length > 0 && (readNotifs.length > 0 || activities.length > 0) && (
                            <div className="border-t border-dashed border-border my-3 pt-1"></div>
                        )}

                        {/* ===== READ NOTIFICATIONS + ACTIVITIES (CHRONOLOGICAL) ===== */}
                        {(() => {
                            // Merge read notifications and activities chronologically
                            const mergedItems: { type: "notif" | "activity"; data: any; date: Date }[] = []

                            readNotifs.forEach(n => mergedItems.push({ type: "notif", data: n, date: new Date(n.created_at) }))
                            activities.forEach(a => mergedItems.push({ type: "activity", data: a, date: new Date(a.created_at) }))

                            mergedItems.sort((a, b) => b.date.getTime() - a.date.getTime())

                            return mergedItems.slice(0, limit).map(item => {
                                if (item.type === "notif") {
                                    const notif = item.data as NotificationItem
                                    const modConfig = moduleConfig[notif.module] || moduleConfig.system
                                    return (
                                        <div
                                            key={notif.id}
                                            className="flex items-start gap-3 py-3 border-b border-border bg-muted/20 rounded-lg px-2 -mx-2 transition-colors"
                                        >
                                            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <UserPlus className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-muted-foreground">{notif.title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{notif.message}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[11px] text-muted-foreground">{formatTimeAgo(notif.created_at)}</span>
                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${modConfig.color} border-current/20`}>
                                                        {modConfig.label}
                                                    </Badge>
                                                    <Badge className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-600">
                                                        <Check className="h-2.5 w-2.5 mr-0.5" />Enterado
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }

                                // Activity item
                                const activity = item.data as ActivityItem
                                const modConfig = moduleConfig[activity.module] || moduleConfig.process
                                const ActionIcon = actionIcons[activity.action] || FileText
                                const isAssignment = activity.action === "assigned"

                                return (
                                    <div
                                        key={activity.id}
                                        className="flex items-start gap-3 py-3 border-b border-border hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors"
                                    >
                                        <div className={`h-9 w-9 rounded-full ${isAssignment ? "bg-blue-100" : modConfig.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                            <ActionIcon className={`h-4 w-4 ${isAssignment ? "text-blue-600" : modConfig.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm leading-snug">{activity.description}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[11px] text-muted-foreground">{formatTimeAgo(activity.created_at)}</span>
                                                {activity.client_name && (
                                                    <>
                                                        <span className="text-[11px] text-muted-foreground">•</span>
                                                        <span className="text-[11px] text-muted-foreground truncate">{activity.client_name}</span>
                                                    </>
                                                )}
                                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${modConfig.color} border-current/20`}>
                                                    {modConfig.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        })()}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
