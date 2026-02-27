"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, Check, Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AssignToSelectorProps {
    entityType: "procedure" | "fiscal_obligation" | "legal_process"
    entityId: string
    module?: string
    currentAssignedTo?: string
    currentAssignedToName?: string
    onAssigned?: (userId: string, userName: string) => void
}

interface SystemUser {
    id: string
    auth_user_id: string
    full_name: string
    role: string
}

export function AssignToSelector({
    entityType,
    entityId,
    module,
    currentAssignedTo,
    currentAssignedToName,
    onAssigned,
}: AssignToSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [users, setUsers] = useState<SystemUser[]>([])
    const [loading, setLoading] = useState(false)
    const [assigning, setAssigning] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (isOpen && users.length === 0) {
            loadUsers()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    async function loadUsers() {
        setLoading(true)
        try {
            const res = await fetch("/api/users/contadores")
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)
            setUsers(result.data || [])
        } catch (err) {
            console.error("Error loading users:", err)
        } finally {
            setLoading(false)
        }
    }

    async function assignTo(user: SystemUser) {
        setAssigning(true)
        try {
            const res = await fetch("/api/activity/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entityType,
                    entityId,
                    assignToUserId: user.auth_user_id,
                    module,
                }),
            })

            const result = await res.json()

            if (!res.ok) throw new Error(result.error)

            toast({
                title: "Asignado exitosamente",
                description: `Se asignó a ${user.full_name}`,
            })

            onAssigned?.(user.auth_user_id, user.full_name)
            setIsOpen(false)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            toast({
                title: "Error al asignar",
                description: err.message,
                variant: "destructive",
            })
        } finally {
            setAssigning(false)
        }
    }

    return (
        <div className="relative">
            {/* Current assignment or assign button */}
            {currentAssignedToName ? (
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <UserPlus className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-blue-700 font-medium">{currentAssignedToName}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        Reasignar
                    </Button>
                </div>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <UserPlus className="h-3.5 w-3.5" />
                    Asignar a
                </Button>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-background border-2 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                        <span className="text-xs font-semibold">Seleccionar contador</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsOpen(false)}>
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : users.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">No hay contadores disponibles</p>
                        ) : (
                            users.map((user) => (
                                <button
                                    key={user.id}
                                    className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors text-left ${user.auth_user_id === currentAssignedTo ? "bg-primary/5" : ""
                                        }`}
                                    onClick={() => assignTo(user)}
                                    disabled={assigning}
                                >
                                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold text-primary">
                                            {user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{user.full_name}</p>
                                        <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
                                    </div>
                                    {user.auth_user_id === currentAssignedTo && (
                                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
