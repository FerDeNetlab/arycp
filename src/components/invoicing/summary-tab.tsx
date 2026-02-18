"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, XCircle, DollarSign, Clock, TrendingUp, AlertTriangle } from "lucide-react"

interface SummaryData {
    totalInvoices: number
    vigentes: number
    canceladas: number
    totalAmount: number
    totalCancellations: number
    pendientes: number
    canceladasSAT: number
    rechazadas: number
    monthlyData: { month: number; invoices: number; cancellations: number; amount: number }[]
}

interface SummaryTabProps {
    clientId: string
    clientName: string
}

export function SummaryTab({ clientId, clientName }: SummaryTabProps) {
    const [data, setData] = useState<SummaryData | null>(null)
    const [loading, setLoading] = useState(true)
    const [year, setYear] = useState(new Date().getFullYear())

    useEffect(() => {
        loadSummary()
    }, [clientId, year])

    async function loadSummary() {
        setLoading(true)
        try {
            const res = await fetch(`/api/invoicing/summary?clientId=${clientId}&year=${year}`)
            const result = await res.json()
            if (res.ok && result.data) setData(result.data)
        } catch (err) {
            console.error("Error:", err)
        } finally {
            setLoading(false)
        }
    }

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Cargando resumen...</div>
    }

    if (!data) {
        return <div className="p-8 text-center text-muted-foreground">No se pudo cargar el resumen</div>
    }

    const maxInvoices = Math.max(...data.monthlyData.map(m => m.invoices), 1)
    const maxCancels = Math.max(...data.monthlyData.map(m => m.cancellations), 1)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Resumen Anual</h3>
                    <p className="text-sm text-muted-foreground">{clientName} • {year}</p>
                </div>
                <select value={year} onChange={e => setYear(parseInt(e.target.value))}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                    {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* Main stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 font-medium">Facturas Emitidas</p>
                                <p className="text-2xl font-bold text-blue-800">{data.totalInvoices}</p>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-blue-600">
                            <span>✅ {data.vigentes} vigentes</span>
                            <span>❌ {data.canceladas} canceladas</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-green-500 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-green-600 font-medium">Monto Total</p>
                                <p className="text-xl font-bold text-green-800">
                                    ${data.totalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center">
                                <XCircle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-orange-600 font-medium">Cancelaciones</p>
                                <p className="text-2xl font-bold text-orange-800">{data.totalCancellations}</p>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-orange-600">
                            <span>✅ {data.canceladasSAT} exitosas</span>
                            <span>⏳ {data.pendientes} pendientes</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-red-500 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-red-600 font-medium">Rechazadas SAT</p>
                                <p className="text-2xl font-bold text-red-800">{data.rechazadas}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Desglose Mensual
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Mes</th>
                                    <th className="text-center px-3 py-2 font-medium text-blue-600">Facturas</th>
                                    <th className="text-center px-3 py-2 font-medium text-orange-600">Cancelaciones</th>
                                    <th className="text-right px-3 py-2 font-medium text-green-600">Monto</th>
                                    <th className="px-3 py-2 w-[200px]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.monthlyData.map(m => (
                                    <tr key={m.month} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="px-3 py-2.5 font-medium">{monthNames[m.month - 1]} {year}</td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className={`inline-block min-w-[24px] ${m.invoices > 0 ? "font-semibold text-blue-700" : "text-muted-foreground"}`}>
                                                {m.invoices}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className={`inline-block min-w-[24px] ${m.cancellations > 0 ? "font-semibold text-orange-700" : "text-muted-foreground"}`}>
                                                {m.cancellations}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-mono text-xs">
                                            {m.amount > 0 ? `$${m.amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex gap-1 items-center h-4">
                                                <div className="bg-blue-400 rounded-sm h-3"
                                                    style={{ width: `${Math.max((m.invoices / maxInvoices) * 100, 0)}px` }} />
                                                <div className="bg-orange-400 rounded-sm h-3"
                                                    style={{ width: `${Math.max((m.cancellations / maxCancels) * 30, 0)}px` }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-muted/50 font-semibold">
                                    <td className="px-3 py-2.5">Total {year}</td>
                                    <td className="px-3 py-2.5 text-center text-blue-700">{data.totalInvoices}</td>
                                    <td className="px-3 py-2.5 text-center text-orange-700">{data.totalCancellations}</td>
                                    <td className="px-3 py-2.5 text-right font-mono text-xs text-green-700">
                                        ${data.totalAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
