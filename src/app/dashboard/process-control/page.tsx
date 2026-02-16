"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ClipboardCheck } from "lucide-react"
import Link from "next/link"
import { ProcessControlDashboard } from "@/components/process-control/process-control-dashboard"
import { useUserRole, isClientRole } from "@/hooks/use-user-role"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProcessControlPage() {
    const { role, loading: roleLoading } = useUserRole()
    const router = useRouter()

    // Only admin/contador can access this
    useEffect(() => {
        if (!roleLoading && isClientRole(role)) {
            router.replace("/dashboard")
        }
    }, [roleLoading, role, router])

    if (roleLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        )
    }

    if (isClientRole(role)) return null

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-emerald-700">Control de Procesos</h1>
                        <p className="text-sm text-muted-foreground">Tu panel de seguimiento y flujo de trabajo</p>
                    </div>
                </div>
            </div>

            <ProcessControlDashboard />
        </div>
    )
}
