import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const clientId = searchParams.get("clientId")

        if (!clientId) return NextResponse.json({ error: "clientId requerido" }, { status: 400 })

        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from("invoice_templates")
            .select("*")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false })

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

        const supabase = createAdminClient()

        const { data: sysUser } = await supabase
            .from("system_users")
            .select("role, full_name")
            .eq("auth_user_id", user.id)
            .single()

        if (!sysUser || (sysUser.role !== "admin" && sysUser.role !== "contador")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const formData = await request.formData()
        const clientId = formData.get("clientId") as string
        const description = formData.get("description") as string
        const file = formData.get("file") as File

        if (!clientId || !file) {
            return NextResponse.json({ error: "clientId y archivo requeridos" }, { status: 400 })
        }

        // Upload file to Supabase Storage
        const fileExt = file.name.split(".").pop()
        const fileName = `${clientId}/${Date.now()}_${file.name}`
        const buffer = await file.arrayBuffer()

        const { error: uploadError } = await supabase.storage
            .from("invoice-templates")
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            })

        if (uploadError) {
            // If bucket doesn't exist, store just the file name
            console.error("Storage upload error:", uploadError)
        }

        const { data: urlData } = supabase.storage
            .from("invoice-templates")
            .getPublicUrl(fileName)

        const fileUrl = urlData?.publicUrl || fileName

        const { data, error } = await supabase.from("invoice_templates").insert({
            client_id: clientId,
            file_name: file.name,
            file_url: fileUrl,
            description: description || null,
            uploaded_by: user.id,
        }).select().single()

        if (error) throw error

        return NextResponse.json({ data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
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

        const { searchParams } = new URL(request.url)
        const templateId = searchParams.get("id")

        if (!templateId) return NextResponse.json({ error: "id requerido" }, { status: 400 })

        const { error } = await supabase
            .from("invoice_templates")
            .delete()
            .eq("id", templateId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
