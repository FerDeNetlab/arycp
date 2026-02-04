"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, MapPin, FileText } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Event {
  id?: string
  summary?: string
  description?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  location?: string
}

interface EventsListProps {
  events: Event[]
  loading: boolean
}

export default function EventsList({ events, loading }: EventsListProps) {
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay eventos próximos</p>
          <p className="text-sm mt-2">Crea tu primer evento para comenzar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => {
        const startDate = event.start?.dateTime || event.start?.date
        const formattedDate = startDate
          ? new Date(startDate).toLocaleDateString("es-MX", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : ""
        const formattedTime = event.start?.dateTime
          ? new Date(event.start.dateTime).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : ""

        return (
          <Card key={event.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-base line-clamp-2">{event.summary || "Sin título"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">{formattedDate}</span>
              </div>
              {formattedTime && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">{formattedTime}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground line-clamp-1">{event.location}</span>
                </div>
              )}
              {event.description && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground line-clamp-2">{event.description}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
