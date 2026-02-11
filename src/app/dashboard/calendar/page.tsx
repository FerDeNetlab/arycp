import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CalendarView from "@/components/calendar/calendar-view"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
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

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario"

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-background to-rose-100/50">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard" className="flex items-center gap-3">
              <div style={{ height: '48px', width: '64px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <Image src="/images/arycp-logo.jpg" alt="ARYCP Logo" width={200} height={200} style={{ position: 'absolute', top: '-3px', left: '50%', transform: 'translateX(-50%)', width: '180%', height: 'auto', mixBlendMode: 'multiply' }} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">AR&CP</span>
                <span className="text-xs text-muted-foreground -mt-1">Calendario</span>
              </div>
            </Link>
            <div className="ml-4 pl-4 border-l border-border">
              <p className="text-sm text-muted-foreground">Bienvenido, {userName}</p>
            </div>
          </div>
          <form action="/auth/logout" method="post">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cerrar Sesión
            </button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <CalendarView isConnected={isConnected} clients={clients || []} processes={processes || []} />
      </main>
    </div>
  )
}
