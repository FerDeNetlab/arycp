import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getErrorMessage } from "@/lib/api/errors"

// GET — Fetch messages for a conversation (paginated)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const conversationId = searchParams.get("conversationId")
        const limit = parseInt(searchParams.get("limit") || "50")
        const before = searchParams.get("before") // cursor for pagination

        if (!conversationId) return NextResponse.json({ error: "conversationId requerido" }, { status: 400 })

        const adminClient = createAdminClient()

        // Verify user is participant
        const { data: conv } = await adminClient
            .from("chat_conversations")
            .select("id")
            .eq("id", conversationId)
            .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
            .single()

        if (!conv) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 })

        let query = adminClient
            .from("chat_messages")
            .select("id, sender_id, content, is_read, created_at")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: false })
            .limit(limit)

        if (before) {
            query = query.lt("created_at", before)
        }

        const { data: messages, error } = await query

        if (error) throw error

        return NextResponse.json({ data: (messages || []).reverse() })
    } catch (error: unknown) {
        console.error("Error fetching messages:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

// POST — Send a message
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const { conversationId, content } = await request.json()
        if (!conversationId || !content?.trim()) {
            return NextResponse.json({ error: "conversationId y content requeridos" }, { status: 400 })
        }

        const adminClient = createAdminClient()

        // Verify user is participant
        const { data: conv } = await adminClient
            .from("chat_conversations")
            .select("id")
            .eq("id", conversationId)
            .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
            .single()

        if (!conv) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 })

        // Insert message
        const { data: msg, error } = await adminClient
            .from("chat_messages")
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: content.trim(),
            })
            .select("id, sender_id, content, is_read, created_at")
            .single()

        if (error) throw error

        // Update conversation last_message_at
        await adminClient
            .from("chat_conversations")
            .update({ last_message_at: msg.created_at })
            .eq("id", conversationId)

        return NextResponse.json({ data: msg })
    } catch (error: unknown) {
        console.error("Error sending message:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}

// PATCH — Mark messages as read
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const { conversationId } = await request.json()
        if (!conversationId) return NextResponse.json({ error: "conversationId requerido" }, { status: 400 })

        const adminClient = createAdminClient()

        // Mark all messages from the OTHER user as read
        const { error } = await adminClient
            .from("chat_messages")
            .update({ is_read: true })
            .eq("conversation_id", conversationId)
            .neq("sender_id", user.id)
            .eq("is_read", false)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        console.error("Error marking messages as read:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
