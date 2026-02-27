"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ClientsSimpleList } from "@/components/clients/clients-simple-list"
import { AddClientSimpleDialog } from "@/components/clients/add-client-simple-dialog"

type Client = {
  id: string
  name: string
  email: string
  phone: string | null
  status: string
  has_accounting: boolean
  has_fiscal: boolean
  has_legal: boolean
  has_labor: boolean
  created_at: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchClients()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchClients() {
    try {
      const response = await fetch("/api/clients/list")
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
            <p className="text-sm text-muted-foreground">Administra los datos de tus clientes</p>
          </div>
        </div>
        <AddClientSimpleDialog onClientCreated={fetchClients}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Añadir Cliente
          </Button>
        </AddClientSimpleDialog>
      </div>

      {loading && <p className="text-center text-muted-foreground">Cargando clientes...</p>}
      {error && <p className="text-center text-destructive">{error}</p>}
      {!loading && !error && <ClientsSimpleList clients={clients} />}
    </div>
  )
}
