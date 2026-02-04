import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AccountingList } from "@/components/accounting/accounting-list"

// Los clientes ahora se crean solo desde el módulo de Clientes
// y se asignan automáticamente según los servicios contratados

export default async function AccountingPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", data.user.id)
    .eq("has_accounting", true)
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
                <h1 className="text-2xl font-bold">Contabilidad</h1>
                <p className="text-sm text-muted-foreground">Administra la contabilidad de todos tus clientes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <AccountingList clients={clients || []} />
      </main>
    </div>
  )
}
