"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Award, Target, Heart } from "lucide-react"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export function About() {
  const scrollRef = useScrollAnimation()

  return (
    <section id="nosotros" className="py-24 px-4 relative overflow-hidden" ref={scrollRef}>
      {/* Background decorator */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1 scroll-hidden-left">
            {/* Decorative frame */}
            <div className="absolute -top-4 -left-4 w-full h-full rounded-2xl border-2 border-primary/20 -z-10"></div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
              <img src="/images/meeting-bg.jpg" alt="Equipo ARYCP en reunión" className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <div className="scroll-hidden">
              <h2 className="text-4xl font-bold mb-4 text-balance">Quiénes Somos</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ARYCP Soluciones Corporativas es un despacho contable especializado en brindar asesoría integral a
                empresas en etapas de crecimiento. Entendemos que hay aspectos empresariales con poca educación
                disponible, y estamos aquí para guiarte.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: Target,
                  title: "Nuestra Misión",
                  text: "Empoderar a las PYMEs con conocimiento y herramientas para tomar decisiones informadas en aspectos legales, contables y fiscales.",
                  color: "border-l-primary",
                },
                {
                  icon: Award,
                  title: "Nuestra Experiencia",
                  text: "Años de experiencia ayudando a empresas a navegar la complejidad regulatoria y administrativa del entorno empresarial mexicano.",
                  color: "border-l-blue-500",
                },
                {
                  icon: Heart,
                  title: "Nuestro Compromiso",
                  text: "Servicio personalizado y cercano. Tu éxito es nuestro éxito, trabajamos contigo como un aliado estratégico de largo plazo.",
                  color: "border-l-emerald-500",
                },
              ].map((item, i) => (
                <Card
                  key={i}
                  className={`border-l-4 ${item.color} card-hover glass scroll-hidden stagger-${i + 2}`}
                >
                  <CardContent className="flex gap-4 p-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 icon-hover">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
