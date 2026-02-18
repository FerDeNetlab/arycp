"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useUserRole, isClientRole } from "@/hooks/use-user-role"

type Client = {
    id: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
    business_name: string | null
    created_at: string
}

export default function InvoicingPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const router = useRouter()
    const { role, clientId, loading: roleLoading } = useUserRole()

    // Redirect client to their own data
    useEffect(() => {
        if (!roleLoading && isClientRole(role) && clientId) {
            router.replace(`/dashboard/invoicing/${clientId}`)
        }
    }, [roleLoading, role, clientId, router])

    useEffect(() => {
        if (!roleLoading && !isClientRole(role)) {
            fetchClients()
        }
    }, [roleLoading, role])

    async function fetchClients() {
        try {
            const response = await fetch("/api/clients/list")
            const data = await response.json()
            if (response.ok) {
                setClients(data.data || data.clients || [])
            }
        } catch (err) {
            console.error("Error:", err)
        } finally {
            setLoading(false)
        }
    }

    if (roleLoading || isClientRole(role)) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        )
    }

    const filtered = clients.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.business_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.company?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Facturación</h1>
                    <p className="text-sm text-muted-foreground">Gestión de facturas, cancelaciones y plantillas</p>
                </div>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full max-w-md h-10 rounded-lg border border-input bg-background px-4 text-sm"
                />
            </div>

            {loading ? (
                <p className="text-center text-muted-foreground py-8">Cargando clientes...</p>
            ) : filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No se encontraron clientes</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filtered.map(client => (
                        <Link key={client.id} href={`/dashboard/invoicing/${client.id}`}>
                            <div className="p-4 rounded-xl border bg-card hover:bg-muted/50 hover:shadow-md transition-all cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                                        {(client.business_name || client.name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                                            {client.business_name || client.name}
                                        </p>
                                        {client.business_name && client.name !== client.business_name && (
                                            <p className="text-xs text-muted-foreground truncate">{client.name}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
