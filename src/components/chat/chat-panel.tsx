"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    MessageSquare,
    Send,
    ArrowLeft,
    Search,
    X,
    Users,
    Check,
    CheckCheck,
    Smile,
    Sticker,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { EmojiPicker } from "@/components/chat/emoji-picker-wrapper"
import {
    STICKERS,
    STICKER_CATEGORIES,
    isSticker,
    getStickerFromContent,
    stickerToContent,
} from "@/lib/chat/stickers"

type ChatUser = {
    id: string
    name: string
    role: string
    initials: string
}

type Conversation = {
    id: string
    otherUser: ChatUser
    lastMessage: {
        content: string
        isOwn: boolean
        created_at: string
    } | null
    unreadCount: number
    last_message_at: string
}

type Message = {
    id: string
    sender_id: string
    content: string
    is_read: boolean
    created_at: string
}

function formatTime(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
        return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
        return "Ayer"
    } else if (diffDays < 7) {
        return date.toLocaleDateString("es-MX", { weekday: "short" })
    }
    return date.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })
}

function formatMessageTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
}

const roleColors: Record<string, string> = {
    admin: "bg-amber-500",
    contador: "bg-indigo-500",
}

// Format last message preview (handle stickers)
function formatLastMessage(content: string, isOwn: boolean): string {
    const prefix = isOwn ? "Tú: " : ""
    if (isSticker(content)) {
        const sticker = getStickerFromContent(content)
        return prefix + (sticker ? `${sticker.emoji} ${sticker.label}` : "Sticker")
    }
    return prefix + content
}

export function ChatPanel({
    open,
    onClose,
    currentUserId,
}: {
    open: boolean
    onClose: () => void
    currentUserId: string
}) {
    const [view, setView] = useState<"conversations" | "chat" | "newChat">("conversations")
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([])
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
    const [newMessage, setNewMessage] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showStickerPicker, setShowStickerPicker] = useState(false)
    const [activeCategory, setActiveCategory] = useState(STICKER_CATEGORIES[0].id)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const emojiPickerRef = useRef<HTMLDivElement>(null)
    const stickerPickerRef = useRef<HTMLDivElement>(null)

    // Close pickers on click outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
                setShowEmojiPicker(false)
            }
            if (stickerPickerRef.current && !stickerPickerRef.current.contains(e.target as Node)) {
                setShowStickerPicker(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Load conversations
    const loadConversations = useCallback(async () => {
        try {
            const res = await fetch("/api/chat/conversations")
            const data = await res.json()
            if (res.ok) setConversations(data.data || [])
        } catch (err) {
            console.error("Error loading conversations:", err)
        }
    }, [])

    useEffect(() => {
        if (open) loadConversations()
    }, [open, loadConversations])

    // Load messages for active conversation
    const loadMessages = useCallback(async (conversationId: string) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
            const data = await res.json()
            if (res.ok) setMessages(data.data || [])
            // Mark as read
            await fetch("/api/chat/messages", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId }),
            })
        } catch (err) {
            console.error("Error loading messages:", err)
        } finally {
            setLoading(false)
        }
    }, [])

    // Realtime subscription
    useEffect(() => {
        if (!activeConversation) return

        const supabase = createClient()
        const channel = supabase
            .channel(`chat-${activeConversation.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                    filter: `conversation_id=eq.${activeConversation.id}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message
                    if (newMsg.sender_id === currentUserId) {
                        // Replace the optimistic temp message with the real one
                        setMessages(prev => {
                            const withoutTemp = prev.filter(m => !m.id.startsWith("temp-"))
                            return [...withoutTemp, newMsg]
                        })
                    } else {
                        // Message from other user — add it
                        setMessages(prev => [...prev, newMsg])
                        // Mark as read
                        fetch("/api/chat/messages", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ conversationId: activeConversation.id }),
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [activeConversation, currentUserId])

    // Also subscribe to all conversations for unread updates
    useEffect(() => {
        if (!open || view === "chat") return

        const supabase = createClient()
        const channel = supabase
            .channel("chat-global")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                },
                () => {
                    // Refresh conversation list when any new message comes in
                    loadConversations()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [open, view, loadConversations])

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Open a conversation
    function openConversation(conv: Conversation) {
        setActiveConversation(conv)
        setView("chat")
        loadMessages(conv.id)
    }

    // Start new conversation
    async function startNewChat(otherUserId: string) {
        try {
            const res = await fetch("/api/chat/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otherUserId }),
            })
            const data = await res.json()
            if (res.ok && data.conversationId) {
                const otherUser = availableUsers.find(u => u.id === otherUserId)
                const newConv: Conversation = {
                    id: data.conversationId,
                    otherUser: otherUser || { id: otherUserId, name: "Usuario", role: "", initials: "U" },
                    lastMessage: null,
                    unreadCount: 0,
                    last_message_at: new Date().toISOString(),
                }
                setActiveConversation(newConv)
                setView("chat")
                setMessages([])
                setTimeout(() => inputRef.current?.focus(), 100)
            }
        } catch (err) {
            console.error("Error starting conversation:", err)
        }
    }

    // Send message (text or sticker)
    async function sendMessageContent(content: string) {
        if (!content.trim() || !activeConversation) return

        // Close pickers
        setShowEmojiPicker(false)
        setShowStickerPicker(false)

        // Optimistic update
        const optimistic: Message = {
            id: `temp-${Date.now()}`,
            sender_id: currentUserId,
            content,
            is_read: false,
            created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, optimistic])

        try {
            await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId: activeConversation.id, content }),
            })
        } catch (err) {
            console.error("Error sending message:", err)
        }
    }

    // Send text message from form
    async function sendMessage(e: React.FormEvent) {
        e.preventDefault()
        if (!newMessage.trim()) return
        const content = newMessage.trim()
        setNewMessage("")
        await sendMessageContent(content)
    }

    // Send sticker
    async function sendSticker(stickerId: string) {
        await sendMessageContent(stickerToContent(stickerId))
    }

    // Handle emoji selection
    function onEmojiSelect(emoji: string) {
        setNewMessage(prev => prev + emoji)
        setShowEmojiPicker(false)
        inputRef.current?.focus()
    }

    // Load users for new chat
    async function loadAvailableUsers() {
        try {
            const res = await fetch("/api/chat/users")
            const data = await res.json()
            if (res.ok) setAvailableUsers(data.data || [])
        } catch (err) {
            console.error("Error loading users:", err)
        }
    }

    function goToNewChat() {
        loadAvailableUsers()
        setSearchQuery("")
        setView("newChat")
    }

    function goBack() {
        setView("conversations")
        setActiveConversation(null)
        setMessages([])
        setShowEmojiPicker(false)
        setShowStickerPicker(false)
        loadConversations()
    }

    const filteredUsers = availableUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

    if (!open) return null

    // Render message content (text vs sticker)
    function renderMessageContent(content: string, isOwn: boolean) {
        if (isSticker(content)) {
            const sticker = getStickerFromContent(content)
            if (sticker) {
                return (
                    <div className="flex flex-col items-center py-1">
                        <span className="text-5xl leading-none">{sticker.emoji}</span>
                        <span className={cn(
                            "text-[10px] mt-1 opacity-70",
                            isOwn ? "text-white/70" : "text-muted-foreground"
                        )}>
                            {sticker.label}
                        </span>
                    </div>
                )
            }
        }
        return <p className="whitespace-pre-wrap break-words">{content}</p>
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-[60] md:bg-transparent md:pointer-events-none"
                onClick={onClose}
            />

            {/* Panel */}
            <div className={cn(
                "fixed right-0 top-0 h-full w-full sm:w-[380px] bg-card z-[61] flex flex-col",
                "shadow-2xl border-l border-border",
                "animate-in slide-in-from-right duration-300"
            )}>
                {/* Header */}
                {view === "conversations" && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-indigo-600 to-blue-600">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="h-5 w-5 text-white" />
                            <h2 className="text-base font-semibold text-white">Chat</h2>
                            {totalUnread > 0 && (
                                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {totalUnread}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={goToNewChat}
                                className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                                title="Nuevo chat"
                            >
                                <Users className="h-4 w-4" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {view === "newChat" && (
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-indigo-600 to-blue-600">
                        <button onClick={goBack} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h2 className="text-base font-semibold text-white">Nuevo chat</h2>
                    </div>
                )}

                {view === "chat" && activeConversation && (
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-indigo-600 to-blue-600">
                        <button onClick={goBack} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                            roleColors[activeConversation.otherUser.role] || "bg-slate-500"
                        )}>
                            {activeConversation.otherUser.initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{activeConversation.otherUser.name}</p>
                            <p className="text-[10px] text-white/60 capitalize">{activeConversation.otherUser.role}</p>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Conversation List */}
                    {view === "conversations" && (
                        <div>
                            {conversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                    <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                                        <MessageSquare className="h-7 w-7 text-indigo-400" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground mb-1">Sin conversaciones</p>
                                    <p className="text-xs text-muted-foreground mb-4">Inicia un nuevo chat con tu equipo</p>
                                    <button
                                        onClick={goToNewChat}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                                    >
                                        <Users className="h-4 w-4" />
                                        Nuevo chat
                                    </button>
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <button
                                        key={conv.id}
                                        onClick={() => openConversation(conv)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b border-border/50",
                                            conv.unreadCount > 0 && "bg-indigo-50/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0",
                                            roleColors[conv.otherUser.role] || "bg-slate-500"
                                        )}>
                                            {conv.otherUser.initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className={cn(
                                                    "text-sm truncate",
                                                    conv.unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground"
                                                )}>
                                                    {conv.otherUser.name}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                                    {conv.lastMessage ? formatTime(conv.lastMessage.created_at) : ""}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <p className={cn(
                                                    "text-xs truncate pr-2",
                                                    conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                                                )}>
                                                    {conv.lastMessage
                                                        ? formatLastMessage(conv.lastMessage.content, conv.lastMessage.isOwn)
                                                        : "Sin mensajes aún"
                                                    }
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <span className="bg-indigo-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shrink-0">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* New Chat - User List */}
                    {view === "newChat" && (
                        <div>
                            <div className="p-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Buscar usuario..."
                                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            {filteredUsers.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-8">No hay usuarios disponibles</p>
                            ) : (
                                filteredUsers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => startNewChat(user.id)}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b border-border/50"
                                    >
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0",
                                            roleColors[user.role] || "bg-slate-500"
                                        )}>
                                            {user.initials}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                                            <p className="text-[11px] text-muted-foreground capitalize">{user.role}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* Chat Messages */}
                    {view === "chat" && (
                        <div className="flex flex-col min-h-full">
                            <div className="flex-1 px-3 py-4 space-y-1">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <p className="text-sm text-muted-foreground">
                                            Envía el primer mensaje 👋
                                        </p>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const isOwn = msg.sender_id === currentUserId
                                        const showTime = i === 0 ||
                                            new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 300000
                                        const msgIsSticker = isSticker(msg.content)

                                        return (
                                            <div key={msg.id}>
                                                {showTime && (
                                                    <div className="flex justify-center my-3">
                                                        <span className="text-[10px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                                                            {formatTime(msg.created_at)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "flex mb-0.5",
                                                    isOwn ? "justify-end" : "justify-start"
                                                )}>
                                                    <div className={cn(
                                                        "max-w-[80%] rounded-2xl text-sm leading-relaxed",
                                                        msgIsSticker
                                                            ? "px-3 py-1 bg-transparent"
                                                            : cn(
                                                                "px-3 py-2",
                                                                isOwn
                                                                    ? "bg-indigo-600 text-white rounded-br-md"
                                                                    : "bg-muted text-foreground rounded-bl-md"
                                                            )
                                                    )}>
                                                        {renderMessageContent(msg.content, isOwn)}
                                                        <div className={cn(
                                                            "flex items-center gap-1 mt-0.5",
                                                            isOwn ? "justify-end" : "justify-start"
                                                        )}>
                                                            <span className={cn(
                                                                "text-[10px]",
                                                                msgIsSticker
                                                                    ? "text-muted-foreground"
                                                                    : isOwn ? "text-white/60" : "text-muted-foreground"
                                                            )}>
                                                                {formatMessageTime(msg.created_at)}
                                                            </span>
                                                            {isOwn && (
                                                                msg.is_read
                                                                    ? <CheckCheck className={cn("h-3 w-3", msgIsSticker ? "text-blue-500" : "text-blue-300")} />
                                                                    : <Check className={cn("h-3 w-3", msgIsSticker ? "text-muted-foreground" : "text-white/40")} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                {view === "chat" && (
                    <div className="relative">
                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                            <div
                                ref={emojiPickerRef}
                                className="absolute bottom-full left-0 right-0 z-10 flex justify-center pb-2 px-2"
                            >
                                <div className="shadow-2xl rounded-xl overflow-hidden border border-border">
                                    <EmojiPicker onSelect={onEmojiSelect} />
                                </div>
                            </div>
                        )}

                        {/* Sticker Picker */}
                        {showStickerPicker && (
                            <div
                                ref={stickerPickerRef}
                                className="absolute bottom-full left-0 right-0 z-10 pb-2 px-2"
                            >
                                <div className="bg-card shadow-2xl rounded-xl border border-border overflow-hidden">
                                    {/* Category tabs */}
                                    <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/30">
                                        {STICKER_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setActiveCategory(cat.id)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                                    activeCategory === cat.id
                                                        ? "bg-indigo-100 text-indigo-700"
                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                <span className="text-sm">{cat.emoji}</span>
                                                <span className="hidden sm:inline">{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {/* Sticker grid */}
                                    <div className="grid grid-cols-4 gap-1 p-3 max-h-[200px] overflow-y-auto">
                                        {STICKERS.filter(s => s.category === activeCategory).map(sticker => (
                                            <button
                                                key={sticker.id}
                                                onClick={() => sendSticker(sticker.id)}
                                                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl hover:bg-indigo-50 transition-colors group"
                                                title={sticker.label}
                                            >
                                                <span className="text-3xl group-hover:scale-110 transition-transform">
                                                    {sticker.emoji}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground group-hover:text-indigo-600 truncate w-full text-center">
                                                    {sticker.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={sendMessage} className="flex items-center gap-2 px-3 py-3 border-t border-border bg-card">
                            {/* Emoji button */}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEmojiPicker(!showEmojiPicker)
                                    setShowStickerPicker(false)
                                }}
                                className={cn(
                                    "h-9 w-9 rounded-full flex items-center justify-center transition-colors shrink-0",
                                    showEmojiPicker
                                        ? "bg-indigo-100 text-indigo-600"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                                title="Emojis"
                            >
                                <Smile className="h-5 w-5" />
                            </button>

                            {/* Sticker button */}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowStickerPicker(!showStickerPicker)
                                    setShowEmojiPicker(false)
                                }}
                                className={cn(
                                    "h-9 w-9 rounded-full flex items-center justify-center transition-colors shrink-0",
                                    showStickerPicker
                                        ? "bg-indigo-100 text-indigo-600"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                                title="Stickers"
                            >
                                <Sticker className="h-5 w-5" />
                            </button>

                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Escribe un mensaje..."
                                className="flex-1 px-4 py-2.5 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center transition-all shrink-0",
                                    newMessage.trim()
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </>
    )
}
