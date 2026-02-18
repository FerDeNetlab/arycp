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

interface Client {
  id: string
  name: string
  email: string
  phone: string | null
  has_accounting: boolean
  has_fiscal: boolean
  has_legal: boolean
  has_labor: boolean
  has_invoicing?: boolean
}

export function EditClientDialog({ client, children }: { client: Client; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase
      .from("clients")
      .update({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: (formData.get("phone") as string) || null,
        has_accounting: formData.get("has_accounting") === "on",
        has_fiscal: formData.get("has_fiscal") === "on",
        has_legal: formData.get("has_legal") === "on",
        has_labor: formData.get("has_labor") === "on",
        has_invoicing: formData.get("has_invoicing") === "on",
      })
      .eq("id", client.id)

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
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>Modifica la información del cliente</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre o Razón Social *</Label>
            <Input id="name" name="name" defaultValue={client.name} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico *</Label>
            <Input id="email" name="email" type="email" defaultValue={client.email} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={client.phone || ""} />
          </div>

          <div className="space-y-3">
            <Label>Servicios Contratados</Label>
            <div className="flex items-center space-x-2">
              <Checkbox id="has_accounting" name="has_accounting" defaultChecked={client.has_accounting} />
              <label htmlFor="has_accounting" className="text-sm cursor-pointer">
                Contabilidad
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="has_fiscal" name="has_fiscal" defaultChecked={client.has_fiscal} />
              <label htmlFor="has_fiscal" className="text-sm cursor-pointer">
                Fiscal
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="has_legal" name="has_legal" defaultChecked={client.has_legal} />
              <label htmlFor="has_legal" className="text-sm cursor-pointer">
                Jurídico
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="has_labor" name="has_labor" defaultChecked={client.has_labor} />
              <label htmlFor="has_labor" className="text-sm cursor-pointer">
                Laboral
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="has_invoicing" name="has_invoicing" defaultChecked={client.has_invoicing} />
              <label htmlFor="has_invoicing" className="text-sm cursor-pointer">
                Facturación
              </label>
            </div>
          </div>

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
