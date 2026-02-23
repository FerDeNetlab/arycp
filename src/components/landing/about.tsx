"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Award, Target, Heart, Building2, Handshake } from "lucide-react"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

export function About() {
  const scrollRef = useScrollAnimation()

  return (
    <section id="nosotros" className="py-16 md:py-24 px-4 relative overflow-hidden" ref={scrollRef}>
      {/* Background decorator */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1 scroll-hidden-left mx-4 lg:mx-0">
            {/* Image composition */}
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-2 bg-gradient-to-br from-primary/15 via-transparent to-blue-500/15 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-all duration-500"></div>

              {/* Main image */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20">
                <img
                  src="/images/meeting-bg.jpg"
                  alt="Equipo ARYCP en reunión"
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent mix-blend-overlay"></div>

                {/* Bottom overlay text */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-white/90 text-sm font-medium tracking-wide uppercase">
                    Despacho AR&CP
                  </p>
                  <p className="text-white text-lg font-semibold">
                    Tu aliado estratégico empresarial
                  </p>
                </div>
              </div>

              {/* Floating badge — top left */}
              <div className="absolute top-3 left-3 lg:-top-4 lg:-left-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg px-3 py-2 lg:px-4 lg:py-3 flex items-center gap-2 lg:gap-3 border border-white/50 animate-fade-in-up delay-2 hover:shadow-xl transition-shadow">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm font-bold text-foreground leading-none">Guadalajara</p>
                  <p className="text-[10px] lg:text-[11px] text-muted-foreground">Jalisco, México</p>
                </div>
              </div>

              {/* Floating badge — bottom right */}
              <div className="absolute bottom-3 right-3 lg:-bottom-4 lg:-right-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg px-3 py-2 lg:px-4 lg:py-3 flex items-center gap-2 lg:gap-3 border border-white/50 animate-fade-in-up delay-3 hover:shadow-xl transition-shadow">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Handshake className="h-4 w-4 lg:h-5 lg:w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm font-bold text-foreground leading-none">Atención</p>
                  <p className="text-[10px] lg:text-[11px] text-muted-foreground">Personalizada</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <div className="scroll-hidden">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Quiénes Somos</h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
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
                  iconBg: "bg-primary/10",
                  iconColor: "text-primary",
                },
                {
                  icon: Award,
                  title: "Nuestra Experiencia",
                  text: "Años de experiencia ayudando a empresas a navegar la complejidad regulatoria y administrativa del entorno empresarial mexicano.",
                  color: "border-l-blue-500",
                  iconBg: "bg-blue-100",
                  iconColor: "text-blue-600",
                },
                {
                  icon: Heart,
                  title: "Nuestro Compromiso",
                  text: "Servicio personalizado y cercano. Tu éxito es nuestro éxito, trabajamos contigo como un aliado estratégico de largo plazo.",
                  color: "border-l-emerald-500",
                  iconBg: "bg-emerald-100",
                  iconColor: "text-emerald-600",
                },
              ].map((item, i) => (
                <Card
                  key={i}
                  className={`border-l-4 ${item.color} card-hover glass scroll-hidden stagger-${i + 2} group/card`}
                >
                  <CardContent className="flex gap-4 p-6">
                    <div className={`h-12 w-12 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0 icon-hover group-hover/card:scale-110 transition-transform`}>
                      <item.icon className={`h-6 w-6 ${item.iconColor}`} />
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
