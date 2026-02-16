import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CalendarView from "@/components/calendar/calendar-view"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function CalendarPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Verificar si el usuario tiene Google Calendar conectado
  const { data: tokenData } = await supabase.from("google_calendar_tokens").select("*").eq("user_id", user.id).single()

  const isConnected = !!tokenData

  // Obtener clientes y procesos para vincular eventos
  const { data: clients } = await supabase.from("clients").select("*").eq("user_id", user.id).order("name")

  const { data: processes } = await supabase
    .from("processes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Calendario</h1>
          <p className="text-sm text-muted-foreground">Gestión de eventos y recordatorios</p>
        </div>
      </div>

      <CalendarView isConnected={isConnected} clients={clients || []} processes={processes || []} />
    </div>
  )
}
