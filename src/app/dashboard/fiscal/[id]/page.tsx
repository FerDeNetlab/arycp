import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { FiscalFullSection } from "@/components/fiscal/fiscal-full-section"
import { ClientHeader } from "@/components/accounting/client-header"

export default async function FiscalClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData?.user) {
    redirect("/auth/login")
  }

  // Obtener datos del cliente
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single()

  if (clientError || !client) {
    redirect("/dashboard/fiscal")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-secondary/5">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/fiscal">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-orange-700">Fiscal - {client.name}</h1>
              <p className="text-sm text-muted-foreground">{client.company || "Sin empresa asignada"}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        <ClientHeader client={client} />
        <FiscalFullSection clientId={client.id} clientName={client.name} clientEmail={client.email} />
      </main>
    </div>
  )
}
