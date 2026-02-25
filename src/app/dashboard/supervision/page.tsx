"use client"

import { useUserRole } from "@/hooks/use-user-role"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"
import { SupervisionDashboard } from "@/components/supervision/supervision-dashboard"
import { EmployeeView } from "@/components/supervision/employee-view"
import { ClientProfitability } from "@/components/supervision/client-profitability"
import { AlertsPanel } from "@/components/supervision/alerts-panel"
import { SettingsPanel } from "@/components/supervision/settings-panel"

const TABS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "empleados", label: "Empleados" },
    { id: "clientes", label: "Clientes" },
    { id: "alertas", label: "Alertas" },
    { id: "config", label: "Configuración" },
]

export default function SupervisionPage() {
    const { role, loading: roleLoading } = useUserRole()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("dashboard")

    useEffect(() => {
        if (!roleLoading && role !== "admin") {
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

    if (role !== "admin") return null

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">Supervisión</h1>
                        <p className="text-sm text-muted-foreground">Productividad, Rentabilidad y Alertas</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-border pb-px overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap rounded-t-lg
                            ${activeTab === tab.id
                                ? "text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "dashboard" && <SupervisionDashboard />}
            {activeTab === "empleados" && <EmployeeView />}
            {activeTab === "clientes" && <ClientProfitability />}
            {activeTab === "alertas" && <AlertsPanel />}
            {activeTab === "config" && <SettingsPanel />}
        </div>
    )
}
