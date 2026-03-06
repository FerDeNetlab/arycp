"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { MessageCircle } from "lucide-react"
import { ChatPanel } from "./chat-panel"
import { cn } from "@/lib/utils"

const POLL_INTERVAL = 8000 // Check for new messages every 8 seconds

export function ChatButton({ currentUserId }: { currentUserId: string }) {
    const [open, setOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const prevUnreadRef = useRef(0)

    const loadUnreadCount = useCallback(async () => {
        try {
            const res = await fetch("/api/chat/conversations")
            const data = await res.json()
            if (res.ok && data.data) {
                const total = (data.data as { unreadCount: number }[]).reduce(
                    (sum, c) => sum + c.unreadCount, 0
                )
                // Play sound if unread count increased (new messages)
                if (total > prevUnreadRef.current && prevUnreadRef.current >= 0) {
                    try {
                        import("@/lib/browser-notifications").then(mod => {
                            mod.playChatSound()
                            mod.showBrowserNotification("💬 Nuevo mensaje", "Tienes un nuevo mensaje de chat")
                        }).catch(() => { })
                    } catch { /* silent */ }
                }
                prevUnreadRef.current = total
                setUnreadCount(total)
            }
        } catch {
            // Silent fail
        }
    }, [])

    // Initial load
    useEffect(() => {
        // Set to -1 so the first load doesn't trigger sound
        prevUnreadRef.current = -1
        loadUnreadCount().then(() => {
            // After first load, start tracking increases
            // prevUnreadRef is already set inside loadUnreadCount
        })
    }, [loadUnreadCount])

    // Poll for new messages (replaces broken Supabase Realtime for chat_messages)
    useEffect(() => {
        if (open) return // Don't poll while chat is open
        const interval = setInterval(loadUnreadCount, POLL_INTERVAL)
        return () => clearInterval(interval)
    }, [open, loadUnreadCount])

    // When panel closes, refresh unread
    function handleClose() {
        setOpen(false)
        prevUnreadRef.current = 0
        setTimeout(loadUnreadCount, 500)
    }

    return (
        <>
            <button
                onClick={() => setOpen(!open)}
                className={cn(
                    "relative flex items-center gap-2 px-2 md:px-3 py-2 text-sm rounded-lg transition-colors",
                    open
                        ? "text-indigo-600 bg-indigo-50"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                title="Chat"
            >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 animate-in zoom-in duration-200">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {typeof document !== "undefined" && createPortal(
                <ChatPanel
                    open={open}
                    onClose={handleClose}
                    currentUserId={currentUserId}
                />,
                document.body
            )}
        </>
    )
}
