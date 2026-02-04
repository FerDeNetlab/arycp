import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Scale, Calculator, FileText, ClipboardCheck, Users, TrendingUp } from "lucide-react"

const services = [
  {
    icon: Calculator,
    title: "Contabilidad",
    description:
      "Llevamos tu contabilidad al día con reportes mensuales y asesoría personalizada para la toma de decisiones financieras.",
  },
  {
    icon: FileText,
    title: "Asesoría Fiscal",
    description:
      "Te ayudamos a cumplir con tus obligaciones fiscales optimizando tu carga tributaria de manera legal y eficiente.",
  },
  {
    icon: Scale,
    title: "Servicios Jurídicos",
    description: "Asesoría legal corporativa, revisión de contratos y representación en temas empresariales complejos.",
  },
  {
    icon: ClipboardCheck,
    title: "Gestoría",
    description: "Gestionamos todos tus trámites ante autoridades fiscales, laborales y gubernamentales.",
  },
  {
    icon: Users,
    title: "Recursos Humanos",
    description: "Administración de nómina, contratos laborales y cumplimiento de obligaciones patronales.",
  },
  {
    icon: TrendingUp,
    title: "Consultoría Estratégica",
    description: "Análisis y planeación para el crecimiento sostenible de tu empresa con indicadores clave.",
  },
]

export function Services() {
  return (
    <section id="servicios" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold mb-4 text-balance">Nuestros Servicios</h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Soluciones integrales diseñadas para empresas que buscan crecer con bases sólidas
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
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
