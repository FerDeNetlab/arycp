import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center mb-4">
            <Link href="/">
              <Image src="/images/arycp-logo.jpg" alt="ARYCP Logo" width={180} height={60} className="h-16 w-auto" />
            </Link>
          </div>

          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">¡Cuenta creada exitosamente!</CardTitle>
              <CardDescription>Revisa tu correo para confirmar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Te hemos enviado un correo de confirmación. Por favor, revisa tu bandeja de entrada y haz clic en el
                enlace para activar tu cuenta antes de iniciar sesión.
              </p>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/auth/login">Ir a Iniciar Sesión</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
