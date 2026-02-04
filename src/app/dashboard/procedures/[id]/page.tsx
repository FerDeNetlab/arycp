import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Building2 } from "lucide-react"
import Link from "next/link"
import { ProceduresSection } from "@/components/procedures/procedures-section"

export default async function ClientProceduresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()

  if (clientError || !client) {
    redirect("/dashboard/procedures")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-background to-teal-50">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/procedures">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Tramitología</h1>
                <p className="text-sm text-muted-foreground">{client.business_name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Info del Cliente */}
        <Card className="border-2 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-cyan-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg">{client.business_name}</h2>
                <p className="text-sm text-muted-foreground">RFC: {client.rfc}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Trámites */}
        <ProceduresSection clientId={id} clientName={client.business_name} />
      </main>
    </div>
  )
}
