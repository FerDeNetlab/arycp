"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const EMOJI_CATEGORIES = [
    {
        id: "recent",
        label: "Frecuentes",
        icon: "🕐",
        emojis: ["👍", "❤️", "😂", "🔥", "👏", "✅", "🎉", "💯", "🙌", "😊", "👋", "🚀"],
    },
    {
        id: "smileys",
        label: "Caritas",
        icon: "😀",
        emojis: [
            "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰",
            "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝",
            "🤑", "🤗", "🤭", "🫢", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶",
            "🫠", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷",
            "🤒", "🤕", "🤢", "🤮", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸",
            "😎", "🤓", "🧐", "😕", "🫤", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺",
            "🥹", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞",
            "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️",
        ],
    },
    {
        id: "gestures",
        label: "Gestos",
        icon: "👋",
        emojis: [
            "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "👌", "🤌", "🤏",
            "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️",
            "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲",
            "🤝", "🙏", "✍️", "💪", "🦾", "🫂",
        ],
    },
    {
        id: "hearts",
        label: "Corazones",
        icon: "❤️",
        emojis: [
            "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹",
            "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟",
        ],
    },
    {
        id: "objects",
        label: "Objetos",
        icon: "💼",
        emojis: [
            "💼", "📁", "📂", "📄", "📃", "📑", "📊", "📈", "📉", "📋", "📌", "📍",
            "📎", "📐", "📏", "✂️", "🖊️", "✏️", "🖍️", "📝", "💻", "🖥️", "⌨️", "🖨️",
            "📱", "☎️", "📧", "📬", "📅", "📆", "🗓️", "⏰", "⏱️", "💰", "💵", "💳",
            "🏦", "🏢", "🏠", "🔑", "🗑️", "📦", "🎁", "🏷️", "🔖",
        ],
    },
    {
        id: "symbols",
        label: "Símbolos",
        icon: "✅",
        emojis: [
            "✅", "❌", "⭕", "❗", "❓", "❕", "❔", "‼️", "⁉️", "💯", "🔥", "✨",
            "⭐", "🌟", "💫", "🎯", "🏁", "🚀", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇",
            "🥈", "🥉", "🔔", "🔕", "📢", "💬", "💭", "🗯️", "♻️", "⚠️", "🚫", "🔒",
            "🔓", "🔐", "⬆️", "⬇️", "➡️", "⬅️", "↩️", "↪️", "🔄", "➕", "➖", "✖️",
        ],
    },
]

interface EmojiPickerProps {
    onSelect: (emoji: string) => void
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
    const [activeCategory, setActiveCategory] = useState("recent")

    const currentCategory = EMOJI_CATEGORIES.find(c => c.id === activeCategory) || EMOJI_CATEGORIES[0]

    return (
        <div className="w-full bg-card rounded-xl overflow-hidden" style={{ maxWidth: 350 }}>
            {/* Category tabs */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/30 overflow-x-auto">
                {EMOJI_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg text-base transition-colors shrink-0",
                            activeCategory === cat.id
                                ? "bg-indigo-100"
                                : "hover:bg-muted"
                        )}
                        title={cat.label}
                    >
                        {cat.icon}
                    </button>
                ))}
            </div>

            {/* Category label */}
            <div className="px-3 pt-2 pb-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {currentCategory.label}
                </span>
            </div>

            {/* Emoji grid */}
            <div className="grid grid-cols-8 gap-0.5 px-2 pb-2 max-h-[200px] overflow-y-auto">
                {currentCategory.emojis.map((emoji, idx) => (
                    <button
                        key={`${emoji}-${idx}`}
                        onClick={() => onSelect(emoji)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-xl hover:bg-indigo-50 active:scale-90 transition-all"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    )
}
