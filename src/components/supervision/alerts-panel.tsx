"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Clock, RefreshCcw, XCircle, Info, Zap } from "lucide-react"

type Alert = {
    id: string
    type: string
    severity: string
    title: string
    message: string
    entity_name: string
    is_resolved: boolean
    created_at: string
}

function getSeverityIcon(severity: string) {
    switch (severity) {
        case "danger": return <XCircle className="h-5 w-5 text-red-600" />
        case "warning": return <AlertTriangle className="h-5 w-5 text-amber-600" />
        case "info": return <Info className="h-5 w-5 text-blue-600" />
        default: return <Info className="h-5 w-5 text-muted-foreground" />
    }
}

function getSeverityBadge(severity: string) {
    switch (severity) {
        case "danger": return <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">Crítico</Badge>
        case "warning": return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">Advertencia</Badge>
        default: return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">Info</Badge>
    }
}

export function AlertsPanel() {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)

    async function loadAlerts() {
        setLoading(true)
        try {
            const res = await fetch("/api/supervision/alerts")
            const data = await res.json()
            setAlerts(data.alerts || [])
        } catch { /* empty */ } finally {
            setLoading(false)
        }
    }

    async function generateAlerts() {
        setGenerating(true)
        try {
            await fetch("/api/supervision/alerts", { method: "POST" })
            await loadAlerts()
        } catch { /* empty */ } finally {
            setGenerating(false)
        }
    }

    async function resolveAlert(alertId: string) {
        try {
            await fetch("/api/supervision/alerts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ alertId }),
            })
            setAlerts(prev => prev.filter(a => a.id !== alertId))
        } catch { /* empty */ }
    }

    useEffect(() => { loadAlerts() }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const critical = alerts.filter(a => a.severity === "danger")
    const warnings = alerts.filter(a => a.severity === "warning")
    const info = alerts.filter(a => a.severity === "info")

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">{alerts.length} alertas activas</Badge>
                    {critical.length > 0 && <Badge className="bg-red-100 text-red-700">{critical.length} críticas</Badge>}
                    {warnings.length > 0 && <Badge className="bg-amber-100 text-amber-700">{warnings.length} advertencias</Badge>}
                </div>
                <Button
                    onClick={generateAlerts}
                    size="sm"
                    variant="outline"
                    disabled={generating}
                    className="gap-1"
                >
                    <RefreshCcw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                    {generating ? "Analizando..." : "Actualizar Alertas"}
                </Button>
            </div>

            {/* Alert list */}
            {alerts.length === 0 ? (
                <Card className="border">
                    <CardContent className="py-12 text-center">
                        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                        <p className="text-lg font-medium">Sin alertas activas</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Haz clic en &quot;Actualizar Alertas&quot; para analizar el estado actual
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {alerts.map(alert => (
                        <Card key={alert.id} className={`border shadow-sm ${alert.severity === "danger" ? "border-l-4 border-l-red-500" :
                                alert.severity === "warning" ? "border-l-4 border-l-amber-500" :
                                    "border-l-4 border-l-blue-500"
                            }`}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        {getSeverityIcon(alert.severity)}
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">{alert.title}</span>
                                                {getSeverityBadge(alert.severity)}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(alert.created_at).toLocaleString("es-MX")}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => resolveAlert(alert.id)}
                                        className="text-xs text-muted-foreground hover:text-emerald-600 flex-shrink-0"
                                    >
                                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                        Resolver
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
