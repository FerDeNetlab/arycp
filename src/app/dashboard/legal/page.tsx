"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LegalClientsList } from "@/components/legal/legal-clients-list"
import { useUserRole, isClientRole } from "@/hooks/use-user-role"

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

export default function LegalPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const { role, clientId, loading: roleLoading } = useUserRole()

  // Redirect client to their own data
  useEffect(() => {
    if (!roleLoading && isClientRole(role) && clientId) {
      router.replace(`/dashboard/legal/${clientId}`)
    }
  }, [roleLoading, role, clientId, router])

  useEffect(() => {
    if (!roleLoading && !isClientRole(role)) {
      fetchClients()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleLoading, role])

  async function fetchClients() {
    try {
      const response = await fetch("/api/legal/clients")
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
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
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
          <h1 className="text-2xl font-bold">Jurídico</h1>
          <p className="text-sm text-muted-foreground">Gestión de procesos legales y tramitología</p>
        </div>
      </div>

      {loading && <p className="text-center text-muted-foreground">Cargando clientes...</p>}
      {error && <p className="text-center text-destructive">{error}</p>}
      {!loading && !error && <LegalClientsList clients={clients} />}
    </div>
  )
}
