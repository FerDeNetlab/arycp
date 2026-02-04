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
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"

export function AddClientSimpleDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("clients").insert({
      user_id: user.id,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || null,
      has_accounting: formData.get("has_accounting") === "on",
      has_fiscal: formData.get("has_fiscal") === "on",
      has_legal: formData.get("has_legal") === "on",
      has_labor: formData.get("has_labor") === "on",
    })

    setLoading(false)

    if (!error) {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Cliente</DialogTitle>
          <DialogDescription>Ingresa la información básica del cliente</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre o Razón Social *</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico *</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" type="tel" />
          </div>

          <div className="space-y-3">
            <Label>Servicios Contratados</Label>
            <div className="flex items-center space-x-2">
              <Checkbox id="has_accounting" name="has_accounting" />
              <label htmlFor="has_accounting" className="text-sm cursor-pointer">
                Contabilidad
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="has_fiscal" name="has_fiscal" />
              <label htmlFor="has_fiscal" className="text-sm cursor-pointer">
                Fiscal
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="has_legal" name="has_legal" />
              <label htmlFor="has_legal" className="text-sm cursor-pointer">
                Jurídico
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="has_labor" name="has_labor" />
              <label htmlFor="has_labor" className="text-sm cursor-pointer">
                Laboral
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
