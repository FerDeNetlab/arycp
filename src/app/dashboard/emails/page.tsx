import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { EmailTemplatesList } from "@/components/emails/email-templates-list"

export default async function EmailsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-background to-blue-100/50">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image src="/images/arycp-logo.jpg" alt="ARYCP Logo" width={40} height={40} className="h-10 w-10" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">AR&CP</span>
                <span className="text-xs text-muted-foreground -mt-1">Sistema de Correos</span>
              </div>
            </Link>
          </div>
          <Link href="/dashboard">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Volver al Dashboard
            </button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Sistema de Correos</h1>
          </div>
          <p className="text-muted-foreground">Gestiona plantillas de correo y envía mensajes a tus clientes</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Correo</CardTitle>
            </CardHeader>
            <CardContent>
              <EmailTemplatesList />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
