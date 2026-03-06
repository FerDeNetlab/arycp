import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type DetailItem = {
    id: string
    title: string
    status: string
    date: string
    source: string
    href?: string
}

const STATUS_LABELS: Record<string, string> = {
    pendiente: "Pendiente",
    en_proceso: "En Proceso",
    completado: "Completado",
    cancelado: "Cancelado",
}

const PROCEDURE_TYPE_LABELS: Record<string, string> = {
    alta_patronal_imss: "Alta patronal ante el IMSS",
    alta_isn: "Alta de ISN",
    alta_trabajadores: "Alta de trabajadores",
    registro_patronal: "Registro patronal",
    e_firma: "e.Firma (FIEL)",
    csd: "CSD (Certificado Sello Digital)",
    constancia_fiscal: "Constancia de situación fiscal",
    opinion_cumplimiento: "Opinión de cumplimiento",
    domicilio_fiscal: "Cambio de domicilio fiscal",
}

export async function GET(request: NextRequest) {
    try {
        const serverClient = await createClient()
        const { data: { user } } = await serverClient.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 })
        }

        const type = request.nextUrl.searchParams.get("type")
        if (!type || !["active", "pending", "events", "alerts"].includes(type)) {
            return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
        }

        const supabase = createAdminClient()
        const items: DetailItem[] = []

        if (type === "active") {
            // Active procedures (pendiente + en_proceso)
            const { data: procs } = await supabase
                .from("procedures")
                .select("id, procedure_type, status, start_date, client_id")
                .in("status", ["pendiente", "en_proceso"])
                .order("start_date", { ascending: false })
                .limit(20)

            if (procs) {
                for (const p of procs) {
                    items.push({
                        id: p.id,
                        title: PROCEDURE_TYPE_LABELS[p.procedure_type] || p.procedure_type,
                        status: STATUS_LABELS[p.status] || p.status,
                        date: p.start_date,
                        source: "Trámite",
                        href: `/dashboard/procedures/${p.client_id}`,
                    })
                }
            }

            // Active fiscal obligations
            const { data: fiscal } = await supabase
                .from("fiscal_obligations")
                .select("id, description, status, due_date")
                .eq("status", "pendiente")
                .order("due_date", { ascending: true })
                .limit(20)

            if (fiscal) {
                for (const f of fiscal) {
                    items.push({
                        id: f.id,
                        title: f.description || "Obligación fiscal",
                        status: STATUS_LABELS[f.status] || f.status,
                        date: f.due_date,
                        source: "Fiscal",
                    })
                }
            }

            // Active legal processes
            const { data: legal } = await supabase
                .from("legal_processes")
                .select("id, title, status, created_at")
                .in("status", ["pendiente", "en_proceso"])
                .order("created_at", { ascending: false })
                .limit(20)

            if (legal) {
                for (const l of legal) {
                    items.push({
                        id: l.id,
                        title: l.title || "Proceso legal",
                        status: STATUS_LABELS[l.status] || l.status,
                        date: l.created_at,
                        source: "Legal",
                    })
                }
            }
        }

        if (type === "pending") {
            // Pending procedures
            const { data: procs } = await supabase
                .from("procedures")
                .select("id, procedure_type, status, start_date, client_id")
                .eq("status", "pendiente")
                .order("start_date", { ascending: false })
                .limit(20)

            if (procs) {
                for (const p of procs) {
                    items.push({
                        id: p.id,
                        title: PROCEDURE_TYPE_LABELS[p.procedure_type] || p.procedure_type,
                        status: "Pendiente",
                        date: p.start_date,
                        source: "Trámite",
                        href: `/dashboard/procedures/${p.client_id}`,
                    })
                }
            }

            // Pending fiscal obligations
            const { data: fiscal } = await supabase
                .from("fiscal_obligations")
                .select("id, description, status, due_date")
                .eq("status", "pendiente")
                .order("due_date", { ascending: true })
                .limit(20)

            if (fiscal) {
                for (const f of fiscal) {
                    items.push({
                        id: f.id,
                        title: f.description || "Obligación fiscal",
                        status: "Pendiente",
                        date: f.due_date,
                        source: "Fiscal",
                    })
                }
            }
        }

        if (type === "events") {
            const now = new Date()
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

            const { data: fiscal } = await supabase
                .from("fiscal_obligations")
                .select("id, description, status, due_date")
                .gte("due_date", now.toISOString().split("T")[0])
                .lte("due_date", nextWeek.toISOString().split("T")[0])
                .order("due_date", { ascending: true })
                .limit(20)

            if (fiscal) {
                for (const f of fiscal) {
                    items.push({
                        id: f.id,
                        title: f.description || "Obligación fiscal",
                        status: STATUS_LABELS[f.status] || f.status,
                        date: f.due_date,
                        source: "Evento fiscal",
                    })
                }
            }
        }

        if (type === "alerts") {
            const { data: notifs } = await supabase
                .from("notifications")
                .select("id, title, message, created_at")
                .eq("user_id", user.id)
                .eq("is_read", false)
                .order("created_at", { ascending: false })
                .limit(20)

            if (notifs) {
                for (const n of notifs) {
                    items.push({
                        id: n.id,
                        title: n.title || n.message || "Notificación",
                        status: "No leída",
                        date: n.created_at,
                        source: "Alerta",
                    })
                }
            }
        }

        return NextResponse.json({ items })
    } catch (error: unknown) {
        console.error("Error fetching dashboard details:", error)
        return NextResponse.json({ items: [] })
    }
}
