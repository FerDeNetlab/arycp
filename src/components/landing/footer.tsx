import Image from "next/image"
import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-4 bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/images/arycp-logo-symbol.png" alt="ARYCP Logo" width={48} height={36} className="object-contain" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">AR&CP</span>
                <span className="text-xs text-muted-foreground -mt-1">Soluciones Corporativas</span>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-md mb-4">
              Soluciones corporativas integrales para empresas en crecimiento. Asesoría jurídica, contable, fiscal y
              gestoría.
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <a href="tel:+523310949192" className="hover:text-primary transition-colors">+52 33 1094 9192</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <a href="mailto:contacto@arycp.com" className="hover:text-primary transition-colors">contacto@arycp.com</a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Guadalajara, Jalisco, México</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Enlaces</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="#servicios" className="text-muted-foreground hover:text-primary transition-colors nav-link">
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="#nosotros" className="text-muted-foreground hover:text-primary transition-colors nav-link">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link href="#contacto" className="text-muted-foreground hover:text-primary transition-colors nav-link">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-muted-foreground hover:text-primary transition-colors nav-link">
                  Acceder al Sistema
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/privacidad" className="text-muted-foreground hover:text-primary transition-colors nav-link">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-muted-foreground hover:text-primary transition-colors nav-link">
                  Términos
                </Link>
              </li>
            </ul>

            <a
              href="https://wa.me/523310949192"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ARYCP Soluciones Corporativas. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
