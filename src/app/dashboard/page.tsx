import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
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
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const userName = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Usuario"

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/images/arycp-logo.png" alt="ARYCP Logo" width={40} height={40} className="h-10 w-10" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">AR&CP</span>
                <span className="text-xs text-muted-foreground -mt-1">ERP System</span>
              </div>
            </Link>
            <div className="ml-4 pl-4 border-l border-border">
              <p className="text-sm text-muted-foreground">Bienvenido, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/users">
              <button className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent/10 transition-colors flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Administrador
              </button>
            </Link>
            <form action="/auth/logout" method="post">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Trámites Activos</CardTitle>
              <FileText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12</div>
              <p className="text-xs text-muted-foreground mt-1">+2 desde la semana pasada</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-secondary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
              <ClipboardCheck className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
              <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Eventos Próximos</CardTitle>
              <Calendar className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">5</div>
              <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-destructive/50 transition-colors">
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

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Módulos Principales */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Módulos del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href="/dashboard/accounting"
                className="block w-full p-4 rounded-lg border-2 hover:border-primary transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Contabilidad</h3>
                    <p className="text-sm text-muted-foreground">Gestión contable, declaraciones y documentos</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/fiscal"
                className="block w-full p-4 rounded-lg border-2 hover:border-orange-500 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <FileWarning className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Fiscal</h3>
                    <p className="text-sm text-muted-foreground">Observaciones y asesoría fiscal</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/legal"
                className="block w-full p-4 rounded-lg border-2 hover:border-purple-500 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Scale className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Jurídico</h3>
                    <p className="text-sm text-muted-foreground">Procesos legales y tramitología</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/labor"
                className="block w-full p-4 rounded-lg border-2 hover:border-green-500 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Laboral</h3>
                    <p className="text-sm text-muted-foreground">Nóminas y asuntos laborales</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/clients"
                className="block w-full p-4 rounded-lg border-2 hover:border-secondary transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Clientes</h3>
                    <p className="text-sm text-muted-foreground">Administrar datos de clientes</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/users"
                className="block w-full p-4 rounded-lg border-2 hover:border-accent transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Usuarios del Sistema</h3>
                    <p className="text-sm text-muted-foreground">Administrar usuarios y responsables</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/procedures"
                className="block w-full p-4 rounded-lg border-2 hover:border-cyan-500 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Tramitología</h3>
                    <p className="text-sm text-muted-foreground">Gestión de trámites y documentos</p>
                  </div>
                </div>
              </Link>

              <button className="w-full p-4 rounded-lg border-2 hover:border-secondary transition-colors text-left">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <ClipboardCheck className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Control de Procesos</h3>
                    <p className="text-sm text-muted-foreground">Seguimiento de flujos de trabajo</p>
                  </div>
                </div>
              </button>

              <Link
                href="/dashboard/calendar"
                className="block w-full p-4 rounded-lg border-2 hover:border-accent transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Calendario</h3>
                    <p className="text-sm text-muted-foreground">Agenda y recordatorios</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/emails"
                className="block w-full p-4 rounded-lg border-2 hover:border-primary transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Correos Electrónicos</h3>
                    <p className="text-sm text-muted-foreground">Plantillas y envío de correos</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Actividad Reciente */}
          <Card className="border-2">
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
