"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Scale, Calculator, FileText, ClipboardCheck, TrendingUp, Briefcase, Receipt } from "lucide-react"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

const services = [
  {
    icon: Calculator,
    title: "Contabilidad",
    description:
      "Llevamos tu contabilidad al día con reportes mensuales y asesoría personalizada para la toma de decisiones financieras.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "hover:border-blue-400",
  },
  {
    icon: FileText,
    title: "Asesoría Fiscal",
    description:
      "Te ayudamos a cumplir con tus obligaciones fiscales optimizando tu carga tributaria de manera legal y eficiente.",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "hover:border-orange-400",
  },
  {
    icon: Scale,
    title: "Servicios Jurídicos",
    description: "Asesoría legal corporativa, revisión de contratos y representación en temas empresariales complejos.",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "hover:border-purple-400",
  },
  {
    icon: Briefcase,
    title: "Laboral",
    description: "Administración de nómina, contratos laborales y cumplimiento de obligaciones patronales.",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "hover:border-teal-400",
  },
  {
    icon: Receipt,
    title: "Facturación",
    description: "Emisión, gestión y control de facturas electrónicas con cumplimiento fiscal automatizado.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "hover:border-amber-400",
  },
  {
    icon: ClipboardCheck,
    title: "Tramitología",
    description: "Gestionamos todos tus trámites ante autoridades fiscales, laborales y gubernamentales.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "hover:border-emerald-400",
  },
  {
    icon: TrendingUp,
    title: "Consultoría Estratégica",
    description: "Análisis y planeación para el crecimiento sostenible de tu empresa con indicadores clave.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "hover:border-indigo-400",
  },
]

export function Services() {
  const scrollRef = useScrollAnimation()

  return (
    <section id="servicios" className="py-16 md:py-24 px-4 bg-muted/30 relative overflow-hidden" ref={scrollRef}>
      {/* Background decorator */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance scroll-hidden">Nuestros Servicios</h2>
          <p className="text-base md:text-xl text-muted-foreground leading-relaxed scroll-hidden stagger-1">
            Soluciones integrales diseñadas para empresas que buscan crecer con bases sólidas
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card
              key={index}
              className={`border-2 ${service.border} card-hover scroll-hidden stagger-${Math.min(index + 1, 6)} group ${index === services.length - 1 && services.length % 3 === 1 ? 'lg:col-start-2' : ''}`}
            >
              <CardHeader>
                <div className={`h-14 w-14 rounded-xl ${service.bg} flex items-center justify-center mb-4 icon-hover`}>
                  <service.icon className={`h-7 w-7 ${service.color}`} />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{service.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
