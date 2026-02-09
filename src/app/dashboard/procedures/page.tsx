"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ProceduresClientList } from "@/components/procedures/procedures-client-list"
import { useUserRole, isClientRole } from "@/hooks/use-user-role"

type Client = {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  status: string
  has_accounting: boolean
  has_fiscal: boolean
  has_legal: boolean
  has_labor: boolean
  created_at: string
}

export default function ProceduresPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const { role, clientId, loading: roleLoading } = useUserRole()

  // Redirect client to their own tracking page
  useEffect(() => {
    if (!roleLoading && isClientRole(role) && clientId) {
      router.replace(`/dashboard/procedures/${clientId}`)
    }
  }, [roleLoading, role, clientId, router])

  useEffect(() => {
    if (!roleLoading && !isClientRole(role)) {
      fetchClients()
    }
  }, [roleLoading, role])

  async function fetchClients() {
    try {
      const response = await fetch("/api/procedures/clients")
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/login")
          return
        }
        setError(data.error || "Error al cargar clientes")
        setLoading(false)
        return
      }

      setClients(data.clients || [])
      setLoading(false)
    } catch (err) {
      console.error("Error fetching clients:", err)
      setError("Error de conexión")
      setLoading(false)
    }
  }

  if (roleLoading || isClientRole(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-background to-teal-100/50">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Tramitología</h1>
              <p className="text-sm text-muted-foreground">Gestión de trámites y documentos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {loading && <p className="text-center text-muted-foreground">Cargando clientes...</p>}
        {error && <p className="text-center text-destructive">{error}</p>}
        {!loading && !error && <ProceduresClientList clients={clients} />}
      </main>
    </div>
  )
}
