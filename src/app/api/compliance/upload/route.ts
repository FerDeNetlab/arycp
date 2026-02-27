import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getErrorMessage } from "@/lib/api/errors"

export async function POST(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const supabase = createAdminClient()

        const { data: sysUser } = await supabase
            .from("system_users")
            .select("role")
            .eq("auth_user_id", user.id)
            .single()

        if (!sysUser || (sysUser.role !== "admin" && sysUser.role !== "contador")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File
        const registrationId = formData.get("registrationId") as string

        if (!file || !registrationId) {
            return NextResponse.json({ error: "Archivo y registrationId requeridos" }, { status: 400 })
        }

        // Upload to Supabase Storage
        const fileName = `${registrationId}/${Date.now()}_${file.name}`
        const buffer = await file.arrayBuffer()

        const { error: uploadError } = await supabase.storage
            .from("compliance-docs")
            .upload(fileName, buffer, {
                contentType: file.type || "application/octet-stream",
                upsert: false,
            })

        if (uploadError) {
            console.error("Storage upload error:", uploadError)
            return NextResponse.json({ error: "Error al subir archivo: " + uploadError.message }, { status: 500 })
        }

        const { data: urlData } = supabase.storage
            .from("compliance-docs")
            .getPublicUrl(fileName)

        const fileUrl = urlData?.publicUrl || fileName

        // Update the registration record
        const { error: updateError } = await supabase
            .from("company_registrations")
            .update({ file_url: fileUrl, updated_at: new Date().toISOString() })
            .eq("id", registrationId)

        if (updateError) throw updateError

        return NextResponse.json({ fileUrl })
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
