"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Building2, Mail, Phone, ChevronRight, Calculator } from "lucide-react"

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  has_accounting: boolean
  has_fiscal: boolean
  has_legal: boolean
  has_labor: boolean
  created_at: string
}

export function AccountingList({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="py-12 text-center">
          <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay clientes con servicio de Contabilidad</h3>
          <p className="text-sm text-muted-foreground">
            Los clientes con servicio de contabilidad contratado aparecerán aquí.
            <br />
            Puedes crear nuevos clientes desde el módulo de{" "}
            <Link href="/dashboard/clients" className="text-primary underline">
              Gestión de Clientes
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => (
        <Link key={client.id} href={`/dashboard/accounting/${client.id}`}>
          <Card className="border-2 hover:border-primary transition-colors h-full cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{client.name}</h3>
                  {client.company && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {client.company}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="space-y-2 mb-4">
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

              <div className="flex flex-wrap gap-2">
                <Badge className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-100">Contabilidad</Badge>
                {client.has_fiscal && (
                  <Badge variant="secondary" className="text-xs">
                    Fiscal
                  </Badge>
                )}
                {client.has_legal && (
                  <Badge variant="secondary" className="text-xs">
                    Jurídico
                  </Badge>
                )}
                {client.has_labor && (
                  <Badge variant="secondary" className="text-xs">
                    Laboral
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
