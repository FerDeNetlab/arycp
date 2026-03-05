import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getErrorMessage } from "@/lib/api/errors"

// GET — List conversations for the current user with last message + unread count
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const adminClient = createAdminClient()

        // Get all conversations where user is a participant
        const { data: conversations, error } = await adminClient
            .from("chat_conversations")
            .select("*")
            .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
            .order("last_message_at", { ascending: false })

        if (error) throw error

        // For each conversation, get the other user's info and last message + unread count
        const enriched = await Promise.all((conversations || []).map(async (conv) => {
            const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1

            // Get other user info
            const { data: otherUser } = await adminClient
                .from("system_users")
                .select("full_name, role, email")
                .eq("auth_user_id", otherUserId)
                .single()

            // Get last message
            const { data: lastMsg } = await adminClient
                .from("chat_messages")
                .select("content, sender_id, created_at")
                .eq("conversation_id", conv.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single()

            // Get unread count (messages sent by other user that are not read)
            const { count: unreadCount } = await adminClient
                .from("chat_messages")
                .select("id", { count: "exact", head: true })
                .eq("conversation_id", conv.id)
                .eq("sender_id", otherUserId)
                .eq("is_read", false)

            return {
                id: conv.id,
                otherUser: {
                    id: otherUserId,
                    name: otherUser?.full_name || "Usuario",
                    role: otherUser?.role || "",
                    initials: (otherUser?.full_name || "U").split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase(),
                },
                lastMessage: lastMsg ? {
                    content: lastMsg.content,
                    isOwn: lastMsg.sender_id === user.id,
                    created_at: lastMsg.created_at,
                } : null,
                unreadCount: unreadCount || 0,
                last_message_at: conv.last_message_at,
            }
        }))

        return NextResponse.json({ data: enriched })
    } catch (error: unknown) {
        console.error("Error fetching conversations:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

// POST — Create or find existing conversation with another user
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const { otherUserId } = await request.json()
        if (!otherUserId) return NextResponse.json({ error: "otherUserId requerido" }, { status: 400 })

        const adminClient = createAdminClient()

        // Check if conversation already exists (in either direction)
        const { data: existing } = await adminClient
            .from("chat_conversations")
            .select("id")
            .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
            .single()

        if (existing) {
            return NextResponse.json({ conversationId: existing.id })
        }

        // Create new conversation (smaller UUID first for consistency)
        const p1 = user.id < otherUserId ? user.id : otherUserId
        const p2 = user.id < otherUserId ? otherUserId : user.id

        const { data: newConv, error } = await adminClient
            .from("chat_conversations")
            .insert({ participant_1: p1, participant_2: p2 })
            .select("id")
            .single()

        if (error) throw error

        return NextResponse.json({ conversationId: newConv.id })
    } catch (error: unknown) {
        console.error("Error creating conversation:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
