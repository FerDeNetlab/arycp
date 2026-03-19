import { describe, it, expect } from "vitest"
import {
  isSticker,
  getStickerFromContent,
  stickerToContent,
  STICKERS,
  STICKER_CATEGORIES,
} from "./stickers"

describe("isSticker", () => {
  it("should return true for valid sticker format", () => {
    expect(isSticker("[sticker:wave]")).toBe(true)
    expect(isSticker("[sticker:thumbs-up]")).toBe(true)
    expect(isSticker("[sticker:fire]")).toBe(true)
  })

  it("should return false for plain text", () => {
    expect(isSticker("hello world")).toBe(false)
    expect(isSticker("")).toBe(false)
  })

  it("should return false for partial sticker format", () => {
    expect(isSticker("[sticker:wave")).toBe(false)
    expect(isSticker("sticker:wave]")).toBe(false)
    expect(isSticker("[sticker:]")).toBe(true) // Technically valid format, empty id
  })
})

describe("getStickerFromContent", () => {
  it("should return correct sticker object for valid content", () => {
    const sticker = getStickerFromContent("[sticker:wave]")
    expect(sticker).not.toBeNull()
    expect(sticker?.id).toBe("wave")
    expect(sticker?.emoji).toBe("👋")
    expect(sticker?.label).toBe("Hola")
    expect(sticker?.category).toBe("greeting")
  })

  it("should return null for unknown sticker id", () => {
    const sticker = getStickerFromContent("[sticker:nonexistent]")
    expect(sticker).toBeNull()
  })

  it("should return null for non-sticker content", () => {
    const sticker = getStickerFromContent("just text")
    expect(sticker).toBeNull()
  })

  it("should work for all defined stickers", () => {
    for (const s of STICKERS) {
      const content = `[sticker:${s.id}]`
      const result = getStickerFromContent(content)
      expect(result).not.toBeNull()
      expect(result?.id).toBe(s.id)
    }
  })
})

describe("stickerToContent", () => {
  it("should produce correct format", () => {
    expect(stickerToContent("wave")).toBe("[sticker:wave]")
    expect(stickerToContent("thumbs-up")).toBe("[sticker:thumbs-up]")
    expect(stickerToContent("fire")).toBe("[sticker:fire]")
  })
})

describe("roundtrip: stickerToContent → getStickerFromContent", () => {
  it("should produce the original sticker for every known sticker", () => {
    for (const s of STICKERS) {
      const content = stickerToContent(s.id)
      const result = getStickerFromContent(content)
      expect(result).toEqual(s)
    }
  })
})

describe("STICKERS data integrity", () => {
  it("every sticker should have a valid category", () => {
    const validCategories = STICKER_CATEGORIES.map((c) => c.id)
    for (const s of STICKERS) {
      expect(validCategories).toContain(s.category)
    }
  })

  it("every sticker should have a non-empty id, emoji, and label", () => {
    for (const s of STICKERS) {
      expect(s.id.length).toBeGreaterThan(0)
      expect(s.emoji.length).toBeGreaterThan(0)
      expect(s.label.length).toBeGreaterThan(0)
    }
  })

  it("sticker ids should be unique", () => {
    const ids = STICKERS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
