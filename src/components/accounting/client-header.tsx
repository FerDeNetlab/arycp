"use client"

import { Badge } from "@/components/ui/badge"
import { Building2, Mail, Phone } from "lucide-react"

interface Client {
  name: string
  email: string | null
  phone: string | null
  company: string | null
  has_accounting: boolean
  has_fiscal: boolean
  has_legal: boolean
}

export function ClientHeader({ client }: { client: Client }) {
  return (
    <div className="flex-1">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          {client.company && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3" />
              {client.company}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {client.has_accounting && <Badge variant="secondary">Contabilidad</Badge>}
          {client.has_fiscal && <Badge variant="secondary">Fiscal</Badge>}
          {client.has_legal && <Badge variant="secondary">Jurídico</Badge>}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mt-3">
        {client.email && (
          <p className="text-sm flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3" />
            {client.email}
          </p>
        )}
        {client.phone && (
          <p className="text-sm flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3" />
            {client.phone}
          </p>
        )}
      </div>
    </div>
  )
}
