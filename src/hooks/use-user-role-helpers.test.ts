import { describe, it, expect } from "vitest"
import { isClientRole, canModify } from "./use-user-role"

describe("isClientRole", () => {
  it('should return true for "cliente"', () => {
    expect(isClientRole("cliente")).toBe(true)
  })

  it('should return false for "admin"', () => {
    expect(isClientRole("admin")).toBe(false)
  })

  it('should return false for "contador"', () => {
    expect(isClientRole("contador")).toBe(false)
  })

  it("should return false for empty string", () => {
    expect(isClientRole("")).toBe(false)
  })

  it("should return false for arbitrary string", () => {
    expect(isClientRole("superadmin")).toBe(false)
  })
})

describe("canModify", () => {
  it('should return true for "admin"', () => {
    expect(canModify("admin")).toBe(true)
  })

  it('should return true for "contador"', () => {
    expect(canModify("contador")).toBe(true)
  })

  it('should return false for "cliente"', () => {
    expect(canModify("cliente")).toBe(false)
  })

  it("should return false for empty string", () => {
    expect(canModify("")).toBe(false)
  })

  it("should return false for arbitrary string", () => {
    expect(canModify("viewer")).toBe(false)
  })
})
