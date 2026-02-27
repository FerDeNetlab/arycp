"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, ShieldX, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Alert {
    id: string
    clientId: string
    clientName: string
    type: string
    label: string
    expirationDate: string
    daysLeft: number
    severity: "expired" | "critical" | "warning"
}

const TYPE_LABELS: Record<string, string> = {
    efirma: "e.Firma",
    csd: "CSD",
    imss: "IMSS",
    isn: "ISN",
    fonacot: "FONACOT",
    repse: "REPSE",
    otro: "Otro",
}

export function ComplianceAlerts() {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/compliance/alerts")
            .then(res => res.json())
            .then(data => setAlerts(data.alerts || []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    if (loading) return null
    if (alerts.length === 0) return null

    const expired = alerts.filter(a => a.severity === "expired")
    const expiring = alerts.filter(a => a.severity !== "expired")

    return (
        <Card className="border border-red-100">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    Alertas de Vencimiento
                    <Badge className="ml-auto bg-red-100 text-red-700 hover:bg-red-100 text-xs">
                        {alerts.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
                {expired.length > 0 && (
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">Vencidos</p>
                        {expired.slice(0, 5).map(a => (
                            <Link key={a.id} href={`/dashboard/compliance/${a.clientId}`}>
                                <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 hover:bg-red-100 transition-colors cursor-pointer group">
                                    <ShieldX className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-red-800 truncate">{a.label}</p>
                                        <p className="text-[10px] text-red-600">{a.clientName} · {TYPE_LABELS[a.type] || a.type}</p>
                                    </div>
                                    <span className="text-[10px] text-red-600 font-medium whitespace-nowrap">
                                        hace {Math.abs(a.daysLeft)}d
                                    </span>
                                    <ChevronRight className="h-3 w-3 text-red-400 group-hover:text-red-600" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {expiring.length > 0 && (
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-yellow-600 uppercase tracking-wide">Próximos a vencer</p>
                        {expiring.slice(0, 5).map(a => (
                            <Link key={a.id} href={`/dashboard/compliance/${a.clientId}`}>
                                <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-pointer group">
                                    <ShieldAlert className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-yellow-800 truncate">{a.label}</p>
                                        <p className="text-[10px] text-yellow-600">{a.clientName} · {TYPE_LABELS[a.type] || a.type}</p>
                                    </div>
                                    <span className="text-[10px] text-yellow-600 font-medium whitespace-nowrap">
                                        {a.daysLeft}d
                                    </span>
                                    <ChevronRight className="h-3 w-3 text-yellow-400 group-hover:text-yellow-600" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <Link href="/dashboard/compliance"
                    className="block text-center text-xs text-indigo-600 hover:text-indigo-800 pt-1">
                    Ver todos los registros →
                </Link>
            </CardContent>
        </Card>
    )
}
