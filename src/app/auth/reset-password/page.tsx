"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres")
            return
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden")
            return
        }

        setIsLoading(true)

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({
                password,
            })

            if (error) throw error

            setSuccess(true)
            setTimeout(() => {
                router.push("/auth/login")
            }, 3000)
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "Error al cambiar la contraseña")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
                <div className="w-full max-w-sm">
                    <Card className="border">
                        <CardContent className="p-8 text-center">
                            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                            <h2 className="text-xl font-bold mb-2">¡Contraseña actualizada!</h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                Tu contraseña ha sido cambiada exitosamente. Serás redirigido al login...
                            </p>
                            <Link href="/auth/login">
                                <Button className="w-full">Ir al Login</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">AR&CP</div>
                        <div className="text-sm text-muted-foreground">Restablecer Contraseña</div>
                    </div>

                    <Card className="border">
                        <CardHeader className="text-center">
                            <CardTitle className="text-xl">Nueva Contraseña</CardTitle>
                            <CardDescription>Ingresa tu nueva contraseña</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleReset}>
                                <div className="flex flex-col gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Nueva Contraseña</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            placeholder="Mínimo 6 caracteres"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            required
                                            placeholder="Repite la contraseña"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                    {error && (
                                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                                            {error}
                                        </div>
                                    )}
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? "Actualizando..." : "Cambiar Contraseña"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="text-center">
                        <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            ← Volver al login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
