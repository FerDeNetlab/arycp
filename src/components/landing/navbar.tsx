"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50 animate-slide-down">
      <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 md:gap-3 group">
          <div className="logo-shine animate-logo">
            <Image src="/images/arycp-logo-symbol.png" alt="ARYCP Logo" width={50} height={50} className="md:w-[75px] md:h-[75px]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors">AR&CP</span>
            <span className="text-[10px] md:text-xs text-muted-foreground -mt-1">Soluciones Corporativas</span>
          </div>
        </Link>

        {/* Desktop nav */}
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

        <div className="flex items-center gap-2">
          <Button asChild className="hidden md:inline-flex bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
            <Link href="/auth/login">Acceder al Sistema</Link>
          </Button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Abrir menú"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md animate-slide-down">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            <Link
              href="#servicios"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium py-2 px-3 rounded-lg hover:bg-accent transition-colors"
            >
              Servicios
            </Link>
            <Link
              href="#nosotros"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium py-2 px-3 rounded-lg hover:bg-accent transition-colors"
            >
              Nosotros
            </Link>
            <Link
              href="#contacto"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium py-2 px-3 rounded-lg hover:bg-accent transition-colors"
            >
              Contacto
            </Link>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 mt-2">
              <Link href="/auth/login">Acceder al Sistema</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
