"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ClipboardCheck, ListTodo } from "lucide-react"
import Link from "next/link"
import { ProcessControlDashboard } from "@/components/process-control/process-control-dashboard"
import { MyTasksPanel } from "@/components/process-control/my-tasks-panel"
import { useUserRole, isClientRole } from "@/hooks/use-user-role"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"

const TABS = [
    { id: "panel", label: "Mi Panel", icon: ClipboardCheck },
    { id: "tareas", label: "Mis Tareas", icon: ListTodo },
]

function ProcessControlContent() {
    const { role, loading: roleLoading } = useUserRole()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState(() => {
        const tab = searchParams.get("tab")
        return tab && TABS.some(t => t.id === tab) ? tab : "panel"
    })

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

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b">
                {TABS.map(tab => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
                                ${activeTab === tab.id
                                    ? "border-emerald-600 text-emerald-700"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {activeTab === "panel" && <ProcessControlDashboard />}
            {activeTab === "tareas" && <MyTasksPanel />}
        </div>
    )
}

export default function ProcessControlPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Cargando...</p>
            </div>
        }>
            <ProcessControlContent />
        </Suspense>
    )
}
