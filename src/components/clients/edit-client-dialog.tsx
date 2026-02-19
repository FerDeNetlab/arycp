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
  const [services, setServices] = useState({
    has_accounting: client.has_accounting,
    has_fiscal: client.has_fiscal,
    has_legal: client.has_legal,
    has_labor: client.has_labor,
    has_invoicing: client.has_invoicing ?? false,
  })
  const router = useRouter()

  function toggleService(key: keyof typeof services) {
    setServices(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch("/api/clients/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: client.id,
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          phone: (formData.get("phone") as string) || null,
          ...services,
        }),
      })

      setLoading(false)

      if (response.ok) {
        setOpen(false)
        router.refresh()
        window.location.reload()
      }
    } catch (err) {
      console.error("Error:", err)
      setLoading(false)
    }
  }

  const serviceOptions = [
    { key: "has_accounting" as const, label: "Contabilidad" },
    { key: "has_fiscal" as const, label: "Fiscal" },
    { key: "has_legal" as const, label: "Jurídico" },
    { key: "has_labor" as const, label: "Laboral" },
    { key: "has_invoicing" as const, label: "Facturación" },
  ]

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
            {serviceOptions.map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={key}
                  checked={services[key]}
                  onChange={() => toggleService(key)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <label htmlFor={key} className="text-sm cursor-pointer select-none">
                  {label}
                </label>
              </div>
            ))}
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
