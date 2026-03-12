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
import { CalendarPlus, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateEventDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onEventCreated: () => void
    defaultDate?: Date
}

const EVENT_TYPES = [
    { value: "manual", label: "General", color: "#6366f1", icon: "📌" },
    { value: "meeting", label: "Reunión", color: "#3b82f6", icon: "🤝" },
    { value: "reminder", label: "Recordatorio", color: "#f59e0b", icon: "⏰" },
    { value: "fiscal", label: "Fiscal", color: "#f97316", icon: "📊" },
    { value: "legal", label: "Jurídico", color: "#8b5cf6", icon: "⚖️" },
    { value: "labor", label: "Laboral", color: "#10b981", icon: "💼" },
]

const PRESET_COLORS = [
    "#6366f1", "#3b82f6", "#06b6d4", "#10b981",
    "#f59e0b", "#f97316", "#ef4444", "#ec4899",
    "#8b5cf6", "#64748b",
]

export default function CreateEventDialog({ open, onOpenChange, onEventCreated, defaultDate }: CreateEventDialogProps) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [allDay, setAllDay] = useState(true)
    const [eventType, setEventType] = useState("manual")
    const [color, setColor] = useState("#6366f1")
    const [visibility, setVisibility] = useState("team")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Set defaults when dialog opens
    function handleOpenChange(open: boolean) {
        if (open && defaultDate) {
            const dateStr = defaultDate.toISOString().split("T")[0]
            setStartDate(dateStr)
            setEndDate(dateStr)
        }
        if (!open) {
            setTitle("")
            setDescription("")
            setStartDate("")
            setEndDate("")
            setAllDay(true)
            setEventType("manual")
            setColor("#6366f1")
            setVisibility("team")
            setError(null)
        }
        onOpenChange(open)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim() || !startDate || !endDate) return

        setLoading(true)
        setError(null)

        try {
            const start = allDay
                ? new Date(startDate + "T00:00:00").toISOString()
                : new Date(startDate).toISOString()
            const end = allDay
                ? new Date(endDate + "T23:59:59").toISOString()
                : new Date(endDate).toISOString()

            const res = await fetch("/api/calendar/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || null,
                    start_date: start,
                    end_date: end,
                    all_day: allDay,
                    event_type: eventType,
                    color,
                    visibility,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Error al crear evento")
            }

            onEventCreated()
            handleOpenChange(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error inesperado")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarPlus className="h-5 w-5 text-indigo-600" />
                        Nuevo Evento
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label htmlFor="event-title">Título *</Label>
                        <Input
                            id="event-title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ej: Reunión con cliente"
                            required
                        />
                    </div>

                    {/* Event Type */}
                    <div className="space-y-1.5">
                        <Label>Tipo de evento</Label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {EVENT_TYPES.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => { setEventType(type.value); setColor(type.color) }}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium border transition-all",
                                        eventType === type.value
                                            ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                                            : "border-border hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    <span>{type.icon}</span>
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="event-start">
                                {allDay ? "Fecha inicio" : "Inicio"} *
                            </Label>
                            <Input
                                id="event-start"
                                type={allDay ? "date" : "datetime-local"}
                                value={startDate}
                                onChange={e => {
                                    setStartDate(e.target.value)
                                    if (!endDate || e.target.value > endDate) setEndDate(e.target.value)
                                }}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="event-end">
                                {allDay ? "Fecha fin" : "Fin"} *
                            </Label>
                            <Input
                                id="event-end"
                                type={allDay ? "date" : "datetime-local"}
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                min={startDate}
                                required
                            />
                        </div>
                    </div>

                    {/* All day toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={allDay}
                            onChange={e => setAllDay(e.target.checked)}
                            className="rounded border-border"
                        />
                        <span className="text-sm text-muted-foreground">Todo el día</span>
                    </label>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="event-desc">Descripción</Label>
                        <textarea
                            id="event-desc"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Notas adicionales..."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background resize-none h-20 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    {/* Color picker */}
                    <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5">
                            <Palette className="h-3.5 w-3.5" />
                            Color
                        </Label>
                        <div className="flex items-center gap-1.5">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={cn(
                                        "h-6 w-6 rounded-full transition-all",
                                        color === c ? "ring-2 ring-offset-2 ring-indigo-400 scale-110" : "hover:scale-105"
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Visibility */}
                    <div className="flex items-center gap-3">
                        <Label className="text-sm">Visible para:</Label>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setVisibility("team")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                    visibility === "team"
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                Todo el equipo
                            </button>
                            <button
                                type="button"
                                onClick={() => setVisibility("personal")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                    visibility === "personal"
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                Solo yo
                            </button>
                        </div>
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
                        <Button type="submit" disabled={loading || !title.trim()}>
                            {loading ? "Creando..." : "Crear Evento"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
