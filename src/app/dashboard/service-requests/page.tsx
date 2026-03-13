"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { RequestList } from "@/components/service-requests/request-list"
import { useUserRole, isClientRole } from "@/hooks/use-user-role"

export default function ServiceRequestsPage() {
    const { role, loading } = useUserRole()
    const router = useRouter()
    const isClient = isClientRole(role)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <Send className="h-6 w-6 text-indigo-600" />
                    <div>
                        <h1 className="text-2xl font-bold">
                            {isClient ? "Mis Solicitudes" : "Solicitudes de Servicio"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isClient
                                ? "Consulta el estado de tus solicitudes"
                                : "Solicitudes de servicio de clientes"}
                        </p>
                    </div>
                </div>
            </div>

            <RequestList isClient={isClient} />
        </div>
    )
}
