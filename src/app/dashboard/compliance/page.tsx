"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Building2, ChevronRight, ClipboardList, Search, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { useUserRole, isClientRole } from "@/hooks/use-user-role"

type Client = {
    id: string
    name: string
    business_name: string
    email: string | null
    phone: string | null
    company: string | null
    status: string
    created_at: string
}

export default function CompliancePage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const router = useRouter()
    const { role, clientId, loading: roleLoading } = useUserRole()

    useEffect(() => {
        if (!roleLoading && isClientRole(role) && clientId) {
            router.replace(`/dashboard/compliance/${clientId}`)
        }
    }, [roleLoading, role, clientId, router])

    useEffect(() => {
        if (!roleLoading && !isClientRole(role)) {
            fetchClients()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleLoading, role])

    async function fetchClients() {
        try {
            const response = await fetch("/api/compliance/clients")
            const data = await response.json()

            if (!response.ok) {
                if (response.status === 401) {
                    router.push("/auth/login")
                    return
                }
                setError(data.error || "Error al cargar clientes")
                setLoading(false)
                return
            }

            setClients(data.clients || [])
            setLoading(false)
        } catch (err) {
            console.error("Error fetching clients:", err)
            setError("Error de conexión")
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
        c.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <h1 className="text-2xl font-bold">Registros y Cumplimiento</h1>
                    <p className="text-sm text-muted-foreground">Control de firmas, sellos, registros patronales y trámites</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar cliente por nombre, razón social o correo..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            {loading && <p className="text-center text-muted-foreground">Cargando clientes...</p>}
            {error && <p className="text-center text-destructive">{error}</p>}
            {!loading && !error && filtered.length === 0 && (
                <Card className="border-2">
                    <CardContent className="py-12 text-center">
                        <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No hay clientes registrados</h3>
                        <p className="text-sm text-muted-foreground">Los clientes aparecerán aquí para gestionar sus registros</p>
                    </CardContent>
                </Card>
            )}
            {!loading && !error && filtered.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((client) => (
                        <Link key={client.id} href={`/dashboard/compliance/${client.id}`}>
                            <Card className="border-2 hover:border-indigo-500 transition-colors h-full cursor-pointer">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-lg mb-1">{client.business_name || client.name}</h3>
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

                                    <Badge className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Registros</Badge>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
