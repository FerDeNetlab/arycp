import type { Role, Permission, Module } from "@/lib/constants/roles"
import { ROLE_PERMISSIONS, ROLE_MODULES } from "@/lib/constants/roles"

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: Role, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role]
    return permissions.includes(permission)
}

/**
 * Verifica si un rol puede acceder a un módulo
 */
export function canAccessModule(role: Role, module: Module): boolean {
    const modules = ROLE_MODULES[role]
    return modules.includes(module)
}

/**
 * Obtiene todos los módulos a los que un rol tiene acceso
 */
export function getUserModules(role: Role, clientServices?: string[]): Module[] {
    const baseModules = ROLE_MODULES[role]

    // Si es cliente, filtrar módulos según servicios contratados
    if (role === "cliente" && clientServices) {
        return baseModules.filter((module) => {
            // Mapear servicios a módulos
            if (clientServices.includes("contabilidad") && module === "client_contabilidad") return true
            if (clientServices.includes("fiscal") && module === "client_fiscal") return true
            if (clientServices.includes("juridico") && module === "client_juridico") return true
            if (clientServices.includes("laboral") && module === "client_laboral") return true
            return false
        })
    }

    return baseModules
}

/**
 * Verifica si un usuario puede realizar una acción sobre datos
 */
export function canModifyData(role: Role, action: "create" | "edit" | "delete"): boolean {
    const permissionMap = {
        create: "create_data" as Permission,
        edit: "edit_data" as Permission,
        delete: "delete_data" as Permission,
    }

    return hasPermission(role, permissionMap[action])
}

/**
 * Verifica si un usuario puede gestionar usuarios del sistema
 */
export function canManageUsers(role: Role): boolean {
    return hasPermission(role, "create_users")
}

/**
 * Verifica si un usuario puede ver todos los datos o solo los suyos
 */
export function canViewAllData(role: Role): boolean {
    return hasPermission(role, "view_all_data")
}
