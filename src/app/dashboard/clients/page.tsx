import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ClientsSimpleList } from "@/components/clients/clients-simple-list"
import { AddClientSimpleDialog } from "@/components/clients/add-client-simple-dialog"

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: clients } = await supabase
    .from("clients")
    .select(`
      *,
      client_assignments (
        system_users (
          id,
          full_name,
          email
        )
      )
    `)
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
                <p className="text-sm text-muted-foreground">Administra los datos de tus clientes</p>
              </div>
            </div>
            <AddClientSimpleDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Cliente
              </Button>
            </AddClientSimpleDialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <ClientsSimpleList clients={clients || []} />
      </main>
    </div>
  )
}
