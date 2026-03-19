import { describe, it, expect } from "vitest"
import {
  hasPermission,
  canAccessModule,
  getUserModules,
  canModifyData,
  canManageUsers,
  canViewAllData,
} from "./permissions"

describe("hasPermission", () => {
  it("admin should have create_users permission", () => {
    expect(hasPermission("admin", "create_users")).toBe(true)
  })

  it("admin should have delete_data permission", () => {
    expect(hasPermission("admin", "delete_data")).toBe(true)
  })

  it("contador should NOT have create_users permission", () => {
    expect(hasPermission("contador", "create_users")).toBe(false)
  })

  it("contador should have create_data permission", () => {
    expect(hasPermission("contador", "create_data")).toBe(true)
  })

  it("cliente should only have view_own_data and access_client_modules", () => {
    expect(hasPermission("cliente", "view_own_data")).toBe(true)
    expect(hasPermission("cliente", "access_client_modules")).toBe(true)
    expect(hasPermission("cliente", "create_data")).toBe(false)
    expect(hasPermission("cliente", "edit_data")).toBe(false)
  })
})

describe("canAccessModule", () => {
  it("admin can access users module", () => {
    expect(canAccessModule("admin", "users")).toBe(true)
  })

  it("admin can access contabilidad module", () => {
    expect(canAccessModule("admin", "contabilidad")).toBe(true)
  })

  it("contador cannot access users module", () => {
    expect(canAccessModule("contador", "users")).toBe(false)
  })

  it("contador can access contabilidad module", () => {
    expect(canAccessModule("contador", "contabilidad")).toBe(true)
  })

  it("cliente can access client_contabilidad but not contabilidad", () => {
    expect(canAccessModule("cliente", "client_contabilidad")).toBe(true)
    expect(canAccessModule("cliente", "contabilidad")).toBe(false)
  })
})

describe("getUserModules", () => {
  it("admin gets all base modules without filtering", () => {
    const modules = getUserModules("admin")
    expect(modules).toHaveLength(9)
  })

  it("contador gets all work modules", () => {
    const modules = getUserModules("contador")
    expect(modules).toHaveLength(8)
  })

  it("cliente with all services gets all 4 client modules", () => {
    const modules = getUserModules("cliente", [
      "contabilidad",
      "fiscal",
      "juridico",
      "laboral",
    ])
    expect(modules).toHaveLength(4)
  })

  it("cliente with only contabilidad service gets 1 module", () => {
    const modules = getUserModules("cliente", ["contabilidad"])
    expect(modules).toHaveLength(1)
    expect(modules[0]).toBe("client_contabilidad")
  })

  it("cliente with no services gets 0 modules", () => {
    const modules = getUserModules("cliente", [])
    expect(modules).toHaveLength(0)
  })

  it("cliente without clientServices param gets all base client modules", () => {
    const modules = getUserModules("cliente")
    expect(modules).toHaveLength(4)
  })
})

describe("canModifyData", () => {
  it("admin can create, edit, and delete", () => {
    expect(canModifyData("admin", "create")).toBe(true)
    expect(canModifyData("admin", "edit")).toBe(true)
    expect(canModifyData("admin", "delete")).toBe(true)
  })

  it("contador can create and edit but not delete", () => {
    expect(canModifyData("contador", "create")).toBe(true)
    expect(canModifyData("contador", "edit")).toBe(true)
    expect(canModifyData("contador", "delete")).toBe(false)
  })

  it("cliente cannot create, edit, or delete", () => {
    expect(canModifyData("cliente", "create")).toBe(false)
    expect(canModifyData("cliente", "edit")).toBe(false)
    expect(canModifyData("cliente", "delete")).toBe(false)
  })
})

describe("canManageUsers", () => {
  it("only admin can manage users", () => {
    expect(canManageUsers("admin")).toBe(true)
    expect(canManageUsers("contador")).toBe(false)
    expect(canManageUsers("cliente")).toBe(false)
  })
})

describe("canViewAllData", () => {
  it("admin and contador can view all data, cliente cannot", () => {
    expect(canViewAllData("admin")).toBe(true)
    expect(canViewAllData("contador")).toBe(true)
    expect(canViewAllData("cliente")).toBe(false)
  })
})
