import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"

// We need to mock the modules BEFORE importing the hook
vi.mock("@/lib/constants/roles", () => ({
  ROLES: {
    ADMIN: "admin",
    CONTADOR: "contador",
    CLIENTE: "cliente",
  },
}))

// Import after mocks
import { useUserRole } from "./useUserRole"

describe("useUserRole hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should start in loading state", () => {
    // Mock a fetch that never resolves
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useUserRole())
    expect(result.current.loading).toBe(true)
    expect(result.current.userData).toBeNull()
    expect(result.current.role).toBeNull()
  })

  it("should set user data on successful fetch", async () => {
    const mockData = {
      id: "user-123",
      email: "admin@test.com",
      role: "admin",
      fullName: "Admin User",
    }

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.userData?.id).toBe("user-123")
    expect(result.current.role).toBe("admin")
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isContador).toBe(false)
    expect(result.current.isCliente).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("should set isContador flag correctly", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "u2",
        email: "contador@test.com",
        role: "contador",
        fullName: "Contador User",
      }),
    } as Response)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isContador).toBe(true)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isCliente).toBe(false)
  })

  it("should set isCliente flag correctly", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "u3",
        email: "cliente@test.com",
        role: "cliente",
        fullName: "Cliente User",
      }),
    } as Response)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isCliente).toBe(true)
    expect(result.current.isAdmin).toBe(false)
  })

  it("should set error on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Unauthorized" }),
    } as Response)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe("Unauthorized")
    expect(result.current.userData).toBeNull()
  })

  it("should set connection error on fetch failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe("Error de conexión")
    expect(result.current.userData).toBeNull()
  })

  it("should provide refreshRole function", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "u1",
        email: "a@test.com",
        role: "admin",
        fullName: "Admin",
      }),
    } as Response)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(typeof result.current.refreshRole).toBe("function")
  })
})
