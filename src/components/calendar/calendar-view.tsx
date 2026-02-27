"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import GoogleConnectButton from "./google-connect-button"
import EventsList from "./events-list"
import CreateEventDialog from "./create-event-dialog"

interface Client {
  id: string
  name: string
  email?: string
  company?: string
}

interface Process {
  id: string
  title: string
  type?: string
  status?: string
}

interface CalendarViewProps {
  isConnected: boolean
  clients: Client[]
  processes: Process[]
}

export default function CalendarView({ isConnected, clients, processes }: CalendarViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events] = useState<any[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleEventCreated = () => {
    setShowCreateDialog(false)
    alert("El evento se creará en Google Calendar cuando publiques el sitio.")
  }

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              Calendario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Para usar el calendario, primero debes conectar tu cuenta de Google Calendar.
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Conecta tu cuenta de Google para sincronizar eventos, crear recordatorios y gestionar tu agenda.
              </p>
              <GoogleConnectButton />
            </div>

            <div className="bg-muted/50 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold">Funcionalidades disponibles:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Crear y editar eventos en tu Google Calendar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Vincular eventos con clientes y procesos del ERP</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Notificaciones y recordatorios automáticos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Vista de equipo para coordinar actividades</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendario</h1>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Crear Evento
        </Button>
      </div>

      <EventsList events={events} loading={false} />

      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onEventCreated={handleEventCreated}
        clients={clients}
        processes={processes}
      />
    </div>
  )
}
