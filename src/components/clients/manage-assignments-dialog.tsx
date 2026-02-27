"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface SystemUser {
  id: string
  full_name: string
  email: string
  role: string
}

interface Client {
  id: string
  name: string
  client_assignments?: Array<{
    system_users: {
      id: string
    }
  }>
}

export function ManageAssignmentsDialog({ client, children }: { client: Client; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<SystemUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    if (open) {
      loadUsers()
      loadAssignments()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function loadUsers() {
    try {
      const res = await fetch("/api/users/list")
      if (res.ok) {
        const data = await res.json()
        if (data.users) {
          // Filter to only active, non-client users
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setUsers(data.users.filter((u: any) => u.is_active !== false && u.role !== "cliente"))
        }
      }
    } catch (err) {
      console.error("Error loading users:", err)
    }
  }

  async function loadAssignments() {
    if (client.client_assignments) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assigned = new Set(client.client_assignments.map((a: any) => a.system_users.id))
      setSelectedUsers(assigned)
    }
  }

  async function handleSave() {
    setLoading(true)

    try {
      const response = await fetch("/api/clients/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: client.id,
          user_ids: Array.from(selectedUsers),
        }),
      })

      if (response.ok) {
        setOpen(false)
        router.refresh()
        window.location.reload()
      }
    } catch (err) {
      console.error("Error saving assignments:", err)
    } finally {
      setLoading(false)
    }
  }

  function toggleUser(userId: string) {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Responsables</DialogTitle>
          <DialogDescription>Selecciona los usuarios que atenderán a {client.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay usuarios del sistema. Crea usuarios en la sección de Usuarios.
            </p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent">
                <Checkbox
                  id={user.id}
                  checked={selectedUsers.has(user.id)}
                  onCheckedChange={() => toggleUser(user.id)}
                />
                <label htmlFor={user.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{user.full_name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </label>
                <Badge variant="outline">{user.role}</Badge>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
