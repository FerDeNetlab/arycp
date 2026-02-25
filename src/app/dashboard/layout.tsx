"use client"

import { useState } from "react"
import { LogOut, UserCircle, Menu } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useUserRole, isClientRole } from "@/hooks/use-user-role"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { role, fullName, loading } = useUserRole()
    const isClient = isClientRole(role)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const displayName = fullName || "Usuario"

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            {!loading && (
                <Sidebar
                    isClient={isClient}
                    userRole={role}
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    mobileOpen={mobileMenuOpen}
                    onMobileClose={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div
                className={cn(
                    "sidebar-transition",
                    // No margin on mobile, sidebar is overlay
                    loading ? "md:ml-0" : sidebarCollapsed ? "md:ml-[68px]" : "md:ml-[256px]"
                )}
            >
                {/* Topbar */}
                <header className="sticky top-0 z-20 h-14 md:h-16 border-b border-border bg-card/80 backdrop-blur-md">
                    <div className="flex items-center justify-between h-full px-4 md:px-6">
                        {/* Left: Hamburger + Welcome */}
                        <div className="flex items-center gap-3">
                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setMobileMenuOpen(true)}
                                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
                                aria-label="Abrir menú"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            {!loading && (
                                <p className="text-sm text-muted-foreground hidden sm:block">
                                    Bienvenido, <span className="font-medium text-foreground">{displayName}</span>
                                </p>
                            )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 md:gap-2">
                            {/* Notifications bell — admin/contador only */}
                            {!isClient && !loading && (
                                <NotificationBell />
                            )}

                            {/* Admin link — admin/contador only */}
                            {!isClient && !loading && (
                                <Link href="/dashboard/users">
                                    <button className="flex items-center gap-2 px-2 md:px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                                        <UserCircle className="h-4 w-4" />
                                        <span className="hidden sm:inline">Admin</span>
                                    </button>
                                </Link>
                            )}

                            {/* Logout */}
                            <form action="/auth/logout" method="post">
                                <button className="flex items-center gap-2 px-2 md:px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Salir</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
