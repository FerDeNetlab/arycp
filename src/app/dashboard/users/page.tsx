"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { UsersList } from "@/components/users/users-list"
import { AddUserDialog } from "@/components/users/add-user-dialog"

type SystemUser = {
  id: string
  auth_user_id: string
  full_name: string
  email: string
  phone: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const response = await fetch("/api/users/list")
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/login")
          return
        }
        setError(data.error || "Error al cargar usuarios")
        setLoading(false)
        return
      }

      setUsers(data.users || [])
      setLoading(false)
    } catch (err) {
      console.error("Error fetching users:", err)
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
            <h1 className="text-2xl font-bold">Usuarios del Sistema</h1>
            <p className="text-sm text-muted-foreground">Administra los usuarios que acceden al sistema</p>
          </div>
        </div>
        <AddUserDialog onUserCreated={fetchUsers}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Añadir Usuario
          </Button>
        </AddUserDialog>
      </div>

      {loading && <p className="text-center text-muted-foreground">Cargando usuarios...</p>}
      {error && <p className="text-center text-destructive">{error}</p>}
      {!loading && !error && <UsersList users={users} />}
    </div>
  )
}
