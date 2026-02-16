"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare } from "lucide-react"
import Link from "next/link"
import { MessagesList } from "@/components/messages/messages-list"

export default function MessagesPage() {
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const router = useRouter()

    useEffect(() => {
        fetchMessages()
    }, [])

    async function fetchMessages() {
        try {
            const response = await fetch("/api/messages")
            const data = await response.json()

            if (!response.ok) {
                if (response.status === 401) {
                    router.push("/auth/login")
                    return
                }
                setError(data.error || "Error al cargar mensajes")
                setLoading(false)
                return
            }

            setMessages(data.messages || [])
            setLoading(false)
        } catch (err) {
            console.error("Error fetching messages:", err)
            setError("Error de conexión")
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Mensajes de Contacto</h1>
                        <p className="text-sm text-muted-foreground">
                            Mensajes recibidos desde el formulario de contacto
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-violet-600" />
                    <span className="text-sm font-medium text-muted-foreground">
                        {messages.filter((m) => !m.is_read).length} sin leer
                    </span>
                </div>
            </div>

            {loading && (
                <p className="text-center text-muted-foreground">Cargando mensajes...</p>
            )}
            {error && <p className="text-center text-destructive">{error}</p>}
            {!loading && !error && (
                <MessagesList messages={messages} onUpdate={fetchMessages} />
            )}
        </div>
    )
}
