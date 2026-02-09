import { createAdminClient } from "../supabase/admin"

export async function getUserRole(userId: string) {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
        .from("system_users")
        .select("role, email, full_name")
        .eq("auth_user_id", userId)
        .single()

    if (error || !data) {
        throw new Error("Usuario no encontrado en el sistema")
    }

    return {
        role: data.role,
        email: data.email,
        fullName: data.full_name,
    }
}
