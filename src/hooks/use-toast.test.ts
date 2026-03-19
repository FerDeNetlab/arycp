import { describe, it, expect } from "vitest"
import { reducer } from "./use-toast"

function makeToast(id: string, title?: string) {
  return { id, title: title || `Toast ${id}`, open: true } as any
}

describe("use-toast reducer", () => {
  describe("ADD_TOAST", () => {
    it("should add a toast to an empty state", () => {
      const state = { toasts: [] }
      const toast = makeToast("1")
      const next = reducer(state, { type: "ADD_TOAST", toast })
      expect(next.toasts).toHaveLength(1)
      expect(next.toasts[0].id).toBe("1")
    })

    it("should prepend new toast (most recent first)", () => {
      const state = { toasts: [makeToast("1")] }
      const toast = makeToast("2")
      const next = reducer(state, { type: "ADD_TOAST", toast })
      expect(next.toasts[0].id).toBe("2")
    })

    it("should respect TOAST_LIMIT of 1 (only latest toast kept)", () => {
      const state = { toasts: [makeToast("1")] }
      const toast = makeToast("2")
      const next = reducer(state, { type: "ADD_TOAST", toast })
      expect(next.toasts).toHaveLength(1)
      expect(next.toasts[0].id).toBe("2")
    })
  })

  describe("UPDATE_TOAST", () => {
    it("should partially update a toast by id", () => {
      const state = { toasts: [makeToast("1", "Original")] }
      const next = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "1", title: "Updated" },
      })
      expect(next.toasts[0].title).toBe("Updated")
      expect(next.toasts[0].id).toBe("1")
    })

    it("should not modify other toasts", () => {
      const state = {
        toasts: [makeToast("1", "First")],
      }
      const next = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "nonexistent", title: "Nope" },
      })
      expect(next.toasts[0].title).toBe("First")
    })
  })

  describe("DISMISS_TOAST", () => {
    it("should set open to false for a specific toast", () => {
      const state = { toasts: [makeToast("1")] }
      const next = reducer(state, { type: "DISMISS_TOAST", toastId: "1" })
      expect(next.toasts[0].open).toBe(false)
    })

    it("should dismiss all toasts when no toastId provided", () => {
      const state = { toasts: [makeToast("1")] }
      const next = reducer(state, { type: "DISMISS_TOAST" })
      expect(next.toasts.every((t: any) => t.open === false)).toBe(true)
    })
  })

  describe("REMOVE_TOAST", () => {
    it("should remove a specific toast by id", () => {
      const state = { toasts: [makeToast("1")] }
      const next = reducer(state, { type: "REMOVE_TOAST", toastId: "1" })
      expect(next.toasts).toHaveLength(0)
    })

    it("should clear all toasts when no toastId provided", () => {
      const state = { toasts: [makeToast("1")] }
      const next = reducer(state, { type: "REMOVE_TOAST" })
      expect(next.toasts).toHaveLength(0)
    })
  })
})
