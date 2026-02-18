"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { InvoicingSection } from "@/components/invoicing/invoicing-section"
import { useUserRole, canModify } from "@/hooks/use-user-role"

export default function InvoicingClientPage() {
    const params = useParams()
    const router = useRouter()
    const clientId = params.id as string
    const [clientName, setClientName] = useState("")
    const [loading, setLoading] = useState(true)
    const { role, loading: roleLoading } = useUserRole()

    useEffect(() => {
        fetchClientInfo()
    }, [clientId])

    async function fetchClientInfo() {
        try {
            const res = await fetch(`/api/clients/list`)
            const data = await res.json()
            if (res.ok) {
                const clients = data.data || data.clients || []
                const client = clients.find((c: any) => c.id === clientId)
                if (client) {
                    setClientName(client.business_name || client.name || "Cliente")
                }
            }
        } catch (err) {
            console.error("Error:", err)
        } finally {
            setLoading(false)
        }
    }

    if (loading || roleLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/invoicing">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Facturación</h1>
                    <p className="text-sm text-muted-foreground">{clientName}</p>
                </div>
            </div>

            <InvoicingSection
                clientId={clientId}
                clientName={clientName}
                canEdit={canModify(role)}
            />
        </div>
    )
}
