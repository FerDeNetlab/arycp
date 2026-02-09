"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Building2 } from "lucide-react"
import Link from "next/link"
import { ProceduresSection } from "@/components/procedures/procedures-section"
import { useUserRole } from "@/hooks/use-user-role"

type Client = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  business_name?: string
  rfc?: string
  status: string
  has_accounting: boolean
  has_fiscal: boolean
  has_legal: boolean
  has_labor: boolean
  created_at: string
}

export default function ClientProceduresPage({ params }: { params: Promise<{ id: string }> }) {
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
          router.push("/dashboard/procedures")
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando cliente...</p>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">{error || "Cliente no encontrado"}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-background to-teal-100/50">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href={role === "cliente" ? "/dashboard" : "/dashboard/procedures"}>
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
                <p className="text-sm text-muted-foreground">{client.business_name || client.name}</p>
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
                <h2 className="font-semibold text-lg">{client.business_name || client.name}</h2>
                <p className="text-sm text-muted-foreground">RFC: {client.rfc || "No disponible"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Trámites */}
        <ProceduresSection clientId={client.id} clientName={client.business_name || client.name} userRole={role} />
      </main>
    </div>
  )
}

