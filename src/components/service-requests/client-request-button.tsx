"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { RequestForm } from "./request-form"

interface ClientRequestButtonProps {
    module: string
    clientId: string
    clientName: string
    label?: string
    onSuccess?: () => void
}

export function ClientRequestButton({
    module,
    clientId,
    clientName,
    label = "Solicitar Servicio",
    onSuccess,
}: ClientRequestButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                size="sm"
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
            >
                <Send className="h-3.5 w-3.5" />
                {label}
            </Button>
            <RequestForm
                open={open}
                onClose={() => setOpen(false)}
                module={module}
                clientId={clientId}
                clientName={clientName}
                onSuccess={onSuccess}
            />
        </>
    )
}
