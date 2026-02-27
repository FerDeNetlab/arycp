"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, Mail, Phone, Edit, Users } from "lucide-react"
import { EditClientDialog } from "./edit-client-dialog"
import { ManageAssignmentsDialog } from "./manage-assignments-dialog"

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
  created_at: string
  client_assignments?: Array<{
    system_users: {
      id: string
      full_name: string
      email: string
    }
  }>
}

export function ClientsSimpleList({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay clientes aún</h3>
        <p className="text-muted-foreground">Comienza añadiendo tu primer cliente</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {clients.map((client) => (
        <Card key={client.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{client.name}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {client.has_accounting && <Badge variant="secondary">Contabilidad</Badge>}
                    {client.has_fiscal && <Badge variant="secondary">Fiscal</Badge>}
                    {client.has_legal && <Badge variant="secondary">Jurídico</Badge>}
                    {client.has_labor && <Badge variant="secondary">Laboral</Badge>}
                    {client.has_invoicing && <Badge variant="secondary">Facturación</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <ManageAssignmentsDialog client={client}>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Responsables
                  </Button>
                </ManageAssignmentsDialog>
                <EditClientDialog client={client}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </EditClientDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {client.email}
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {client.phone}
                </div>
              )}
            </div>
            {client.client_assignments && client.client_assignments.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Responsables asignados:</p>
                <div className="flex flex-wrap gap-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {client.client_assignments.map((assignment: any) => (
                    <Badge key={assignment.system_users.id} variant="outline">
                      {assignment.system_users.full_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
