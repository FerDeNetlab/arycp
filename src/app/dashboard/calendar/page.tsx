import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/auth/get-user-role"
import CalendarView from "@/components/calendar/calendar-view"

export default async function CalendarPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const userData = await getUserRole(user.id)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <p className="text-sm text-muted-foreground">Gestión de eventos, reuniones y vacaciones</p>
      </div>

      <CalendarView userRole={userData.role} currentUserId={user.id} />
    </div>
  )
}
