import { describe, it, expect } from "vitest"
import { ROLES, ROLE_PERMISSIONS, ROLE_MODULES, PERMISSIONS, MODULES } from "./roles"

describe("ROLES constants", () => {
  it("should have exactly 3 roles: admin, contador, cliente", () => {
    expect(Object.keys(ROLES)).toHaveLength(3)
    expect(ROLES.ADMIN).toBe("admin")
    expect(ROLES.CONTADOR).toBe("contador")
    expect(ROLES.CLIENTE).toBe("cliente")
  })
})

describe("ROLE_PERMISSIONS", () => {
  it("admin should have all data permissions", () => {
    const adminPerms = ROLE_PERMISSIONS[ROLES.ADMIN]
    expect(adminPerms).toContain(PERMISSIONS.CREATE_DATA)
    expect(adminPerms).toContain(PERMISSIONS.EDIT_DATA)
    expect(adminPerms).toContain(PERMISSIONS.DELETE_DATA)
    expect(adminPerms).toContain(PERMISSIONS.VIEW_ALL_DATA)
  })

  it("admin should have all user management permissions", () => {
    const adminPerms = ROLE_PERMISSIONS[ROLES.ADMIN]
    expect(adminPerms).toContain(PERMISSIONS.CREATE_USERS)
    expect(adminPerms).toContain(PERMISSIONS.EDIT_USERS)
    expect(adminPerms).toContain(PERMISSIONS.DELETE_USERS)
    expect(adminPerms).toContain(PERMISSIONS.VIEW_USERS)
  })

  it("contador should have work permissions but NOT delete_data or user management", () => {
    const contadorPerms = ROLE_PERMISSIONS[ROLES.CONTADOR]
    expect(contadorPerms).toContain(PERMISSIONS.CREATE_DATA)
    expect(contadorPerms).toContain(PERMISSIONS.EDIT_DATA)
    expect(contadorPerms).toContain(PERMISSIONS.VIEW_ALL_DATA)
    expect(contadorPerms).not.toContain(PERMISSIONS.DELETE_DATA)
    expect(contadorPerms).not.toContain(PERMISSIONS.CREATE_USERS)
    expect(contadorPerms).not.toContain(PERMISSIONS.EDIT_USERS)
    expect(contadorPerms).not.toContain(PERMISSIONS.DELETE_USERS)
  })

  it("cliente should only have read-only access to own data", () => {
    const clientePerms = ROLE_PERMISSIONS[ROLES.CLIENTE]
    expect(clientePerms).toContain(PERMISSIONS.VIEW_OWN_DATA)
    expect(clientePerms).toContain(PERMISSIONS.ACCESS_CLIENT_MODULES)
    expect(clientePerms).not.toContain(PERMISSIONS.CREATE_DATA)
    expect(clientePerms).not.toContain(PERMISSIONS.EDIT_DATA)
    expect(clientePerms).not.toContain(PERMISSIONS.DELETE_DATA)
    expect(clientePerms).not.toContain(PERMISSIONS.VIEW_ALL_DATA)
  })
})

describe("ROLE_MODULES", () => {
  it("admin should have access to 9 modules including USERS", () => {
    const adminModules = ROLE_MODULES[ROLES.ADMIN]
    expect(adminModules).toHaveLength(9)
    expect(adminModules).toContain(MODULES.USERS)
    expect(adminModules).toContain(MODULES.CONTABILIDAD)
    expect(adminModules).toContain(MODULES.FISCAL)
    expect(adminModules).toContain(MODULES.JURIDICO)
    expect(adminModules).toContain(MODULES.LABORAL)
  })

  it("contador should have 8 modules but NOT USERS", () => {
    const contadorModules = ROLE_MODULES[ROLES.CONTADOR]
    expect(contadorModules).toHaveLength(8)
    expect(contadorModules).not.toContain(MODULES.USERS)
    expect(contadorModules).toContain(MODULES.CONTABILIDAD)
  })

  it("cliente should have 4 client-specific modules", () => {
    const clienteModules = ROLE_MODULES[ROLES.CLIENTE]
    expect(clienteModules).toHaveLength(4)
    expect(clienteModules).toContain(MODULES.CLIENT_CONTABILIDAD)
    expect(clienteModules).toContain(MODULES.CLIENT_FISCAL)
    expect(clienteModules).toContain(MODULES.CLIENT_JURIDICO)
    expect(clienteModules).toContain(MODULES.CLIENT_LABORAL)
    // Should not contain admin-level modules
    expect(clienteModules).not.toContain(MODULES.CONTABILIDAD)
    expect(clienteModules).not.toContain(MODULES.USERS)
  })
})
