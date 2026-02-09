/**
 * Definición de roles del sistema
 */
export const ROLES = {
    ADMIN: "admin",
    CONTADOR: "contador",
    CLIENTE: "cliente",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

/**
 * Definición de permisos
 */
export const PERMISSIONS = {
    // Gestión de usuarios
    CREATE_USERS: "create_users",
    EDIT_USERS: "edit_users",
    DELETE_USERS: "delete_users",
    VIEW_USERS: "view_users",

    // Acceso a módulos
    ACCESS_ALL_MODULES: "access_all_modules",
    ACCESS_WORK_MODULES: "access_work_modules",
    ACCESS_CLIENT_MODULES: "access_client_modules",

    // Operaciones sobre datos
    CREATE_DATA: "create_data",
    EDIT_DATA: "edit_data",
    DELETE_DATA: "delete_data",
    VIEW_ALL_DATA: "view_all_data",
    VIEW_OWN_DATA: "view_own_data",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/**
 * Mapeo de permisos por rol
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [ROLES.ADMIN]: [
        // Usuarios
        PERMISSIONS.CREATE_USERS,
        PERMISSIONS.EDIT_USERS,
        PERMISSIONS.DELETE_USERS,
        PERMISSIONS.VIEW_USERS,
        // Módulos
        PERMISSIONS.ACCESS_ALL_MODULES,
        // Datos
        PERMISSIONS.CREATE_DATA,
        PERMISSIONS.EDIT_DATA,
        PERMISSIONS.DELETE_DATA,
        PERMISSIONS.VIEW_ALL_DATA,
    ],
    [ROLES.CONTADOR]: [
        // No puede gestionar usuarios
        PERMISSIONS.VIEW_USERS,
        // Módulos de trabajo
        PERMISSIONS.ACCESS_WORK_MODULES,
        // Datos
        PERMISSIONS.CREATE_DATA,
        PERMISSIONS.EDIT_DATA,
        // No puede eliminar datos importantes
        PERMISSIONS.VIEW_ALL_DATA,
    ],
    [ROLES.CLIENTE]: [
        // Acceso limitado a módulos
        PERMISSIONS.ACCESS_CLIENT_MODULES,
        // Solo lectura de sus propios datos
        PERMISSIONS.VIEW_OWN_DATA,
    ],
}

/**
 * Módulos disponibles en el sistema
 */
export const MODULES = {
    // Módulos administrativos (solo admin)
    USERS: "users",

    // Módulos de trabajo (admin y contador)
    CONTABILIDAD: "contabilidad",
    FISCAL: "fiscal",
    JURIDICO: "juridico",
    LABORAL: "laboral",
    CLIENTES: "clientes",
    EMAILS: "emails",
    CALENDARIO: "calendario",
    TRAMITOLOGIA: "tramitologia",

    // Módulos de cliente (solo lectura)
    CLIENT_CONTABILIDAD: "client_contabilidad",
    CLIENT_FISCAL: "client_fiscal",
    CLIENT_JURIDICO: "client_juridico",
    CLIENT_LABORAL: "client_laboral",
} as const

export type Module = (typeof MODULES)[keyof typeof MODULES]

/**
 * Módulos permitidos por rol
 */
export const ROLE_MODULES: Record<Role, Module[]> = {
    [ROLES.ADMIN]: [
        MODULES.USERS,
        MODULES.CONTABILIDAD,
        MODULES.FISCAL,
        MODULES.JURIDICO,
        MODULES.LABORAL,
        MODULES.CLIENTES,
        MODULES.EMAILS,
        MODULES.CALENDARIO,
        MODULES.TRAMITOLOGIA,
    ],
    [ROLES.CONTADOR]: [
        MODULES.CONTABILIDAD,
        MODULES.FISCAL,
        MODULES.JURIDICO,
        MODULES.LABORAL,
        MODULES.CLIENTES,
        MODULES.EMAILS,
        MODULES.CALENDARIO,
        MODULES.TRAMITOLOGIA,
    ],
    [ROLES.CLIENTE]: [
        // Los módulos de cliente se determinan dinámicamente
        // según los servicios contratados
        MODULES.CLIENT_CONTABILIDAD,
        MODULES.CLIENT_FISCAL,
        MODULES.CLIENT_JURIDICO,
        MODULES.CLIENT_LABORAL,
    ],
}
