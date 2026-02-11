"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Mail, Building2, Clock, Eye, EyeOff, MessageSquare } from "lucide-react"

interface Message {
    id: string
    name: string
    email: string
    company: string | null
    message: string
    is_read: boolean
    created_at: string
}

export function MessagesList({
    messages,
    onUpdate,
}: {
    messages: Message[]
    onUpdate: () => void
}) {
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

    async function toggleRead(id: string, currentStatus: boolean) {
        try {
            await fetch("/api/messages", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, is_read: !currentStatus }),
            })
            onUpdate()
        } catch (err) {
            console.error("Error updating message:", err)
        }
    }

    async function openMessage(msg: Message) {
        setSelectedMessage(msg)
        // Auto-mark as read when opening
        if (!msg.is_read) {
            try {
                await fetch("/api/messages", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: msg.id, is_read: true }),
                })
                onUpdate()
            } catch (err) {
                console.error("Error marking as read:", err)
            }
        }
    }

    function formatDate(dateStr: string) {
        const date = new Date(dateStr)
        return date.toLocaleDateString("es-MX", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    if (messages.length === 0) {
        return (
            <div className="text-center py-16">
                <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No hay mensajes aún</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Los mensajes del formulario de contacto aparecerán aquí
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-3">
                {messages.map((msg) => (
                    <Card
                        key={msg.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${!msg.is_read
                                ? "border-l-4 border-l-violet-500 bg-violet-50/30"
                                : "opacity-80"
                            }`}
                        onClick={() => openMessage(msg)}
                    >
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3
                                            className={`font-semibold truncate ${!msg.is_read ? "text-foreground" : "text-muted-foreground"
                                                }`}
                                        >
                                            {msg.name}
                                        </h3>
                                        {!msg.is_read && (
                                            <Badge className="bg-violet-500 text-white text-xs">Nuevo</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                        <span className="flex items-center gap-1">
                                            <Mail className="h-3.5 w-3.5" />
                                            {msg.email}
                                        </span>
                                        {msg.company && (
                                            <span className="flex items-center gap-1">
                                                <Building2 className="h-3.5 w-3.5" />
                                                {msg.company}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {msg.message}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(msg.created_at)}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            toggleRead(msg.id, msg.is_read)
                                        }}
                                        title={msg.is_read ? "Marcar como no leído" : "Marcar como leído"}
                                    >
                                        {msg.is_read ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-violet-600" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-violet-600" />
                            Mensaje de {selectedMessage?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedMessage && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase mb-1">Email</p>
                                    <a
                                        href={`mailto:${selectedMessage.email}`}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        {selectedMessage.email}
                                    </a>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase mb-1">Empresa</p>
                                    <p className="text-sm">{selectedMessage.company || "No especificada"}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase mb-1">Fecha</p>
                                <p className="text-sm">{formatDate(selectedMessage.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase mb-2">Mensaje</p>
                                <div className="bg-muted/50 rounded-lg p-4 border">
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                        {selectedMessage.message}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleRead(selectedMessage.id, selectedMessage.is_read)}
                                >
                                    {selectedMessage.is_read ? (
                                        <>
                                            <EyeOff className="h-4 w-4 mr-2" />
                                            Marcar no leído
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Marcar leído
                                        </>
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => (window.location.href = `mailto:${selectedMessage.email}`)}
                                >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Responder
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
