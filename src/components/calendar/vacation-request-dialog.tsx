"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Palmtree, CalendarDays } from "lucide-react"

interface VacationRequestDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onRequestCreated: () => void
}

export default function VacationRequestDialog({ open, onOpenChange, onRequestCreated }: VacationRequestDialogProps) {
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Calculate business days
    function getBusinessDays(start: string, end: string): number {
        if (!start || !end) return 0
        const s = new Date(start)
        const e = new Date(end)
        let count = 0
        const current = new Date(s)
        while (current <= e) {
            const dow = current.getDay()
            if (dow !== 0 && dow !== 6) count++
            current.setDate(current.getDate() + 1)
        }
        return count
    }

    const businessDays = getBusinessDays(startDate, endDate)

    function handleOpenChange(open: boolean) {
        if (!open) {
            setStartDate("")
            setEndDate("")
            setReason("")
            setError(null)
        }
        onOpenChange(open)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!startDate || !endDate) return

        setLoading(true)
        setError(null)

        try {
            const res = await fetch("/api/calendar/vacations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    start_date: startDate,
                    end_date: endDate,
                    reason: reason.trim() || null,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Error al crear solicitud")

            onRequestCreated()
            handleOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error inesperado")
        } finally {
            setLoading(false)
        }
    }



    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Palmtree className="h-5 w-5 text-pink-600" />
                        Solicitar Vacaciones
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Info box */}
                    <div className="bg-pink-50 border border-pink-100 rounded-lg p-3 text-sm text-pink-800">
                        <p className="font-medium mb-1">¿Cómo funciona?</p>
                        <ol className="text-xs space-y-0.5 text-pink-700 list-decimal pl-4">
                            <li>Selecciona las fechas de tu periodo vacacional</li>
                            <li>Tu solicitud será revisada por un administrador</li>
                            <li>Si es aprobada, aparecerá en el calendario de todos</li>
                        </ol>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="vac-start">Fecha inicio *</Label>
                            <Input
                                id="vac-start"
                                type="date"
                                value={startDate}
                                onChange={e => {
                                    setStartDate(e.target.value)
                                    if (!endDate || e.target.value > endDate) setEndDate(e.target.value)
                                }}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="vac-end">Fecha fin *</Label>
                            <Input
                                id="vac-end"
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                min={startDate}
                                required
                            />
                        </div>
                    </div>

                    {/* Days preview */}
                    {businessDays > 0 && (
                        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                            <CalendarDays className="h-5 w-5 text-indigo-600 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-indigo-900">
                                    {businessDays} {businessDays === 1 ? "día hábil" : "días hábiles"}
                                </p>
                                <p className="text-[11px] text-indigo-600">
                                    No se cuentan fines de semana
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div className="space-y-1.5">
                        <Label htmlFor="vac-reason">Motivo (opcional)</Label>
                        <textarea
                            id="vac-reason"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Ej: Viaje familiar, descanso, etc."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background resize-none h-16 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !startDate || !endDate}
                            className="bg-pink-600 hover:bg-pink-700"
                        >
                            {loading ? "Enviando..." : "Solicitar Vacaciones"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
