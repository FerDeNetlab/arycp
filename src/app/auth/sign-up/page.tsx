"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignUpPage() {
  const router = useRouter()

  useEffect(() => {
    // Public registration is disabled — redirect to login
    router.replace("/auth/login")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Redirigiendo...</p>
    </div>
  )
}
