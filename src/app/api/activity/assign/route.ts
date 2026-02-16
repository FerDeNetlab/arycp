import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { logActivity, createNotification } from "@/lib/activity"

export async function POST(request: Request) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const body = await request.json()
        const { entityType, entityId, assignToUserId, module } = body

        if (!entityType || !entityId || !assignToUserId) {
            return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Get assigner's name
        const { data: assigner } = await supabase
            .from("system_users")
            .select("full_name")
            .eq("auth_user_id", user.id)
            .single()

        // Get assignee's name
        const { data: assignee } = await supabase
            .from("system_users")
            .select("full_name, auth_user_id")
            .eq("auth_user_id", assignToUserId)
            .single()

        if (!assignee) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
        }

        // Determine which table to update
        const tableMap: Record<string, string> = {
            procedure: "procedures",
            fiscal_obligation: "fiscal_obligations",
            legal_process: "legal_processes",
        }

        const tableName = tableMap[entityType]
        if (!tableName) {
            return NextResponse.json({ error: "Tipo de entidad inválido" }, { status: 400 })
        }

        // Get entity info for description
        const { data: entity } = await supabase
            .from(tableName)
            .select("*")
            .eq("id", entityId)
            .single()

        // Update the assigned_to field
        const { error: updateError } = await supabase
            .from(tableName)
            .update({
                assigned_to: assignToUserId,
                assigned_to_name: assignee.full_name,
            })
            .eq("id", entityId)

        if (updateError) throw updateError

        // Get client name
        let clientName = ""
        if (entity?.client_id) {
            const { data: client } = await supabase
                .from("clients")
                .select("business_name")
                .eq("id", entity.client_id)
                .single()
            clientName = client?.business_name || ""
        }

        const entityLabel = entityType === "procedure" ? "trámite" : entityType === "fiscal_obligation" ? "obligación fiscal" : "proceso legal"

        // Get a human-readable name for the entity
        const procedureTypeMap: Record<string, string> = {
            alta_patronal_imss: "Alta patronal ante el IMSS",
            alta_representante_legal: "Alta de representante legal",
            efirma: "Generación de e.firma",
            sello_digital: "Sello Digital",
            opinion_cumplimiento: "Opinión de Cumplimiento",
            registro_publico: "Registro Público",
            constancia_situacion_fiscal: "Constancia de situación fiscal",
            cambio_domicilio: "Cambio de domicilio fiscal",
            aumento_disminucion: "Aumento/disminución de obligaciones",
            reactivacion_buzon: "Reactivación de buzón tributario",
            revisiones_sat: "Revisiones del SAT",
            otro: "Otro trámite",
        }

        let entityDesc = entityLabel
        if (entityType === "procedure" && entity?.procedure_type) {
            entityDesc = procedureTypeMap[entity.procedure_type] || entity.procedure_type
        } else if (entity?.obligation_type) {
            entityDesc = entity.obligation_type
        } else if (entity?.case_type) {
            entityDesc = entity.case_type
        } else if (entity?.description || entity?.title) {
            entityDesc = entity.description || entity.title
        }

        // Log activity
        await logActivity({
            userId: user.id,
            userName: assigner?.full_name || "Usuario",
            clientId: entity?.client_id,
            clientName,
            module: module || entityType,
            action: "assigned",
            entityType,
            entityId,
            description: `${assigner?.full_name || "Un usuario"} asignó ${entityLabel} "${entityDesc}" a ${assignee.full_name}`,
            metadata: {
                assigned_from: user.id,
                assigned_to: assignToUserId,
                assigned_to_name: assignee.full_name,
            },
        })

        // Create notification for the assignee
        await createNotification({
            userId: assignToUserId,
            fromUserId: user.id,
            fromUserName: assigner?.full_name || "Un usuario",
            type: "assignment",
            title: `Nueva asignación: ${entityDesc}`,
            message: `${assigner?.full_name || "Un usuario"} te asignó el ${entityLabel} "${entityDesc}"${clientName ? ` del cliente ${clientName}` : ""}.`,
            module: module || entityType,
            entityType,
            entityId,
        })

        return NextResponse.json({
            success: true,
            assignedTo: assignee.full_name,
        })
    } catch (error: any) {
        console.error("Error assigning:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
