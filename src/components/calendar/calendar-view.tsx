"use client"

import { useState, useEffect, useCallback } from "react"
import { CalendarGrid, type CalendarEvent } from "./calendar-grid"
import CreateEventDialog from "./create-event-dialog"
import VacationRequestDialog from "./vacation-request-dialog"
import VacationManager from "./vacation-manager"
import EventsList from "./events-list"
import { Button } from "@/components/ui/button"
import {
    Plus,
    Palmtree,
    CalendarDays,
    List,
    LayoutGrid,
    ClipboardList,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarViewProps {
    userRole: string
    currentUserId: string
}

const EVENT_TYPE_FILTERS = [
    { value: "all", label: "Todos", color: "#6366f1" },
    { value: "manual", label: "General", color: "#6366f1" },
    { value: "meeting", label: "Reuniones", color: "#3b82f6" },
    { value: "vacation", label: "Vacaciones", color: "#ec4899" },
    { value: "fiscal", label: "Fiscal", color: "#f97316" },
    { value: "legal", label: "Jurídico", color: "#8b5cf6" },
    { value: "labor", label: "Laboral", color: "#10b981" },
    { value: "reminder", label: "Recordatorios", color: "#f59e0b" },
]

export default function CalendarView({ userRole, currentUserId }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [view, setView] = useState<"month" | "week">("month")
    const [showMode, setShowMode] = useState<"calendar" | "list">("calendar")
    const [typeFilter, setTypeFilter] = useState("all")
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showVacationDialog, setShowVacationDialog] = useState(false)
    const [showVacationManager, setShowVacationManager] = useState(false)
    const [pendingVacations, setPendingVacations] = useState(0)
    const [loading, setLoading] = useState(false)

    const isAdmin = userRole === "admin"
    const isClient = userRole === "cliente"

    // Calculate date range for fetching events
    function getDateRange() {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        if (view === "month") {
            // Include surrounding weeks
            const start = new Date(year, month - 1, 1)
            const end = new Date(year, month + 2, 0)
            return { start: start.toISOString(), end: end.toISOString() }
        } else {
            const dow = currentDate.getDay()
            const diff = dow === 0 ? 6 : dow - 1
            const weekStart = new Date(currentDate)
            weekStart.setDate(weekStart.getDate() - diff)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)
            weekEnd.setHours(23, 59, 59)
            return { start: weekStart.toISOString(), end: weekEnd.toISOString() }
        }
    }

    const loadEvents = useCallback(async () => {
        setLoading(true)
        try {
            const { start, end } = getDateRange()
            const params = new URLSearchParams({ start, end })
            if (typeFilter !== "all") params.set("type", typeFilter)

            const res = await fetch(`/api/calendar/events?${params.toString()}`)
            const data = await res.json()
            if (res.ok) setEvents(data.data || [])
        } catch (err) {
            console.error("Error loading events:", err)
        } finally {
            setLoading(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate, view, typeFilter])

    const loadPendingVacations = useCallback(async () => {
        if (!isAdmin) return
        try {
            const res = await fetch("/api/calendar/vacations?status=pending")
            const data = await res.json()
            if (res.ok) setPendingVacations((data.data || []).length)
        } catch (err) {
            console.error("Error checking vacations:", err)
        }
    }, [isAdmin])

    useEffect(() => {
        loadEvents()
    }, [loadEvents])

    useEffect(() => {
        loadPendingVacations()
    }, [loadPendingVacations])

    function handleDayClick(date: Date) {
        setSelectedDate(date)
    }

    function handleEventClick(event: CalendarEvent) {
        // For now, just select the day
        setSelectedDate(new Date(event.start_date))
    }

    async function handleDeleteEvent(id: string) {
        if (!confirm("¿Eliminar este evento?")) return
        try {
            await fetch("/api/calendar/events", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            })
            loadEvents()
        } catch (err) {
            console.error("Error deleting:", err)
        }
    }

    function handleEventCreated() {
        loadEvents()
    }

    function handleVacationUpdated() {
        loadEvents()
        loadPendingVacations()
    }

    // Events for the selected date (sidebar list)
    const selectedDayEvents = selectedDate
        ? events.filter(e => {
            const start = new Date(e.start_date)
            const end = new Date(e.end_date)
            const dayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
            const dayEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59)
            return start <= dayEnd && end >= dayStart
        })
        : events.slice(0, 10)

    return (
        <div className="space-y-4">
            {/* Top Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* View toggle */}
                    <div className="flex items-center bg-muted rounded-lg p-0.5">
                        <button
                            onClick={() => setView("month")}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                view === "month" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                            )}
                        >
                            Mes
                        </button>
                        <button
                            onClick={() => setView("week")}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                view === "week" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                            )}
                        >
                            Semana
                        </button>
                    </div>

                    {/* Display mode */}
                    <div className="flex items-center bg-muted rounded-lg p-0.5">
                        <button
                            onClick={() => setShowMode("calendar")}
                            className={cn(
                                "p-1.5 rounded-md transition-colors",
                                showMode === "calendar" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                            )}
                            title="Vista calendario"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setShowMode("list")}
                            className={cn(
                                "p-1.5 rounded-md transition-colors",
                                showMode === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                            )}
                            title="Vista lista"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {!isClient && (
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Vacation manager */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVacationManager(true)}
                        className="relative text-xs"
                    >
                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                        {isAdmin ? "Gestionar" : "Mis"} Vacaciones
                        {isAdmin && pendingVacations > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                                {pendingVacations}
                            </span>
                        )}
                    </Button>

                    {/* Request vacation */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVacationDialog(true)}
                        className="text-xs text-pink-700 border-pink-200 hover:bg-pink-50"
                    >
                        <Palmtree className="h-3.5 w-3.5 mr-1.5" />
                        Solicitar Vacaciones
                    </Button>

                    {/* New event */}
                    <Button
                        size="sm"
                        onClick={() => setShowCreateDialog(true)}
                        className="text-xs"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Nuevo Evento
                    </Button>
                </div>
                )}
            </div>

            {/* Type Filters — hide vacation/internal filters for clients */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {EVENT_TYPE_FILTERS
                .filter(f => !isClient || !["vacation", "labor"].includes(f.value))
                .map(f => (
                    <button
                        key={f.value}
                        onClick={() => setTypeFilter(f.value)}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors shrink-0",
                            typeFilter === f.value
                                ? "text-white shadow-sm"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                        style={typeFilter === f.value ? { backgroundColor: f.color } : undefined}
                    >
                        {f.value !== "all" && (
                            <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: typeFilter === f.value ? "white" : f.color }}
                            />
                        )}
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            {loading && events.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
                </div>
            ) : showMode === "calendar" ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                    {/* Calendar Grid */}
                    <CalendarGrid
                        currentDate={currentDate}
                        events={events}
                        onDateChange={setCurrentDate}
                        onDayClick={handleDayClick}
                        onEventClick={handleEventClick}
                        view={view}
                    />

                    {/* Sidebar — Day events */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="px-4 py-3 border-b border-border bg-muted/30">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-indigo-600" />
                                {selectedDate
                                    ? selectedDate.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })
                                    : "Próximos eventos"
                                }
                            </h3>
                        </div>
                        <div className="p-3 max-h-[500px] overflow-y-auto">
                            <EventsList
                                events={selectedDayEvents}
                                selectedDate={selectedDate}
                                onDelete={handleDeleteEvent}
                                currentUserId={currentUserId}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                /* List mode */
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                        <h3 className="text-sm font-semibold">
                            Todos los eventos
                        </h3>
                    </div>
                    <div className="p-3">
                        <EventsList
                            events={events}
                            selectedDate={null}
                            onDelete={handleDeleteEvent}
                            currentUserId={currentUserId}
                        />
                    </div>
                </div>
            )}

            {/* Dialogs */}
            <CreateEventDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onEventCreated={handleEventCreated}
                defaultDate={selectedDate || undefined}
            />

            <VacationRequestDialog
                open={showVacationDialog}
                onOpenChange={setShowVacationDialog}
                onRequestCreated={handleVacationUpdated}
            />

            <VacationManager
                open={showVacationManager}
                onOpenChange={setShowVacationManager}
                isAdmin={isAdmin}
                onUpdated={handleVacationUpdated}
            />
        </div>
    )
}
