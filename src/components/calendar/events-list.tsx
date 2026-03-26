"use client"

import { CalendarDays, Clock, MapPin, Trash2, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "./calendar-grid"

interface EventsListProps {
    events: CalendarEvent[]
    selectedDate: Date | null
    onDelete?: (id: string) => void
    currentUserId?: string
}

// Prevent UTC offset: "2025-03-24" → interpreted as UTC midnight → shows previous day in MX
function parseDate(d: string) {
    if (d.length === 10) return new Date(d + "T12:00:00") // date-only string
    return new Date(d)
}

function formatEventTime(event: CalendarEvent) {
    if (event.all_day) return "Todo el día"
    const start = parseDate(event.start_date)
    const end = parseDate(event.end_date)
    return `${start.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} — ${end.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`
}

function formatDateRange(event: CalendarEvent) {
    const start = parseDate(event.start_date)
    const end = parseDate(event.end_date)
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
    return `${start.toLocaleDateString("es-MX", opts)} — ${end.toLocaleDateString("es-MX", opts)}`
}

const TYPE_LABELS: Record<string, string> = {
    manual: "General",
    meeting: "Reunión",
    reminder: "Recordatorio",
    fiscal: "Fiscal",
    legal: "Jurídico",
    labor: "Laboral",
    vacation: "Vacaciones",
}

export default function EventsList({ events, selectedDate, onDelete, currentUserId }: EventsListProps) {
    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                    {selectedDate
                        ? "No hay eventos para esta fecha"
                        : "No hay eventos próximos"
                    }
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {events.map(event => (
                <div
                    key={event.id}
                    className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border transition-colors hover:bg-accent/30",
                        event.event_type === "vacation" && "border-pink-200/60 bg-pink-50/20"
                    )}
                    style={{ borderLeftWidth: 3, borderLeftColor: event.color }}
                >
                    {/* Color dot */}
                    <div
                        className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: event.color }}
                    />

                    <div className="flex-1 min-w-0">
                        <p className={cn(
                            "text-sm font-semibold text-foreground",
                            event.event_type === "vacation" && "text-pink-800"
                        )}>
                            {event.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatEventTime(event)}
                            </span>
                            {!event.all_day && (
                                <span className="text-[11px] text-muted-foreground">
                                    {formatDateRange(event)}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                                style={{ backgroundColor: event.color + "20", color: event.color }}
                            >
                                {TYPE_LABELS[event.event_type] || event.event_type}
                            </span>
                            {event.user_name && (
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    {event.user_name}
                                </span>
                            )}
                            {event.client_name && (
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {event.client_name}
                                </span>
                            )}
                        </div>

                        {event.description && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                                {event.description}
                            </p>
                        )}
                    </div>

                    {/* Delete button (only for own non-vacation events) */}
                    {onDelete && currentUserId && event.event_type !== "vacation" && (
                        <button
                            onClick={() => onDelete(event.id)}
                            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                            title="Eliminar evento"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    )
}
