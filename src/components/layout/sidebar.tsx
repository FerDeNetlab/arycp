"use client"

import { useState } from "react"
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
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
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
            { href: "/dashboard/procedures", icon: FileText, label: "Tramitología" },
        ],
    },
    {
        label: "Gestión",
        items: [
            { href: "/dashboard/clients", icon: Users, label: "Clientes" },
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
            { href: "/dashboard/procedures", icon: FileText, label: "Mis Trámites" },
            { href: "/dashboard/calendar", icon: Calendar, label: "Calendario" },
        ],
    },
]

interface SidebarProps {
    isClient: boolean
    collapsed: boolean
    onToggle: () => void
}

export function Sidebar({ isClient, collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname()
    const sections = isClient ? CLIENT_NAV : NAV_SECTIONS

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard"
        return pathname.startsWith(href)
    }

    return (
        <aside
            className={cn(
                "fixed top-0 left-0 h-screen bg-sidebar text-sidebar-foreground z-30 flex flex-col sidebar-transition border-r border-sidebar-border",
                collapsed ? "w-[68px]" : "w-[256px]"
            )}
        >
            {/* Logo Area */}
            <div className={cn(
                "flex items-center border-b border-sidebar-border h-16 px-4",
                collapsed ? "justify-center" : "gap-3"
            )}>
                <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground font-bold text-sm">AR</span>
                </div>
                {!collapsed && (
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-sidebar-foreground truncate">AR&CP</span>
                        <span className="text-[10px] text-sidebar-foreground/50 truncate">ERP System</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
                {sections.map((section) => (
                    <div key={section.label}>
                        {!collapsed && (
                            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                                {section.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                const Icon = item.icon
                                const active = isActive(item.href)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium sidebar-link",
                                            active
                                                ? "bg-sidebar-primary/15 text-sidebar-primary"
                                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                                            collapsed && "justify-center px-2"
                                        )}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <Icon className={cn(
                                            "h-[18px] w-[18px] flex-shrink-0",
                                            active ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                                        )} />
                                        {!collapsed && <span className="truncate">{item.label}</span>}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Collapse Toggle */}
            <button
                onClick={onToggle}
                className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                title={collapsed ? "Expandir menú" : "Contraer menú"}
            >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
        </aside>
    )
}
