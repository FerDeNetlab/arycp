import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block">
              <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                Asesoría Integral Empresarial
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-balance">
              Soluciones Corporativas para <span className="text-primary">PYMEs en Crecimiento</span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Despacho contable especializado en asesoría jurídica, contable, fiscal y gestoría. Te ayudamos a navegar
              los aspectos empresariales con poca educación pública disponible.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Asesoría contable y fiscal completa</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Gestoría y tramitología empresarial</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Soporte jurídico especializado</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg" asChild>
                <Link href="#contacto">Contáctanos</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
              <img
                src="/images/arycp-logo.jpg"
                alt="ARYCP Soluciones Corporativas"
                className="object-contain w-3/4 h-3/4 rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
