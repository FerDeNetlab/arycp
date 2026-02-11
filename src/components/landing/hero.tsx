import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative pt-32 pb-24 px-4 overflow-hidden">
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

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-balance animate-fade-in-up delay-1">
              Soluciones Corporativas para{" "}
              <span className="gradient-text">PYMEs en Crecimiento</span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed animate-fade-in-up delay-2">
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

          <div className="relative animate-fade-in-right delay-3">
            {/* Decorative shapes */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-2xl rotate-12 animate-float"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-secondary/20 rounded-xl -rotate-12 animate-float delay-2"></div>
            <div className="absolute top-1/2 -right-3 w-8 h-8 bg-primary/30 rounded-full animate-float delay-4"></div>

            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 relative">
              <img
                src="/images/office-bg.jpg"
                alt="Equipo de trabajo ARYCP"
                className="object-cover w-full h-full"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
