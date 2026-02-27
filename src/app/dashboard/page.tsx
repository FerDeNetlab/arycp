"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  ClipboardCheck,
  Calendar,
  AlertCircle,
  TrendingUp,
  Users,
  Calculator,
  UserCircle,
  Mail,
  FileWarning,
  Scale,
  Briefcase,
  MessageSquare,
  ArrowUpRight,
  Receipt,
} from "lucide-react"
import Link from "next/link"
import { useUserRole, isClientRole } from "@/hooks/use-user-role"
import { ActivityFeed } from "@/components/activity/activity-feed"
import { ComplianceAlerts } from "@/components/compliance/compliance-alerts"

// Module definitions with their service flags
const ALL_MODULES = [
  {
    key: "accounting",
    href: "/dashboard/accounting",
    icon: Calculator,
    label: "Contabilidad",
    description: "Gestión contable, declaraciones y documentos",
    accent: "bg-blue-50 text-blue-700 border-blue-100",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    serviceFlag: "has_accounting" as const,
  },
  {
    key: "fiscal",
    href: "/dashboard/fiscal",
    icon: FileWarning,
    label: "Fiscal",
    description: "Observaciones y asesoría fiscal",
    accent: "bg-amber-50 text-amber-700 border-amber-100",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    serviceFlag: "has_fiscal" as const,
  },
  {
    key: "legal",
    href: "/dashboard/legal",
    icon: Scale,
    label: "Jurídico",
    description: "Procesos legales y tramitología",
    accent: "bg-violet-50 text-violet-700 border-violet-100",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    serviceFlag: "has_legal" as const,
  },
  {
    key: "labor",
    href: "/dashboard/labor",
    icon: Briefcase,
    label: "Laboral",
    description: "Nóminas y asuntos laborales",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    serviceFlag: "has_labor" as const,
  },
]

const ADMIN_MODULES = [
  {
    key: "clients",
    href: "/dashboard/clients",
    icon: Users,
    label: "Clientes",
    description: "Administrar datos de clientes",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  {
    key: "procedures",
    href: "/dashboard/procedures",
    icon: FileText,
    label: "Tramitología",
    description: "Gestión de trámites y documentos",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
    key: "process-control",
    href: "/dashboard/process-control",
    icon: ClipboardCheck,
    label: "Control de Procesos",
    description: "Seguimiento de flujos de trabajo",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  {
    key: "calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    label: "Calendario",
    description: "Agenda y recordatorios",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  {
    key: "emails",
    href: "/dashboard/emails",
    icon: Mail,
    label: "Correos",
    description: "Plantillas y envío de correos",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    key: "messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
    label: "Mensajes",
    description: "Mensajes del formulario web",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    key: "invoicing",
    href: "/dashboard/invoicing",
    icon: Receipt,
    label: "Facturación",
    description: "Facturas, cancelaciones y plantillas",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  {
    key: "users",
    href: "/dashboard/users",
    icon: UserCircle,
    label: "Usuarios",
    description: "Administrar usuarios del sistema",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
]

const CLIENT_EXTRA_MODULES = [
  {
    key: "procedures",
    href: "/dashboard/procedures",
    icon: FileText,
    label: "Mis Trámites",
    description: "Seguimiento de tus trámites",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
    key: "calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    label: "Calendario",
    description: "Próximos eventos y citas",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
]

export default function DashboardPage() {
  const { role, fullName, services, clientId, loading } = useUserRole()
  const router = useRouter()
  const isClient = isClientRole(role)

  const [stats, setStats] = useState({ totalActive: 0, totalPending: 0, upcomingEvents: 0, alerts: 0 })

  useEffect(() => {
    if (!isClient && !loading) {
      fetch("/api/dashboard/stats")
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(() => { })
    }
  }, [isClient, loading])

  const visibleServiceModules = isClient
    ? ALL_MODULES.filter((m) => services?.[m.serviceFlag])
    : ALL_MODULES

  const visibleExtraModules = isClient ? CLIENT_EXTRA_MODULES : ADMIN_MODULES

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isClient ? `Hola, ${fullName}` : "Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isClient
            ? "Consulta el resumen de actividad de tus servicios."
            : "Vista general de operaciones y módulos del sistema."
          }
        </p>
      </div>

      {/* KPI Cards — Admin only */}
      {!isClient && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Trámites Activos",
              value: stats.totalActive,
              icon: FileText,
              color: "text-primary",
              bgColor: "bg-primary/5",
              borderColor: "border-primary/10",
            },
            {
              label: "Pendientes",
              value: stats.totalPending,
              icon: ClipboardCheck,
              color: "text-amber-600",
              bgColor: "bg-amber-50",
              borderColor: "border-amber-100",
            },
            {
              label: "Eventos Próximos",
              value: stats.upcomingEvents,
              icon: Calendar,
              color: "text-secondary",
              bgColor: "bg-emerald-50",
              borderColor: "border-emerald-100",
            },
            {
              label: "Alertas",
              value: stats.alerts,
              icon: AlertCircle,
              color: "text-destructive",
              bgColor: "bg-red-50",
              borderColor: "border-red-100",
            },
          ].map((kpi, i) => {
            const Icon = kpi.icon
            return (
              <Card
                key={kpi.label}
                className={`kpi-card border ${kpi.borderColor} ${kpi.bgColor} animate-fade-in-up`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Modules — 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Modules */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {isClient ? "Mis Servicios" : "Módulos Principales"}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {visibleServiceModules.map((mod, i) => {
                const Icon = mod.icon
                return (
                  <Link key={mod.key} href={mod.href}>
                    <Card
                      className="card-hover border border-border hover:border-primary/30 cursor-pointer group animate-fade-in-up"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg ${mod.iconBg} flex items-center justify-center icon-hover flex-shrink-0`}>
                            <Icon className={`h-5 w-5 ${mod.iconColor}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-foreground">{mod.label}</h3>
                            <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Extra Modules */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {isClient ? "Herramientas" : "Gestión y Herramientas"}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleExtraModules.map((mod, i) => {
                const Icon = mod.icon
                return (
                  <Link key={mod.key} href={mod.href}>
                    <Card
                      className="card-hover border border-border hover:border-primary/30 cursor-pointer group animate-fade-in-up"
                      style={{ animationDelay: `${(i + 4) * 0.05}s` }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-lg ${mod.iconBg} flex items-center justify-center icon-hover flex-shrink-0`}>
                            <Icon className={`h-4 w-4 ${mod.iconColor}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-foreground">{mod.label}</h3>
                            <p className="text-[11px] text-muted-foreground truncate">{mod.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Activity Feed + Compliance Alerts — Right column */}
        <div className="lg:col-span-1 space-y-6">
          {!isClient && <ComplianceAlerts />}
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
