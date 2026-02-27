"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
    Calculator,
    FileWarning,
    Scale,
    Briefcase,
    Users,
    UserCircle,
    FileText,
    Calendar,
    Mail,
    MessageSquare,
    ClipboardCheck,
    ClipboardList,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Receipt,
    X,
    Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_SECTIONS = [
    {
        label: "Principal",
        items: [
            { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        ],
    },
    {
        label: "Módulos",
        items: [
            { href: "/dashboard/accounting", icon: Calculator, label: "Contabilidad" },
            { href: "/dashboard/fiscal", icon: FileWarning, label: "Fiscal" },
            { href: "/dashboard/legal", icon: Scale, label: "Jurídico" },
            { href: "/dashboard/labor", icon: Briefcase, label: "Laboral" },
            { href: "/dashboard/invoicing", icon: Receipt, label: "Facturación" },
            { href: "/dashboard/procedures", icon: FileText, label: "Tramitología" },
        ],
    },
    {
        label: "Gestión",
        items: [
            { href: "/dashboard/clients", icon: Users, label: "Clientes" },
            { href: "/dashboard/compliance", icon: ClipboardList, label: "Registros" },
            { href: "/dashboard/process-control", icon: ClipboardCheck, label: "Control de Procesos" },
            { href: "/dashboard/calendar", icon: Calendar, label: "Calendario" },
        ],
    },
    {
        label: "Comunicación",
        items: [
            { href: "/dashboard/emails", icon: Mail, label: "Correos" },
            { href: "/dashboard/messages", icon: MessageSquare, label: "Mensajes" },
        ],
    },
    {
        label: "Sistema",
        items: [
            { href: "/dashboard/supervision", icon: Shield, label: "Supervisión", adminOnly: true },
            { href: "/dashboard/users", icon: UserCircle, label: "Usuarios" },
        ],
    },
]

// Simplified nav for clients
const CLIENT_NAV = [
    {
        label: "Principal",
        items: [
            { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        ],
    },
    {
        label: "Mis Servicios",
        items: [
            { href: "/dashboard/accounting", icon: Calculator, label: "Contabilidad" },
            { href: "/dashboard/fiscal", icon: FileWarning, label: "Fiscal" },
            { href: "/dashboard/legal", icon: Scale, label: "Jurídico" },
            { href: "/dashboard/labor", icon: Briefcase, label: "Laboral" },
            { href: "/dashboard/invoicing", icon: Receipt, label: "Facturación" },
            { href: "/dashboard/procedures", icon: FileText, label: "Mis Trámites" },
            { href: "/dashboard/calendar", icon: Calendar, label: "Calendario" },
        ],
    },
]

interface SidebarProps {
    isClient: boolean
    userRole: string
    collapsed: boolean
    onToggle: () => void
    mobileOpen: boolean
    onMobileClose: () => void
}

export function Sidebar({ isClient, userRole, collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
    const pathname = usePathname()
    const sections = isClient ? CLIENT_NAV : NAV_SECTIONS

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard"
        return pathname.startsWith(href)
    }

    return (
        <>
            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onMobileClose}
                />
            )}

            <aside
                className={cn(
                    "fixed top-0 left-0 h-screen bg-sidebar text-sidebar-foreground z-50 flex flex-col sidebar-transition border-r border-sidebar-border",
                    // Desktop: normal behavior
                    "hidden md:flex",
                    collapsed ? "md:w-[68px]" : "md:w-[256px]",
                    // Mobile: overlay mode
                    mobileOpen && "flex w-[280px]"
                )}
            >
                {/* Logo Area */}
                <div className={cn(
                    "flex items-center border-b border-sidebar-border h-16 px-4",
                    collapsed && !mobileOpen ? "justify-center" : "gap-3 justify-between"
                )}>
                    <div className="flex items-center gap-3">
                        <Image src="/images/arycp-logo-symbol.png" alt="ARYCP Logo" width={36} height={36} className="flex-shrink-0" />
                        {(!collapsed || mobileOpen) && (
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-sidebar-foreground truncate">AR&CP</span>
                                <span className="text-[10px] text-sidebar-foreground/50 truncate">ERP System</span>
                            </div>
                        )}
                    </div>
                    {/* Mobile close button */}
                    <button
                        onClick={onMobileClose}
                        className="md:hidden p-1 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
                    {sections.map((section) => (
                        <div key={section.label}>
                            {(!collapsed || mobileOpen) && (
                                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                                    {section.label}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {section.items
                                    .filter((item: any) => !item.adminOnly || userRole === "admin")
                                    .map((item) => {
                                        const Icon = item.icon
                                        const active = isActive(item.href)
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={onMobileClose}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium sidebar-link transition-all",
                                                    active
                                                        ? "bg-sidebar-primary/15 text-sidebar-primary border-l-[3px] border-sidebar-primary shadow-sm"
                                                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                                                    collapsed && !mobileOpen && "justify-center px-2"
                                                )}
                                                title={collapsed && !mobileOpen ? item.label : undefined}
                                            >
                                                <Icon className={cn(
                                                    "h-[18px] w-[18px] flex-shrink-0",
                                                    active ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                                                )} />
                                                {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
                                            </Link>
                                        )
                                    })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Collapse Toggle — desktop only */}
                <button
                    onClick={onToggle}
                    className="hidden md:flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    title={collapsed ? "Expandir menú" : "Contraer menú"}
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
            </aside>
        </>
    )
}
