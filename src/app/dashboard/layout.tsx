"use client"

import { UserCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useUserRole, isClientRole } from "@/hooks/use-user-role"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { role, fullName, loading } = useUserRole()
    const isClient = isClientRole(role)

    const displayName = fullName || "Usuario"

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            {/* Header */}
            <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <div style={{ height: '48px', width: '64px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                                <Image src="/images/arycp-logo.jpg" alt="ARYCP Logo" width={200} height={200} style={{ position: 'absolute', top: '-3px', left: '50%', transform: 'translateX(-50%)', width: '180%', height: 'auto', mixBlendMode: 'multiply' }} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-foreground">AR&CP</span>
                                <span className="text-xs text-muted-foreground -mt-1">ERP System</span>
                            </div>
                        </Link>
                        {!loading && (
                            <div className="ml-4 pl-4 border-l border-border">
                                <p className="text-sm text-muted-foreground">Bienvenido, {displayName}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Admin button - only for admin/contador */}
                        {!isClient && !loading && (
                            <Link href="/dashboard/users">
                                <button className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent/10 transition-colors flex items-center gap-2">
                                    <UserCircle className="h-4 w-4" />
                                    Administrador
                                </button>
                            </Link>
                        )}
                        <form action="/auth/logout" method="post">
                            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Cerrar Sesión
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    )
}
