import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, ArrowRight, Users, TrendingUp, Shield } from "lucide-react"

export function Hero() {
  return (
    <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 px-4 overflow-hidden">
      {/* Background decorators */}
      <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block animate-fade-in-up">
              <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
                ✦ Asesoría Integral Empresarial
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance animate-fade-in-up delay-1">
              Soluciones Corporativas para{" "}
              <span className="gradient-text">PYMEs en Crecimiento</span>
            </h1>

            <p className="text-base md:text-xl text-muted-foreground leading-relaxed animate-fade-in-up delay-2">
              Despacho contable especializado en asesoría jurídica, contable, fiscal y gestoría. Te ayudamos a navegar
              los aspectos empresariales con poca educación pública disponible.
            </p>

            <div className="space-y-3 animate-fade-in-up delay-3">
              {[
                "Asesoría contable y fiscal completa",
                "Gestoría y tramitología empresarial",
                "Soporte jurídico especializado",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-in-up delay-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg group" asChild>
                <Link href="#contacto">
                  Contáctanos
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg border-2" asChild>
                <Link href="#servicios">Ver Servicios</Link>
              </Button>
            </div>
          </div>

          <div className="relative animate-fade-in-right delay-3 mx-4 lg:mx-0">
            {/* Decorative shapes — hidden on mobile to avoid overflow */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-2xl rotate-12 animate-float hidden lg:block"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-secondary/20 rounded-xl -rotate-12 animate-float delay-2 hidden lg:block"></div>
            <div className="absolute top-1/2 -right-3 w-8 h-8 bg-primary/30 rounded-full animate-float delay-4 hidden lg:block"></div>

            {/* Main image with premium frame */}
            <div className="relative group">
              {/* Glow effect behind the image */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500 opacity-60 group-hover:opacity-100"></div>

              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20">
                <img
                  src="/images/office-bg.jpg"
                  alt="Equipo de trabajo ARYCP"
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
                {/* Brand color overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent mix-blend-overlay"></div>
              </div>

              {/* Floating stat cards */}
              <div className="absolute bottom-3 left-3 lg:-bottom-5 lg:-left-5 bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-3 lg:p-4 flex items-center gap-2 lg:gap-3 animate-fade-in-up delay-4 border border-white/50 hover:shadow-xl transition-shadow">
                <div className="h-9 w-9 lg:h-11 lg:w-11 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg lg:text-2xl font-bold text-foreground leading-none">100+</p>
                  <p className="text-[10px] lg:text-xs text-muted-foreground">Clientes activos</p>
                </div>
              </div>

              <div className="absolute top-3 right-3 lg:-top-4 lg:-right-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-3 lg:p-4 flex items-center gap-2 lg:gap-3 animate-fade-in-up delay-5 border border-white/50 hover:shadow-xl transition-shadow">
                <div className="h-9 w-9 lg:h-11 lg:w-11 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg lg:text-2xl font-bold text-foreground leading-none">15+</p>
                  <p className="text-[10px] lg:text-xs text-muted-foreground">Años experiencia</p>
                </div>
              </div>

              <div className="absolute bottom-3 right-3 lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2 lg:-right-6 bg-white/95 backdrop-blur-md rounded-xl shadow-lg px-3 py-2 lg:px-4 lg:py-3 flex items-center gap-2 animate-fade-in-up delay-6 border border-white/50 hover:shadow-xl transition-shadow hidden sm:flex">
                <div className="h-8 w-8 lg:h-9 lg:w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-base lg:text-lg font-bold text-foreground leading-none">99%</p>
                  <p className="text-[10px] text-muted-foreground">Satisfacción</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
