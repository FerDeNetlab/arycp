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

export function AddClientSimpleDialog({ children, onClientCreated }: { children: React.ReactNode; onClientCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch("/api/clients/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          phone: (formData.get("phone") as string) || null,
          has_accounting: formData.get("has_accounting") === "on",
          has_fiscal: formData.get("has_fiscal") === "on",
          has_legal: formData.get("has_legal") === "on",
          has_labor: formData.get("has_labor") === "on",
          has_invoicing: formData.get("has_invoicing") === "on",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al crear cliente")
        setLoading(false)
        return
      }

      // Éxito
      setOpen(false)
      onClientCreated?.()
      router.refresh()
    } catch (err) {
      console.error("Error:", err)
      setError("Error de conexión. Intenta nuevamente.")
      setLoading(false)
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
            <div className="flex items-center space-x-2">
              <Checkbox id="has_invoicing" name="has_invoicing" />
              <label htmlFor="has_invoicing" className="text-sm cursor-pointer">
                Facturación
              </label>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

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
