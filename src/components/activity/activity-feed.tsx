"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface ActivityItem {
    id: string
    user_id: string
    user_name: string
    client_id?: string
    client_name?: string
    module: string
    action: string
    entity_type?: string
    entity_id?: string
    description: string
    metadata?: Record<string, any>
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
}

const actionIcons: Record<string, any> = {
    created: FileText,
    updated: RefreshCw,
    assigned: UserPlus,
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
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadActivities()
    }, [])

    async function loadActivities() {
        try {
            const res = await fetch(`/api/activity?limit=${limit}`)
            const result = await res.json()
            if (res.ok) {
                setActivities(result.data || [])
            }
        } catch (err) {
            console.error("Error loading activities:", err)
        } finally {
            setLoading(false)
        }
    }

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

    if (activities.length === 0) {
        return (
            <Card className="border-2 animate-fade-in-up delay-3">
                <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
                        <p className="text-xs text-muted-foreground mt-1">Las actividades aparecerán aquí conforme se registren</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-2 animate-fade-in-up delay-3">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Actividad Reciente</CardTitle>
                <Button variant="ghost" size="sm" onClick={loadActivities} className="h-8 w-8 p-0">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    {activities.map((activity, index) => {
                        const modConfig = moduleConfig[activity.module] || moduleConfig.process
                        const ActionIcon = actionIcons[activity.action] || FileText
                        const isAssignment = activity.action === "assigned"
                        const isLast = index === activities.length - 1

                        return (
                            <div
                                key={activity.id}
                                className={`flex items-start gap-3 py-3 ${!isLast ? "border-b border-border" : ""} hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors`}
                            >
                                {/* Icon */}
                                <div className={`h-9 w-9 rounded-full ${isAssignment ? "bg-blue-100" : modConfig.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                    <ActionIcon className={`h-4 w-4 ${isAssignment ? "text-blue-600" : modConfig.color}`} />
                                </div>

                                {/* Content */}
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
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
