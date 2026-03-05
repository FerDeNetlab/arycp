"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ChatPanel } from "./chat-panel"
import { cn } from "@/lib/utils"

export function ChatButton({ currentUserId }: { currentUserId: string }) {
    const [open, setOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    const loadUnreadCount = useCallback(async () => {
        try {
            const res = await fetch("/api/chat/conversations")
            const data = await res.json()
            if (res.ok && data.data) {
                const total = (data.data as { unreadCount: number }[]).reduce(
                    (sum, c) => sum + c.unreadCount, 0
                )
                setUnreadCount(total)
            }
        } catch {
            // Silent fail
        }
    }, [])

    useEffect(() => {
        loadUnreadCount()
    }, [loadUnreadCount])

    // Realtime: listen for new messages to update badge
    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel("chat-unread-badge")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                },
                (payload) => {
                    // If message is from someone else and chat is closed, bump count
                    const msg = payload.new as { sender_id: string }
                    if (msg.sender_id !== currentUserId && !open) {
                        setUnreadCount(prev => prev + 1)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [currentUserId, open])

    // When panel closes, refresh unread
    function handleClose() {
        setOpen(false)
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
