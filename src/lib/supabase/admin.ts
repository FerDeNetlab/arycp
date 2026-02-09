import { createClient } from "@supabase/supabase-js"

/**
 * Cliente de Supabase con privilegios de administrador
 * Usa la service_role key que bypass RLS (Row Level Security)
 * SOLO debe usarse en el servidor, NUNCA en el cliente
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error("Missing Supabase environment variables for admin client")
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
