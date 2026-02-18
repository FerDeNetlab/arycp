import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { AuthRedirectHandler } from "@/components/auth/auth-redirect-handler"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ARYCP - Soluciones Corporativas",
  description: "Asesoría integral jurídica, contable, fiscal y gestoría para PYMEs y empresas en crecimiento",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans antialiased`}>
        <AuthRedirectHandler />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
