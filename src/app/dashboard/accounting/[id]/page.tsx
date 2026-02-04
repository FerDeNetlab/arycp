import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ClientHeader } from "@/components/accounting/client-header"
import { DocumentsSection } from "@/components/accounting/documents-section"
import { AccountingSection } from "@/components/accounting/accounting-section"
import { FiscalSection } from "@/components/accounting/fiscal-section"

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("user_id", data.user.id)
    .single()

  if (clientError || !client) {
    redirect("/dashboard/accounting")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/accounting">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <ClientHeader client={client} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Sección de Documentos (siempre visible) */}
        <DocumentsSection clientId={client.id} />

        {/* Sección de Contabilidad */}
        {client.has_accounting && <AccountingSection clientId={client.id} />}

        {/* Sección Fiscal */}
        {client.has_fiscal && <FiscalSection clientId={client.id} clientData={client} />}
      </main>
    </div>
  )
}
