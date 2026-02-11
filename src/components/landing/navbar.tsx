import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50 animate-slide-down">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div style={{ height: '60px', width: '90px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
            <Image src="/images/arycp-logo.jpg" alt="ARYCP Logo" width={200} height={200} style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', width: '180%', height: 'auto', mixBlendMode: 'multiply' }} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">AR&CP</span>
            <span className="text-xs text-muted-foreground -mt-1">Soluciones Corporativas</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#servicios" className="text-sm font-medium hover:text-primary transition-colors nav-link">
            Servicios
          </Link>
          <Link href="#nosotros" className="text-sm font-medium hover:text-primary transition-colors nav-link">
            Nosotros
          </Link>
          <Link href="#contacto" className="text-sm font-medium hover:text-primary transition-colors nav-link">
            Contacto
          </Link>
        </div>

        <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
          <Link href="/auth/login">Acceder al Sistema</Link>
        </Button>
      </div>
    </nav>
  )
}
