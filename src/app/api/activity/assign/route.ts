import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { logActivity, createNotification } from "@/lib/activity"
import { getErrorMessage } from "@/lib/api/errors"

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

        // Special handling for DIOT assignments (no DB table to update)
        if (entityType === "diot_assignment") {
            const debug: Record<string, unknown> = {}

            // entityId format: "clientId-year-month"
            const parts = entityId.split("-")
            const diotClientId = parts.slice(0, -2).join("-")
            const diotYear = parts[parts.length - 2]
            const diotMonth = parts[parts.length - 1]

            debug.entityId = entityId
            debug.parsedClientId = diotClientId
            debug.parsedYear = diotYear
            debug.parsedMonth = diotMonth
            debug.assignToUserId = assignToUserId
            debug.currentUserId = user.id

            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
            const monthName = monthNames[parseInt(diotMonth) - 1] || diotMonth

            // Get client name
            let clientName = ""
            if (diotClientId) {
                const { data: client, error: clientErr } = await supabase
                    .from("clients")
                    .select("business_name, name")
                    .eq("id", diotClientId)
                    .single()
                clientName = client?.business_name || client?.name || ""
                debug.clientLookup = { found: !!client, name: clientName, error: clientErr?.message }
            }

            const diotDesc = `DIOT ${monthName} ${diotYear}`

            // Log activity directly (entity_id is UUID column, so use null for DIOT)
            const { error: activityErr } = await supabase.from("activity_log").insert({
                user_id: user.id,
                user_name: assigner?.full_name || "Usuario",
                client_id: diotClientId || null,
                client_name: clientName || null,
                module: "accounting",
                action: "assigned",
                entity_type: "diot_assignment",
                entity_id: null,
                description: `${assigner?.full_name || "Un usuario"} asignó ${diotDesc} a ${assignee.full_name}${clientName ? ` (${clientName})` : ""}`,
                metadata: {
                    assigned_from: user.id,
                    assigned_to: assignToUserId,
                    assigned_to_name: assignee.full_name,
                    diot_year: diotYear,
                    diot_month: diotMonth,
                },
            })
            debug.activityInsert = activityErr ? { error: activityErr.message, code: activityErr.code, details: activityErr.details } : "OK"

            // Create notification directly (entity_id is UUID column, so use null for DIOT)
            const { error: notifError } = await supabase.from("notifications").insert({
                user_id: assignToUserId,
                from_user_id: user.id,
                from_user_name: assigner?.full_name || "Un usuario",
                type: "assignment",
                title: `DIOT listo: ${monthName} ${diotYear}`,
                message: `${assigner?.full_name || "Un usuario"} te asignó el DIOT de ${monthName} ${diotYear}${clientName ? ` del cliente ${clientName}` : ""}. La contabilidad del mes está lista.`,
                module: "accounting",
                entity_type: "diot_assignment",
                entity_id: null,
            })
            debug.notificationInsert = notifError ? { error: notifError.message, code: notifError.code, details: notifError.details } : "OK"

            return NextResponse.json({
                success: true,
                assignedTo: assignee.full_name,
            })
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
    } catch (error: unknown) {
        console.error("Error assigning:", error)
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
    }
}
