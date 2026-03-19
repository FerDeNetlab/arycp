import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("cn (class name merger)", () => {
  it("should merge simple classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("should handle falsy values gracefully", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar")
  })

  it("should merge tailwind conflicts correctly (last wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2")
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })

  it("should handle conditional classes", () => {
    const isActive = true
    const isDisabled = false
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active"
    )
  })

  it("should handle empty arguments", () => {
    expect(cn()).toBe("")
  })

  it("should handle arrays (clsx supports arrays)", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar")
  })
})
