"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface CalendarEvent {
    id: string
    title: string
    description?: string
    start_date: string
    end_date: string
    all_day: boolean
    event_type: string
    color: string
    visibility: string
    user_name?: string
    client_name?: string
    vacation_request_id?: string
}

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const MONTHS_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

interface CalendarGridProps {
    currentDate: Date
    events: CalendarEvent[]
    onDateChange: (date: Date) => void
    onDayClick: (date: Date) => void
    onEventClick: (event: CalendarEvent) => void
    view: "month" | "week"
}

function getMonthDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: { date: Date; isCurrentMonth: boolean }[] = []

    // Fill previous month days
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6 // Sunday -> 6
    for (let i = startDow - 1; i >= 0; i--) {
        const d = new Date(year, month, -i)
        days.push({ date: d, isCurrentMonth: false })
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push({ date: new Date(year, month, d), isCurrentMonth: true })
    }

    // Fill next month days to complete grid
    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
        days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false })
    }

    return days
}

function getWeekDays(referenceDate: Date) {
    const date = new Date(referenceDate)
    const dow = date.getDay()
    const diff = dow === 0 ? 6 : dow - 1 // Adjust for Monday start
    date.setDate(date.getDate() - diff)

    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
        days.push(new Date(date))
        date.setDate(date.getDate() + 1)
    }
    return days
}

function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
}

function isToday(d: Date) {
    return isSameDay(d, new Date())
}

// Prevent UTC offset: "2025-03-24" → interpreted as UTC midnight → shows previous day in MX
function parseDate(d: string) {
    if (d.length === 10) return new Date(d + "T12:00:00")
    return new Date(d)
}

function eventOnDay(event: CalendarEvent, day: Date) {
    const start = parseDate(event.start_date)
    const end = parseDate(event.end_date)
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59)
    return start <= dayEnd && end >= dayStart
}

export function CalendarGrid({ currentDate, events, onDateChange, onDayClick, onEventClick, view }: CalendarGridProps) {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const monthDays = useMemo(() => getMonthDays(year, month), [year, month])
    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])

    function navigatePrev() {
        if (view === "month") {
            onDateChange(new Date(year, month - 1, 1))
        } else {
            const d = new Date(currentDate)
            d.setDate(d.getDate() - 7)
            onDateChange(d)
        }
    }

    function navigateNext() {
        if (view === "month") {
            onDateChange(new Date(year, month + 1, 1))
        } else {
            const d = new Date(currentDate)
            d.setDate(d.getDate() + 7)
            onDateChange(d)
        }
    }

    function goToday() {
        onDateChange(new Date())
    }

    function getEventsForDay(day: Date) {
        return events.filter(e => eventOnDay(e, day))
    }

    const title = view === "month"
        ? `${MONTHS_ES[month]} ${year}`
        : (() => {
            const wds = getWeekDays(currentDate)
            const s = wds[0]
            const e = wds[6]
            if (s.getMonth() === e.getMonth()) {
                return `${s.getDate()} - ${e.getDate()} ${MONTHS_ES[s.getMonth()]} ${s.getFullYear()}`
            }
            return `${s.getDate()} ${MONTHS_ES[s.getMonth()].slice(0, 3)} - ${e.getDate()} ${MONTHS_ES[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`
        })()

    const renderDay = (day: Date, isCurrentMonth: boolean = true) => {
        const dayEvents = getEventsForDay(day)
        const isWeekend = day.getDay() === 0 || day.getDay() === 6

        return (
            <div
                key={day.toISOString()}
                onClick={() => onDayClick(day)}
                className={cn(
                    "min-h-[100px] border border-border/50 p-1 cursor-pointer transition-colors hover:bg-accent/30",
                    !isCurrentMonth && "bg-muted/20",
                    isWeekend && isCurrentMonth && "bg-muted/10",
                    isToday(day) && "bg-indigo-50/50 border-indigo-200"
                )}
            >
                <div className={cn(
                    "text-xs font-medium mb-1 flex items-center justify-center w-6 h-6 rounded-full",
                    isToday(day) && "bg-indigo-600 text-white",
                    !isCurrentMonth && "text-muted-foreground/40",
                    isCurrentMonth && !isToday(day) && "text-foreground"
                )}>
                    {day.getDate()}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, view === "week" ? 6 : 3).map(event => (
                        <button
                            key={event.id}
                            onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                            className={cn(
                                "w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded truncate font-medium transition-opacity hover:opacity-80",
                                event.event_type === "vacation" && "italic"
                            )}
                            style={{
                                backgroundColor: event.color + "20",
                                color: event.color,
                                borderLeft: `2px solid ${event.color}`,
                            }}
                            title={event.title}
                        >
                            {event.title}
                        </button>
                    ))}
                    {dayEvents.length > (view === "week" ? 6 : 3) && (
                        <div className="text-[10px] text-muted-foreground pl-1">
                            +{dayEvents.length - (view === "week" ? 6 : 3)} más
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-border">
                <div className="flex items-center gap-2">
                    <button onClick={navigatePrev} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors">
                        <ChevronLeft className="h-4 w-4 text-indigo-700" />
                    </button>
                    <button onClick={navigateNext} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors">
                        <ChevronRight className="h-4 w-4 text-indigo-700" />
                    </button>
                    <h2 className="text-lg font-bold text-indigo-900 ml-2">{title}</h2>
                </div>
                <button
                    onClick={goToday}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-white rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                    Hoy
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border">
                {DAYS_ES.map(day => (
                    <div key={day} className="text-center text-[11px] font-semibold text-muted-foreground py-2 border-r border-border/50 last:border-r-0">
                        {day}
                    </div>
                ))}
            </div>

            {/* Month view */}
            {view === "month" && (
                <div className="grid grid-cols-7">
                    {monthDays.map(({ date, isCurrentMonth }) => renderDay(date, isCurrentMonth))}
                </div>
            )}

            {/* Week view */}
            {view === "week" && (
                <div className="grid grid-cols-7">
                    {weekDays.map(day => renderDay(day, true))}
                </div>
            )}
        </div>
    )
}
