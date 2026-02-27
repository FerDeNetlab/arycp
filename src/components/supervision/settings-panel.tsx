"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Save, Users, DollarSign } from "lucide-react"

type CapacitySetting = {
    id: string
    user_id: string
    user_name: string
    horas_laborales_diarias: number
    dias_laborales_semana: number
    salario_mensual: number
}

type ClientFinancial = {
    id: string
    client_id: string
    client_name: string
    ingreso_mensual: number
    costo_operativo_estimado: number
}

export function SettingsPanel() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [_capacities, setCapacities] = useState<CapacitySetting[]>([])
    const [_financials, setFinancials] = useState<ClientFinancial[]>([])
    const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])
    const [clients, setClients] = useState<{ id: string; name: string }[]>([])

    // Editable forms
    const [capForms, setCapForms] = useState<Record<string, { horas: number; dias: number; salario: number }>>({})
    const [finForms, setFinForms] = useState<Record<string, { ingreso: number; costo: number }>>({})

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/supervision/settings")
                const data = await res.json()
                setCapacities(data.capacities || [])
                setFinancials(data.financials || [])
                setEmployees(data.employees || [])
                setClients(data.clients || [])

                // Initialize forms
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const capMap: Record<string, any> = {}
                for (const c of data.capacities || []) {
                    capMap[c.user_id] = {
                        horas: c.horas_laborales_diarias,
                        dias: c.dias_laborales_semana,
                        salario: c.salario_mensual,
                    }
                }
                // Add missing employees
                for (const emp of data.employees || []) {
                    if (!capMap[emp.id]) {
                        capMap[emp.id] = { horas: 8, dias: 5, salario: 0 }
                    }
                }
                setCapForms(capMap)

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const finMap: Record<string, any> = {}
                for (const f of data.financials || []) {
                    finMap[f.client_id] = {
                        ingreso: f.ingreso_mensual,
                        costo: f.costo_operativo_estimado,
                    }
                }
                for (const cl of data.clients || []) {
                    if (!finMap[cl.id]) {
                        finMap[cl.id] = { ingreso: 0, costo: 0 }
                    }
                }
                setFinForms(finMap)
            } catch { /* empty */ } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    async function saveCapacity(userId: string) {
        const form = capForms[userId]
        if (!form) return
        setSaving(`cap-${userId}`)
        try {
            const res = await fetch("/api/supervision/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "capacity",
                    user_id: userId,
                    horas_laborales_diarias: form.horas,
                    dias_laborales_semana: form.dias,
                    salario_mensual: form.salario,
                }),
            })
            if (!res.ok) throw new Error("Error al guardar")
            toast({ title: "✅ Capacidad guardada" })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setSaving(null)
        }
    }

    async function saveFinancial(clientId: string) {
        const form = finForms[clientId]
        if (!form) return
        setSaving(`fin-${clientId}`)
        try {
            const res = await fetch("/api/supervision/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "financial",
                    client_id: clientId,
                    ingreso_mensual: form.ingreso,
                    costo_operativo_estimado: form.costo,
                }),
            })
            if (!res.ok) throw new Error("Error al guardar")
            toast({ title: "✅ Datos financieros guardados" })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setSaving(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Employee Capacity */}
            <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Capacidad por Empleado
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {employees.map(emp => {
                        const form = capForms[emp.id] || { horas: 8, dias: 5, salario: 0 }
                        return (
                            <Card key={emp.id} className="border shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">{emp.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <Label className="text-xs">Horas/día</Label>
                                            <Input
                                                type="number"
                                                value={form.horas}
                                                onChange={e => setCapForms({
                                                    ...capForms,
                                                    [emp.id]: { ...form, horas: parseFloat(e.target.value) || 0 },
                                                })}
                                                className="h-8 text-sm"
                                                min={1} max={24}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Días/sem</Label>
                                            <Input
                                                type="number"
                                                value={form.dias}
                                                onChange={e => setCapForms({
                                                    ...capForms,
                                                    [emp.id]: { ...form, dias: parseInt(e.target.value) || 0 },
                                                })}
                                                className="h-8 text-sm"
                                                min={1} max={7}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Salario $</Label>
                                            <Input
                                                type="number"
                                                value={form.salario}
                                                onChange={e => setCapForms({
                                                    ...capForms,
                                                    [emp.id]: { ...form, salario: parseFloat(e.target.value) || 0 },
                                                })}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => saveCapacity(emp.id)}
                                        disabled={saving === `cap-${emp.id}`}
                                        className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        <Save className="h-3 w-3 mr-1" />
                                        {saving === `cap-${emp.id}` ? "Guardando..." : "Guardar"}
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Client Financials */}
            <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    Datos Financieros por Cliente
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clients.map(cl => {
                        const form = finForms[cl.id] || { ingreso: 0, costo: 0 }
                        return (
                            <Card key={cl.id} className="border shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium truncate">{cl.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs">Ingreso mensual $</Label>
                                            <Input
                                                type="number"
                                                value={form.ingreso}
                                                onChange={e => setFinForms({
                                                    ...finForms,
                                                    [cl.id]: { ...form, ingreso: parseFloat(e.target.value) || 0 },
                                                })}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Costo operativo $</Label>
                                            <Input
                                                type="number"
                                                value={form.costo}
                                                onChange={e => setFinForms({
                                                    ...finForms,
                                                    [cl.id]: { ...form, costo: parseFloat(e.target.value) || 0 },
                                                })}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => saveFinancial(cl.id)}
                                        disabled={saving === `fin-${cl.id}`}
                                        className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        <Save className="h-3 w-3 mr-1" />
                                        {saving === `fin-${cl.id}` ? "Guardando..." : "Guardar"}
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
