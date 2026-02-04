"use client"

import type React from "react"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

interface SystemUser {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
  is_active: boolean
  module_permissions?: {
    accounting: boolean
    clients: boolean
    users: boolean
  }
}

export function EditUserDialog({ user, children }: { user: SystemUser; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState(user.role)
  const [permissions, setPermissions] = useState({
    accounting: user.module_permissions?.accounting ?? true,
    clients: user.module_permissions?.clients ?? true,
    users: user.module_permissions?.users ?? false,
  })
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase
      .from("system_users")
      .update({
        full_name: formData.get("full_name") as string,
        email: formData.get("email") as string,
        phone: (formData.get("phone") as string) || null,
        role: role,
        is_active: formData.get("is_active") === "on",
        module_permissions: permissions,
      })
      .eq("id", user.id)

    setLoading(false)

    if (!error) {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>Modifica la información del usuario y sus permisos de acceso</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input id="full_name" name="full_name" defaultValue={user.full_name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input id="email" name="email" type="email" defaultValue={user.email} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={user.phone || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="contador">Contador</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="is_active" name="is_active" defaultChecked={user.is_active} />
            <label htmlFor="is_active" className="text-sm cursor-pointer">
              Usuario activo
            </label>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permisos de Módulos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="perm_accounting"
                  checked={permissions.accounting}
                  onCheckedChange={(checked) => setPermissions({ ...permissions, accounting: checked as boolean })}
                />
                <label htmlFor="perm_accounting" className="text-sm cursor-pointer">
                  <span className="font-medium">Contabilidad</span>
                  <p className="text-xs text-muted-foreground">
                    Acceso al módulo de contabilidad, documentos, declaraciones y observaciones fiscales
                  </p>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="perm_clients"
                  checked={permissions.clients}
                  onCheckedChange={(checked) => setPermissions({ ...permissions, clients: checked as boolean })}
                />
                <label htmlFor="perm_clients" className="text-sm cursor-pointer">
                  <span className="font-medium">Clientes</span>
                  <p className="text-xs text-muted-foreground">
                    Acceso al módulo de gestión de clientes y asignación de responsables
                  </p>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="perm_users"
                  checked={permissions.users}
                  onCheckedChange={(checked) => setPermissions({ ...permissions, users: checked as boolean })}
                />
                <label htmlFor="perm_users" className="text-sm cursor-pointer">
                  <span className="font-medium">Usuarios del Sistema</span>
                  <p className="text-xs text-muted-foreground">
                    Acceso al panel de administración de usuarios (solo administradores)
                  </p>
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
