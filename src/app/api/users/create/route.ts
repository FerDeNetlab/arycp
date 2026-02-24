import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ROLES } from "@/lib/constants/roles"

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar que el usuario actual esté autenticado
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        // 2. Verificar que el usuario actual sea ADMIN
        // IMPORTANTE: Usar adminClient para bypass RLS
        const adminClient = createAdminClient()
        const { data: currentUserData, error: userError } = await adminClient
            .from("system_users")
            .select("role")
            .eq("auth_user_id", user.id)
            .single()

        if (userError || !currentUserData || currentUserData.role !== ROLES.ADMIN) {
            return NextResponse.json({ error: "No tienes permisos para crear usuarios" }, { status: 403 })
        }

        // 3. Obtener datos del body
        const body = await request.json()
        const { full_name, email, phone, role, password } = body

        // 4. Validar datos
        if (!full_name || !email || !role || !password) {
            return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
        }

        if (!Object.values(ROLES).includes(role)) {
            return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
        }

        // 5. Crear usuario en Supabase Auth

        const { data: newAuthUser, error: createAuthError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirmar email
            user_metadata: {
                full_name,
            },
        })

        if (createAuthError || !newAuthUser.user) {
            console.error("Error creating auth user:", createAuthError?.message)
            return NextResponse.json(
                { error: createAuthError?.message || "Error al crear usuario en autenticación" },
                { status: 400 },
            )
        }


        // 6. Crear registro en system_users
        const { error: createUserError } = await adminClient.from("system_users").insert({
            auth_user_id: newAuthUser.user.id,
            full_name,
            email,
            phone: phone || null,
            role,
            is_active: true,
        })

        if (createUserError) {
            console.error("Error creating system user:", createUserError)

            // Si falla la creación en system_users, eliminar el usuario de auth
            await adminClient.auth.admin.deleteUser(newAuthUser.user.id)

            return NextResponse.json({ error: "Error al crear usuario en el sistema" }, { status: 500 })
        }

        // NOTA: Si el usuario es CLIENTE, se debe crear manualmente en "Gestión de Clientes"
        // Los dos registros se vincularán automáticamente por email


        return NextResponse.json(
            {
                success: true,
                message: "Usuario creado exitosamente",
                user: {
                    id: newAuthUser.user.id,
                    email: newAuthUser.user.email,
                    role,
                },
            },
            { status: 201 },
        )
    } catch (error) {
        console.error("Unexpected error:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}
