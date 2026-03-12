// Sticker definitions for chat
// Stickers use emoji-based content wrapped in special markers
// Format in chat_messages.content: [sticker:id]

export interface Sticker {
    id: string
    emoji: string
    label: string
    category: "greeting" | "reaction" | "work" | "fun"
}

export const STICKER_CATEGORIES = [
    { id: "greeting" as const, label: "Saludos", emoji: "👋" },
    { id: "reaction" as const, label: "Reacciones", emoji: "🎉" },
    { id: "work" as const, label: "Trabajo", emoji: "💼" },
    { id: "fun" as const, label: "Diversión", emoji: "😄" },
]

export const STICKERS: Sticker[] = [
    // Greetings
    { id: "wave", emoji: "👋", label: "Hola", category: "greeting" },
    { id: "hi-five", emoji: "🙌", label: "Hi-five", category: "greeting" },
    { id: "handshake", emoji: "🤝", label: "Trato hecho", category: "greeting" },
    { id: "bye", emoji: "👋🏽", label: "Adiós", category: "greeting" },
    { id: "hug", emoji: "🤗", label: "Abrazo", category: "greeting" },
    { id: "salute", emoji: "🫡", label: "A la orden", category: "greeting" },

    // Reactions
    { id: "thumbs-up", emoji: "👍", label: "OK", category: "reaction" },
    { id: "fire", emoji: "🔥", label: "Excelente", category: "reaction" },
    { id: "clap", emoji: "👏", label: "Aplauso", category: "reaction" },
    { id: "heart", emoji: "❤️", label: "Me encanta", category: "reaction" },
    { id: "party", emoji: "🎉", label: "Fiesta", category: "reaction" },
    { id: "100", emoji: "💯", label: "Perfecto", category: "reaction" },
    { id: "star", emoji: "⭐", label: "Genial", category: "reaction" },
    { id: "check", emoji: "✅", label: "Listo", category: "reaction" },

    // Work
    { id: "laptop", emoji: "💻", label: "Trabajando", category: "work" },
    { id: "docs", emoji: "📄", label: "Documentos", category: "work" },
    { id: "calendar", emoji: "📅", label: "Agenda", category: "work" },
    { id: "coffee", emoji: "☕", label: "Café", category: "work" },
    { id: "clock", emoji: "⏰", label: "En un rato", category: "work" },
    { id: "done", emoji: "🏁", label: "Terminé", category: "work" },
    { id: "meeting", emoji: "📋", label: "Reunión", category: "work" },
    { id: "money", emoji: "💰", label: "Dinero", category: "work" },

    // Fun
    { id: "laugh", emoji: "😂", label: "Jaja", category: "fun" },
    { id: "wink", emoji: "😉", label: "Guiño", category: "fun" },
    { id: "cool", emoji: "😎", label: "Cool", category: "fun" },
    { id: "think", emoji: "🤔", label: "Hmm", category: "fun" },
    { id: "surprised", emoji: "😮", label: "Wow", category: "fun" },
    { id: "sleepy", emoji: "😴", label: "Cansado", category: "fun" },
    { id: "celebrate", emoji: "🥳", label: "Celebrar", category: "fun" },
    { id: "rocket", emoji: "🚀", label: "Vamos", category: "fun" },
]

export function isSticker(content: string): boolean {
    return content.startsWith("[sticker:") && content.endsWith("]")
}

export function getStickerFromContent(content: string): Sticker | null {
    if (!isSticker(content)) return null
    const id = content.slice(9, -1) // Extract ID from [sticker:id]
    return STICKERS.find(s => s.id === id) || null
}

export function stickerToContent(stickerId: string): string {
    return `[sticker:${stickerId}]`
}
