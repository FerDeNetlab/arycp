"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Target, Zap, AlertTriangle, TrendingUp, ChevronDown, ChevronUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type Employee = {
    id: string
    name: string
    email: string
    role: string
    hoursWorked: number
    capacityHours: number
    loadIndex: number
    loadLevel: string
    tasksCompleted: number
    inProgressCount: number
    efficiency: number
    compliance: number
    delayed: number
    costoHora: number
    salario: number
    trend: { month: string; tasks: number; hours: number }[]
}

function getLoadBadge(level: string) {
    switch (level) {
        case "sobrecargado": return <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">Sobrecargado</Badge>
        case "alto": return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">Alto</Badge>
        case "optimo": return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">Óptimo</Badge>
        default: return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">Bajo</Badge>
    }
}

export function EmployeeView() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/supervision/employees")
                const data = await res.json()
                setEmployees(data.employees || [])
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
        <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
                {employees.length} empleado{employees.length !== 1 ? "s" : ""} encontrado{employees.length !== 1 ? "s" : ""}
            </div>

            {employees.map(emp => (
                <Card key={emp.id} className="border shadow-sm hover:shadow-md transition-shadow">
                    <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-sm font-bold text-indigo-600">
                                    {emp.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-medium">{emp.name}</div>
                                    <div className="text-xs text-muted-foreground">{emp.email} · {emp.role}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {getLoadBadge(emp.loadLevel)}
                                <span className="text-lg font-bold">{emp.loadIndex}%</span>
                                {expandedId === emp.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                        </div>
                    </div>

                    {expandedId === emp.id && (
                        <CardContent className="pt-0 pb-5 border-t">
                            {/* Metrics grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <Clock className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                                    <div className="text-lg font-bold">{emp.hoursWorked}h</div>
                                    <div className="text-xs text-muted-foreground">Horas Trabajadas</div>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <Target className="h-4 w-4 mx-auto mb-1 text-indigo-600" />
                                    <div className="text-lg font-bold">{emp.capacityHours}h</div>
                                    <div className="text-xs text-muted-foreground">Capacidad Mes</div>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <Zap className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                                    <div className="text-lg font-bold">{emp.efficiency}%</div>
                                    <div className="text-xs text-muted-foreground">Eficiencia</div>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-red-600" />
                                    <div className="text-lg font-bold">{emp.delayed}</div>
                                    <div className="text-xs text-muted-foreground">Retrasos</div>
                                </div>
                            </div>

                            {/* Additional stats */}
                            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                                <div><span className="text-muted-foreground">Tareas completadas:</span> <strong>{emp.tasksCompleted}</strong></div>
                                <div><span className="text-muted-foreground">En proceso:</span> <strong>{emp.inProgressCount}</strong></div>
                                <div><span className="text-muted-foreground">Costo/hora:</span> <strong>${emp.costoHora.toLocaleString()}</strong></div>
                            </div>

                            {/* Trend chart */}
                            {emp.trend && emp.trend.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                        <TrendingUp className="h-4 w-4" /> Tendencia 3 meses
                                    </h4>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <BarChart data={emp.trend}>
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
                                            <Bar dataKey="tasks" fill="#6366f1" radius={[3, 3, 0, 0]} name="Tareas" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>
            ))}

            {employees.length === 0 && (
                <Card className="border">
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No se encontraron empleados con datos este mes.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
