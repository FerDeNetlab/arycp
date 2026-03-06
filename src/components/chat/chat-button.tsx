"use client"

import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ChatPanel } from "./chat-panel"
import { cn } from "@/lib/utils"

// Softer, lower-pitched sound for chat (distinct from notification chime)
function playChatSound() {
    try {
        const ctx = new AudioContext()
        const playTone = (freq: number, start: number, dur: number) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = freq
            osc.type = "sine"
            gain.gain.setValueAtTime(0.2, ctx.currentTime + start)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur)
            osc.start(ctx.currentTime + start)
            osc.stop(ctx.currentTime + start + dur)
        }
        playTone(600, 0, 0.12)
        playTone(800, 0.12, 0.12)
        playTone(600, 0.24, 0.15)
    } catch {
        // AudioContext not available
    }
}

function showChatBrowserNotification(senderName: string, message: string) {
    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission !== "granted") return

    const notif = new window.Notification(`💬 ${senderName}`, {
        body: message.length > 80 ? message.slice(0, 80) + "…" : message,
        icon: "/favicon.ico",
        tag: "arycp-chat-" + Date.now(),
    })

    notif.onclick = () => {
        window.focus()
        notif.close()
    }
}

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
        let cancelled = false
        async function load() {
            try {
                const res = await fetch("/api/chat/conversations")
                const data = await res.json()
                if (!cancelled && res.ok && data.data) {
                    const total = (data.data as { unreadCount: number }[]).reduce(
                        (sum, c) => sum + c.unreadCount, 0
                    )
                    setUnreadCount(total)
                }
            } catch {
                // Silent fail
            }
        }
        load()
        return () => { cancelled = true }
    }, [])

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
                    // If message is from someone else and chat is closed, bump count + alert
                    const msg = payload.new as { sender_id: string; content?: string; sender_name?: string }
                    if (msg.sender_id !== currentUserId && !open) {
                        setUnreadCount(prev => prev + 1)
                        playChatSound()
                        showChatBrowserNotification(
                            msg.sender_name || "Nuevo mensaje",
                            msg.content || "Tienes un nuevo mensaje"
                        )
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
