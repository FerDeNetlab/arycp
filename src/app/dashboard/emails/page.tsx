import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { EmailTemplatesList } from "@/components/emails/email-templates-list"

export default async function EmailsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Sistema de Correos</h1>
          <p className="text-sm text-muted-foreground">Gestiona plantillas y envía mensajes</p>
        </div>
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
    </div>
  )
}
