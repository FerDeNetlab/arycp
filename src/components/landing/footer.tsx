import Image from "next/image"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/images/arycp-logo.jpg" alt="ARYCP Logo" width={50} height={50} className="h-12 w-12" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">AR&CP</span>
                <span className="text-xs text-muted-foreground -mt-1">Soluciones Corporativas</span>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              Soluciones corporativas integrales para empresas en crecimiento. Asesoría jurídica, contable, fiscal y
              gestoría.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Enlaces</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#servicios" className="text-muted-foreground hover:text-primary transition-colors">
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="#nosotros" className="text-muted-foreground hover:text-primary transition-colors">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link href="#contacto" className="text-muted-foreground hover:text-primary transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacidad" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-muted-foreground hover:text-primary transition-colors">
                  Términos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ARYCP Soluciones Corporativas. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
