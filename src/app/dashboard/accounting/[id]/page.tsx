"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ClientHeader } from "@/components/accounting/client-header"
import { DocumentsSection } from "@/components/accounting/documents-section"
import { AccountingSection } from "@/components/accounting/accounting-section"
import { FiscalSection } from "@/components/accounting/fiscal-section"
import { useUserRole } from "@/hooks/use-user-role"

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  status: string
  has_accounting: boolean
  has_fiscal: boolean
  has_legal: boolean
  has_labor: boolean
  created_at: string
}

export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const [clientId, setClientId] = useState<string | null>(null)
  const { role } = useUserRole()

  useEffect(() => {
    params.then((p) => setClientId(p.id))
  }, [params])

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId])

  async function fetchClient() {
    if (!clientId) return

    try {
      const response = await fetch(`/api/clients/${clientId}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/login")
          return
        }
        if (response.status === 404 || response.status === 403) {
          router.push("/dashboard/accounting")
          return
        }
        setError(data.error || "Error al cargar cliente")
        setLoading(false)
        return
      }

      setClient(data.client)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching client:", err)
      setError("Error de conexión")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando cliente...</p>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-destructive">{error || "Cliente no encontrado"}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={role === "cliente" ? "/dashboard" : "/dashboard/accounting"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <ClientHeader client={client} />
      </div>

      <div className="space-y-6">
        {/* Sección de Documentos (siempre visible) */}
        <DocumentsSection clientId={client.id} userRole={role} />

        {/* Sección de Contabilidad */}
        {client.has_accounting && <AccountingSection clientId={client.id} userRole={role} />}

        {/* Sección Fiscal */}
        {client.has_fiscal && <FiscalSection clientId={client.id} clientData={client} userRole={role} />}
      </div>
    </div>
  )
}
