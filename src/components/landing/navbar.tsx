import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/images/arycp-logo.jpg" alt="ARYCP Logo" width={50} height={50} className="h-12 w-12" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground">AR&CP</span>
            <span className="text-xs text-muted-foreground -mt-1">Soluciones Corporativas</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#servicios" className="text-sm font-medium hover:text-primary transition-colors">
            Servicios
          </Link>
          <Link href="#nosotros" className="text-sm font-medium hover:text-primary transition-colors">
            Nosotros
          </Link>
          <Link href="#contacto" className="text-sm font-medium hover:text-primary transition-colors">
            Contacto
          </Link>
        </div>

        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/auth/login">Acceder al Sistema</Link>
        </Button>
      </div>
    </nav>
  )
}
