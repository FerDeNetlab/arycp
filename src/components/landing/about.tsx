import { Card, CardContent } from "@/components/ui/card"
import { Award, Target, Heart } from "lucide-react"

export function About() {
  return (
    <section id="nosotros" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              <img src="/modern-office-workspace.jpg" alt="Oficinas ARYCP" className="object-cover w-full h-full" />
            </div>
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <div>
              <h2 className="text-4xl font-bold mb-4 text-balance">Quiénes Somos</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ARYCP Soluciones Corporativas es un despacho contable especializado en brindar asesoría integral a
                empresas en etapas de crecimiento. Entendemos que hay aspectos empresariales con poca educación
                disponible, y estamos aquí para guiarte.
              </p>
            </div>

            <div className="space-y-6">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="flex gap-4 p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Nuestra Misión</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Empoderar a las PYMEs con conocimiento y herramientas para tomar decisiones informadas en aspectos
                      legales, contables y fiscales.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-secondary">
                <CardContent className="flex gap-4 p-6">
                  <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Award className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Nuestra Experiencia</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Años de experiencia ayudando a empresas a navegar la complejidad regulatoria y administrativa del
                      entorno empresarial mexicano.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-accent">
                <CardContent className="flex gap-4 p-6">
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Nuestro Compromiso</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Servicio personalizado y cercano. Tu éxito es nuestro éxito, trabajamos contigo como un aliado
                      estratégico de largo plazo.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
