"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    CheckCircle, Clock, TrendingUp, AlertTriangle,
    Users, Crown, Target, Activity
} from "lucide-react"
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts"

type KPIs = {
    totalActivities: number
    tasksCompleted: number
    avgTimeHours: number
    complianceRate: number
    delayedCount: number
    avgScore: number
    mostProductive: { name: string; score: number } | null
    mostSaturated: { name: string; hours: number } | null
    topClient: { name: string; ingreso: number } | null
}

type EmployeeMetric = {
    name: string
    activities: number
    tasksCompleted: number
    score: number
    hoursWorked: number
    efficiency: number
    byModule: Record<string, number>
}

type ModuleBreakdown = {
    module: string
    label: string
    count: number
}

type TrendPoint = {
    month: string
    activities: number
    tasks: number
    score: number
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"]

export function SupervisionDashboard() {
    const [kpis, setKpis] = useState<KPIs | null>(null)
    const [employees, setEmployees] = useState<EmployeeMetric[]>([])
    const [modules, setModules] = useState<ModuleBreakdown[]>([])
    const [trend, setTrend] = useState<TrendPoint[]>([])
    const [loading, setLoading] = useState(true)

    const now = new Date()
    const [year] = useState(now.getFullYear())
    const [month] = useState(now.getMonth() + 1)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/supervision/stats?year=${year}&month=${month}`)
                const data = await res.json()
                setKpis(data.kpis)
                setEmployees(data.employeeMetrics || [])
                setModules(data.moduleBreakdown || [])
                setTrend(data.trend || [])
            } catch { /* empty */ } finally {
                setLoading(false)
            }
        }
        load()
    }, [year, month])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Cargando métricas...</p>
                </div>
            </div>
        )
    }

    if (!kpis) return <p className="text-muted-foreground text-center py-10">No se pudieron cargar las métricas.</p>

    const kpiCards = [
        { label: "Total Actividades", value: kpis.totalActivities, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950" },
        { label: "Tareas Completadas", value: kpis.tasksCompleted, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
        { label: "Tiempo Promedio", value: `${kpis.avgTimeHours}h`, icon: Clock, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
        { label: "Retrasos", value: kpis.delayedCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
        { label: "Score Promedio", value: kpis.avgScore, icon: Target, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
        { label: "Más Productivo", value: kpis.mostProductive?.name || "—", subtitle: kpis.mostProductive ? `${kpis.mostProductive.score} pts` : "", icon: Crown, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
        { label: "Más Saturado", value: kpis.mostSaturated?.name || "—", subtitle: kpis.mostSaturated ? `${kpis.mostSaturated.hours}h` : "", icon: Users, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" },
        { label: "Cliente Top", value: kpis.topClient?.name || "—", subtitle: kpis.topClient ? `$${kpis.topClient.ingreso?.toLocaleString()}` : "", icon: TrendingUp, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950" },
    ]

    // Employee score bar chart
    const barData = employees.map(e => ({
        name: e.name.split(" ")[0],
        score: e.score,
        actividades: e.activities,
        tareas: e.tasksCompleted,
    }))

    // Module pie chart
    const pieData = modules.filter(m => m.count > 0).map(m => ({
        name: m.label,
        value: m.count,
    }))

    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpiCards.map((kpi, i) => (
                    <Card key={i} className="border shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className={`h-9 w-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                                    <kpi.icon className={`h-4.5 w-4.5 ${kpi.color}`} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold truncate">{kpi.value}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
                            {kpi.subtitle && <div className={`text-xs font-medium mt-1 ${kpi.color}`}>{kpi.subtitle}</div>}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Score by Employee */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Score por Empleado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {barData.length > 0 && barData.some(d => d.score > 0) ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="actividades" fill="#6366f1" radius={[4, 4, 0, 0]} name="Actividades" stackId="a" />
                                    <Bar dataKey="tareas" fill="#10b981" radius={[4, 4, 0, 0]} name="Tareas (×5)" stackId="a" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                                Sin datos de actividad aún
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Monthly Trend */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Tendencia Mensual (6 meses)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {trend.some(t => t.score > 0) ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={trend}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Line type="monotone" dataKey="activities" stroke="#6366f1" strokeWidth={2} name="Actividades" dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={2} name="Tareas" dot={{ r: 4 }} />
                                    <Legend />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                                Sin datos de tendencia aún
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Second row */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Module Breakdown */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Actividad por Módulo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                                Sin datos de módulos aún
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Rankings */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Ranking de Productividad</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {employees.length > 0 ? (
                            <div className="space-y-3">
                                {[...employees].sort((a, b) => b.score - a.score).map((emp, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-700" : "bg-muted-foreground/30"
                                            }`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{emp.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {emp.activities} actividades · {emp.tasksCompleted} tareas · {emp.hoursWorked}h
                                            </div>
                                        </div>
                                        <div className={`text-sm font-bold ${emp.score >= 20 ? "text-emerald-600" : emp.score >= 10 ? "text-amber-600" : "text-muted-foreground"}`}>
                                            {emp.score} pts
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                                Sin datos de empleados
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
