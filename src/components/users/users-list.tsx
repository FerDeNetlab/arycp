"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserCircle, Mail, Phone, Edit, Trash2 } from "lucide-react"
import { EditUserDialog } from "./edit-user-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SystemUser {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
  is_active: boolean
  created_at: string
}

export function UsersList({ users }: { users: SystemUser[] }) {
  const router = useRouter()

  async function handleDelete(userId: string) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return

    const supabase = createClient()
    await supabase.from("system_users").delete().eq("id", userId)
    router.refresh()
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay usuarios aún</h3>
        <p className="text-muted-foreground">Comienza añadiendo tu primer usuario del sistema</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {users.map((user) => (
        <Card key={user.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{user.full_name}</h3>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <EditUserDialog user={user}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </EditUserDialog>
                <Button variant="outline" size="sm" onClick={() => handleDelete(user.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
