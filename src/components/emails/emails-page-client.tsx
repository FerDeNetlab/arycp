"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Send, History } from "lucide-react"
import { EmailTemplatesList } from "@/components/emails/email-templates-list"
import { SendEmailDialog } from "@/components/emails/send-email-dialog"

export function EmailsPageClient() {
  const [showSendDialog, setShowSendDialog] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#065F46] flex items-center justify-center">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sistema de Correos</h1>
            <p className="text-sm text-muted-foreground">Gestiona plantillas y envía mensajes a tus clientes</p>
          </div>
        </div>
        <Button
          onClick={() => setShowSendDialog(true)}
          className="bg-gradient-to-r from-[#1E3A8A] to-[#065F46] hover:opacity-90"
        >
          <Send className="h-4 w-4 mr-2" />
          Nuevo Correo
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Plantillas de Correo</CardTitle>
          </CardHeader>
          <CardContent>
            <EmailTemplatesList />
          </CardContent>
        </Card>
      </div>

      <SendEmailDialog
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
      />
    </>
  )
}
