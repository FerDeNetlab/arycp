"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Clock, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type ClientData = {
    id: string
    name: string
    ingresoMensual: number
    hoursInvested: number
    costoOperativo: number
    costoLaboral: number
    costoTotal: number
    rentabilidad: number
    margen: number
    margenLevel: string
    tasksCompleted: number
    categoryHours: Record<string, number>
    trend: { month: string; hours: number; tasks: number }[]
}

function getMargenBadge(level: string, margen: number) {
    if (level === "alto") return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">{margen}% Margen</Badge>
    if (level === "medio") return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">{margen}% Margen</Badge>
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">{margen}% Margen</Badge>
}

export function ClientProfitability() {
    const [clients, setClients] = useState<ClientData[]>([])
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/supervision/clients")
                const data = await res.json()
                setClients(data.clients || [])
                setSummary(data.summary || null)
            } catch { /* empty */ } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold">{summary.totalClients}</div>
                            <div className="text-xs text-muted-foreground">Clientes Totales</div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-600">{summary.profitable}</div>
                            <div className="text-xs text-muted-foreground">Rentables</div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">{summary.withLosses}</div>
                            <div className="text-xs text-muted-foreground">Con Pérdidas</div>
                        </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold">${summary.totalRevenue?.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Ingreso Total</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Client list */}
            {clients.map(client => (
                <Card key={client.id} className="border shadow-sm hover:shadow-md transition-shadow">
                    <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${client.rentabilidad > 0 ? "bg-emerald-600" : "bg-red-600"
                                    }`}>
                                    {client.rentabilidad > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                </div>
                                <div>
                                    <div className="font-medium">{client.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {client.tasksCompleted} tareas · {client.hoursInvested}h invertidas
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {getMargenBadge(client.margenLevel, client.margen)}
                                <span className={`text-lg font-bold ${client.rentabilidad >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    ${Math.abs(client.rentabilidad).toLocaleString()}
                                </span>
                                {expandedId === client.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                        </div>
                    </div>

                    {expandedId === client.id && (
                        <CardContent className="pt-0 pb-5 border-t">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <DollarSign className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                                    <div className="text-lg font-bold">${client.ingresoMensual.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">Ingreso Mensual</div>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <Clock className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                                    <div className="text-lg font-bold">{client.hoursInvested}h</div>
                                    <div className="text-xs text-muted-foreground">Horas Invertidas</div>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className="text-lg font-bold text-red-600">${client.costoTotal.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">Costo Total</div>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <div className={`text-lg font-bold ${client.rentabilidad >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                        ${client.rentabilidad.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Rentabilidad</div>
                                </div>
                            </div>

                            {/* Category Breakdown */}
                            {Object.keys(client.categoryHours).length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium mb-2">Horas por Categoría</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(client.categoryHours).map(([cat, hrs]) => (
                                            <Badge key={cat} variant="outline" className="text-xs">
                                                {cat}: {(hrs as number).toFixed(1)}h
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Trend */}
                            {client.trend.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                        <TrendingUp className="h-4 w-4" /> Tendencia 3 meses
                                    </h4>
                                    <ResponsiveContainer width="100%" height={140}>
                                        <BarChart data={client.trend}>
                                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "hsl(var(--card))",
                                                    border: "1px solid hsl(var(--border))",
                                                    borderRadius: "8px",
                                                    fontSize: "12px",
                                                }}
                                            />
                                            <Bar dataKey="hours" fill="#6366f1" radius={[3, 3, 0, 0]} name="Horas" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>
            ))}

            {clients.length === 0 && (
                <Card className="border">
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Configura los ingresos de tus clientes en la pestaña Configuración para ver la rentabilidad.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
