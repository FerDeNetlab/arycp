"use client"

import { useEffect } from "react"
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
} from "lucide-react"
import Link from "next/link"
import { useUserRole, isClientRole } from "@/hooks/use-user-role"

// Module definitions with their service flags
const ALL_MODULES = [
  {
    key: "accounting",
    href: "/dashboard/accounting",
    icon: Calculator,
    label: "Contabilidad",
    description: "Gestión contable, declaraciones y documentos",
    color: "primary",
    hoverBorder: "hover:border-primary",
    bgClass: "bg-primary/10",
    iconClass: "text-primary",
    serviceFlag: "has_accounting" as const,
  },
  {
    key: "fiscal",
    href: "/dashboard/fiscal",
    icon: FileWarning,
    label: "Fiscal",
    description: "Observaciones y asesoría fiscal",
    color: "orange",
    hoverBorder: "hover:border-orange-500",
    bgClass: "bg-orange-100",
    iconClass: "text-orange-600",
    serviceFlag: "has_fiscal" as const,
  },
  {
    key: "legal",
    href: "/dashboard/legal",
    icon: Scale,
    label: "Jurídico",
    description: "Procesos legales y tramitología",
    color: "purple",
    hoverBorder: "hover:border-purple-500",
    bgClass: "bg-purple-100",
    iconClass: "text-purple-600",
    serviceFlag: "has_legal" as const,
  },
  {
    key: "labor",
    href: "/dashboard/labor",
    icon: Briefcase,
    label: "Laboral",
    description: "Nóminas y asuntos laborales",
    color: "green",
    hoverBorder: "hover:border-green-500",
    bgClass: "bg-green-100",
    iconClass: "text-green-600",
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
    hoverBorder: "hover:border-blue-500",
    bgClass: "bg-blue-100",
    iconClass: "text-blue-600",
  },
  {
    key: "users",
    href: "/dashboard/users",
    icon: UserCircle,
    label: "Usuarios del Sistema",
    description: "Administrar usuarios y responsables",
    hoverBorder: "hover:border-indigo-500",
    bgClass: "bg-indigo-100",
    iconClass: "text-indigo-600",
  },
  {
    key: "procedures",
    href: "/dashboard/procedures",
    icon: FileText,
    label: "Tramitología",
    description: "Gestión de trámites y documentos",
    hoverBorder: "hover:border-cyan-500",
    bgClass: "bg-cyan-100",
    iconClass: "text-cyan-600",
  },
  {
    key: "calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    label: "Calendario",
    description: "Agenda y recordatorios",
    hoverBorder: "hover:border-red-500",
    bgClass: "bg-red-100",
    iconClass: "text-red-600",
  },
  {
    key: "emails",
    href: "/dashboard/emails",
    icon: Mail,
    label: "Correos Electrónicos",
    description: "Plantillas y envío de correos",
    hoverBorder: "hover:border-primary",
    bgClass: "bg-primary/10",
    iconClass: "text-primary",
  },
  {
    key: "messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
    label: "Mensajes de Contacto",
    description: "Ver mensajes del formulario web",
    hoverBorder: "hover:border-violet-500",
    bgClass: "bg-violet-100",
    iconClass: "text-violet-600",
  },
]

// Client-specific extra modules (Tramitología as tracking)
const CLIENT_EXTRA_MODULES = [
  {
    key: "procedures",
    href: "/dashboard/procedures",
    icon: FileText,
    label: "Mis Trámites",
    description: "Seguimiento de tus trámites",
    hoverBorder: "hover:border-cyan-500",
    bgClass: "bg-cyan-100",
    iconClass: "text-cyan-600",
  },
  {
    key: "calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    label: "Calendario",
    description: "Próximos eventos y citas",
    hoverBorder: "hover:border-red-500",
    bgClass: "bg-red-100",
    iconClass: "text-red-600",
  },
  {
    key: "emails",
    href: "/dashboard/emails",
    icon: Mail,
    label: "Correos",
    description: "Comunicaciones recibidas",
    hoverBorder: "hover:border-primary",
    bgClass: "bg-primary/10",
    iconClass: "text-primary",
  },
]

export default function DashboardPage() {
  const { role, fullName, services, clientId, loading } = useUserRole()
  const router = useRouter()
  const isClient = isClientRole(role)

  // Filter modules for client based on contracted services
  const visibleServiceModules = isClient
    ? ALL_MODULES.filter((m) => services?.[m.serviceFlag])
    : ALL_MODULES

  const visibleExtraModules = isClient ? CLIENT_EXTRA_MODULES : ADMIN_MODULES

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <main className="container mx-auto px-6 py-8">

        {/* Stats Overview - Only for admin/contador */}
        {!isClient && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-2 hover:border-primary/50 card-hover-glow animate-fade-in-up">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Trámites Activos</CardTitle>
                <FileText className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12</div>
                <p className="text-xs text-muted-foreground mt-1">+2 desde la semana pasada</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary/50 card-hover-glow animate-fade-in-up delay-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
                <ClipboardCheck className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">8</div>
                <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent/50 card-hover-glow animate-fade-in-up delay-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Eventos Próximos</CardTitle>
                <Calendar className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">5</div>
                <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-destructive/50 card-hover-glow animate-fade-in-up delay-3">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Alertas</CardTitle>
                <AlertCircle className="h-5 w-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">3</div>
                <p className="text-xs text-muted-foreground mt-1">Requieren acción inmediata</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Client Welcome Banner */}
        {isClient && (
          <Card className="border-2 border-primary/20 bg-primary/5 mb-8 animate-fade-in-up">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-2">Bienvenido, {fullName}</h2>
              <p className="text-muted-foreground">
                Aquí puedes consultar el resumen de actividad de tus servicios contratados.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Módulos */}
          <Card className="border-2 animate-fade-in-up delay-2">
            <CardHeader>
              <CardTitle>{isClient ? "Mis Servicios" : "Módulos del Sistema"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {visibleServiceModules.map((mod) => {
                const Icon = mod.icon
                return (
                  <Link
                    key={mod.key}
                    href={mod.href}
                    className={`block w-full p-4 rounded-lg border-2 ${mod.hoverBorder} card-hover text-left`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-lg ${mod.bgClass} flex items-center justify-center icon-hover`}>
                        <Icon className={`h-6 w-6 ${mod.iconClass}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{mod.label}</h3>
                        <p className="text-sm text-muted-foreground">{mod.description}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}

              {visibleExtraModules.map((mod) => {
                const Icon = mod.icon
                return (
                  <Link
                    key={mod.key}
                    href={mod.href}
                    className={`block w-full p-4 rounded-lg border-2 ${mod.hoverBorder} card-hover text-left`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-lg ${mod.bgClass} flex items-center justify-center icon-hover`}>
                        <Icon className={`h-6 w-6 ${mod.iconClass}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{mod.label}</h3>
                        <p className="text-sm text-muted-foreground">{mod.description}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}

              {/* Control de Procesos - solo admin/contador */}
              {!isClient && (
                <Link
                  href="/dashboard/process-control"
                  className="block w-full p-4 rounded-lg border-2 hover:border-emerald-500 card-hover text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center icon-hover">
                      <ClipboardCheck className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Control de Procesos</h3>
                      <p className="text-sm text-muted-foreground">Seguimiento de flujos de trabajo</p>
                    </div>
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Actividad Reciente */}
          <Card className="border-2 animate-fade-in-up delay-3">
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-border">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Trámite fiscal completado</p>
                    <p className="text-xs text-muted-foreground">Hace 2 horas</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-4 border-b border-border">
                  <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nuevo documento subido</p>
                    <p className="text-xs text-muted-foreground">Hace 5 horas</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-4 border-b border-border">
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Reunión programada</p>
                    <p className="text-xs text-muted-foreground">Hace 1 día</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Alerta: Vencimiento próximo</p>
                    <p className="text-xs text-muted-foreground">Hace 2 días</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
