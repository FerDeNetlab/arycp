import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getErrorMessage } from "@/lib/api/errors"

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
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
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
        const fileName = `${clientId}/${Date.now()}_${file.name}`
        const buffer = await file.arrayBuffer()

        // Ensure the bucket exists (create if missing)
        const { data: buckets } = await supabase.storage.listBuckets()
        const bucketExists = buckets?.some(b => b.name === "invoice-templates")
        if (!bucketExists) {
            await supabase.storage.createBucket("invoice-templates", {
                public: true,
                fileSizeLimit: 10 * 1024 * 1024, // 10MB
                allowedMimeTypes: [
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "application/vnd.ms-excel",
                    "application/pdf",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "image/jpeg",
                    "image/png",
                ],
            })
        }

        const { error: uploadError } = await supabase.storage
            .from("invoice-templates")
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            })

        if (uploadError) {
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
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
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
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
