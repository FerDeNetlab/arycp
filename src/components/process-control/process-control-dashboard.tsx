"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    ClipboardCheck,
    FileText,
    Scale,
    Briefcase,
    Calculator,
    Clock,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    Calendar,
    DollarSign,
    FileCheck,
    Gavel,
    Users,
    ChevronDown,
    ChevronRight,
    ArrowRight,
    CircleDot,
    AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface ActivityItem {
    id: string
    type: string
    module: string
    description: string
    client_name?: string
    status?: string
    date: string
}

interface ModuleStats {
    label: string
    total: number
    completed: number
    pending: number
    icon: React.ElementType
    color: string
    bgColor: string
}

interface PendingItem {
    id: string
    module: string
    moduleLabel: string
    moduleColor: string
    moduleBgColor: string
    moduleIcon: React.ElementType
    clientId: string
    clientName: string
    title: string
    description: string
    actionNeeded: string
    status: string
    urgency: "high" | "medium" | "low"
    createdAt: string
    dueDate?: string
}

interface ClientSummary {
    client_id: string
    client_name: string
    pendingFiscal: number
    pendingPayments: number
    pendingCases: number
    pendingProcedures: number
    pendingLabor: number
}

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export function ProcessControlDashboard() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [filterModule, setFilterModule] = useState("all")

    // Data states
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
    const [moduleStats, setModuleStats] = useState<ModuleStats[]>([])
    const [clientSummaries, setClientSummaries] = useState<ClientSummary[]>([])
    const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({ fiscal: true, legal: true, procedures: true, labor: true, accounting: true })

    // Totals
    const [totalPending, setTotalPending] = useState(0)
    const [totalCompleted, setTotalCompleted] = useState(0)
    const [totalThisMonth, setTotalThisMonth] = useState(0)
    const [totalClients, setTotalClients] = useState(0)

    useEffect(() => {
        initUser()
    }, [])

    useEffect(() => {
        if (userId) {
            loadAllData()
        }
    }, [userId, selectedMonth, selectedYear])

    const initUser = async () => {
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
            setUserId(data.user.id)
        }
    }

    const loadAllData = async () => {
        if (!userId) return
        setLoading(true)
        await Promise.all([
            loadRecentActivity(),
            loadModuleStats(),
            loadClientSummaries(),
            loadPendingItems(),
        ])
        setLoading(false)
    }

    const loadRecentActivity = async () => {
        if (!userId) return
        const activities: ActivityItem[] = []
        const seenIds = new Set<string>()

        // Helper: add activity, skip duplicates
        const addActivity = (item: ActivityItem) => {
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id)
                activities.push(item)
            }
        }

        // Fiscal obligations
        const { data: obligations } = await supabase
            .from("fiscal_obligations")
            .select("id, obligation_type, status, created_at, client_id")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10)

        if (obligations) {
            for (const ob of obligations) {
                const clientName = await getClientName(ob.client_id)
                addActivity({
                    id: `fo-${ob.id}`, type: "obligation", module: "fiscal",
                    description: `${ob.obligation_type}`, client_name: clientName,
                    status: ob.status, date: ob.created_at,
                })
            }
        }

        // Fiscal payments
        const { data: payments } = await supabase
            .from("fiscal_payments")
            .select("id, amount, status, created_at, client_id")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10)

        if (payments) {
            for (const pay of payments) {
                const clientName = await getClientName(pay.client_id)
                addActivity({
                    id: `fp-${pay.id}`, type: "payment", module: "fiscal",
                    description: `Pago $${pay.amount?.toLocaleString() || 0}`, client_name: clientName,
                    status: pay.status, date: pay.created_at,
                })
            }
        }

        // Judicial cases
        const { data: cases } = await supabase
            .from("judicial_cases")
            .select("id, case_type, case_number, status, created_at, client_id")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10)

        if (cases) {
            for (const c of cases) {
                const clientName = await getClientName(c.client_id)
                addActivity({
                    id: `jc-${c.id}`, type: "case", module: "legal",
                    description: `Caso ${c.case_type} ${c.case_number || ""}`, client_name: clientName,
                    status: c.status, date: c.created_at,
                })
            }
        }

        // Procedures (user_id OR assigned_to)
        const { data: procs } = await supabase
            .from("procedures")
            .select("id, procedure_type, status, created_at, client_id")
            .or(`user_id.eq.${userId},assigned_to.eq.${userId}`)
            .order("created_at", { ascending: false })
            .limit(15)

        if (procs) {
            for (const p of procs) {
                const clientName = await getClientName(p.client_id)
                addActivity({
                    id: `pr-${p.id}`, type: "procedure", module: "procedures",
                    description: `Trámite: ${formatProcedureType(p.procedure_type)}`, client_name: clientName,
                    status: p.status, date: p.created_at,
                })
            }
        }

        // Labor payroll
        const { data: payrolls } = await supabase
            .from("labor_payroll")
            .select("id, period_type, status, created_at, client_id")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10)

        if (payrolls) {
            for (const lr of payrolls) {
                const clientName = await getClientName(lr.client_id)
                addActivity({
                    id: `lp-${lr.id}`, type: "payroll", module: "labor",
                    description: `Nómina ${lr.period_type || ""}`, client_name: clientName,
                    status: lr.status, date: lr.created_at,
                })
            }
        }

        // Monthly declarations (accounting)
        const { data: declarations } = await supabase
            .from("monthly_declarations")
            .select("id, month, year, status, created_at, client_id")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10)

        if (declarations) {
            for (const d of declarations) {
                const clientName = await getClientName(d.client_id)
                addActivity({
                    id: `md-${d.id}`, type: "declaration", module: "accounting",
                    description: `Declaración ${MONTHS[(d.month || 1) - 1]} ${d.year || ""}`, client_name: clientName,
                    status: d.status, date: d.created_at,
                })
            }
        }

        // Sort by date
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setRecentActivity(activities.slice(0, 30))

        // Calculate totals (pending count comes from pending items, but recalculate here too)
        const pending = activities.filter(a =>
            a.status === "pendiente" || a.status === "en_proceso" || a.status === "activo"
        ).length
        const completed = activities.filter(a =>
            a.status === "pagado" || a.status === "completado" || a.status === "presentada" || a.status === "pagada" || a.status === "concluido"
        ).length
        const thisMonth = activities.filter(a => {
            const d = new Date(a.date)
            return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear
        }).length

        setTotalPending(pending)
        setTotalCompleted(completed)
        setTotalThisMonth(thisMonth)
    }

    const loadPendingItems = async () => {
        if (!userId) return
        const items: PendingItem[] = []
        const seenIds = new Set<string>()

        // Helper to avoid duplicates
        const addItem = (item: PendingItem) => {
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id)
                items.push(item)
            }
        }

        // --- Unread Notifications (Assignments) ---
        // These are the most important: things assigned TO this user
        const { data: unreadNotifs } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .eq("is_read", false)
            .order("created_at", { ascending: false })

        if (unreadNotifs) {
            for (const notif of unreadNotifs) {
                const moduleMap: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
                    procedure: { label: "Tramitología", color: "text-cyan-600", bgColor: "bg-cyan-100", icon: ClipboardCheck },
                    fiscal_obligation: { label: "Fiscal", color: "text-orange-600", bgColor: "bg-orange-100", icon: FileText },
                    legal_process: { label: "Jurídico", color: "text-purple-600", bgColor: "bg-purple-100", icon: Scale },
                    fiscal: { label: "Fiscal", color: "text-orange-600", bgColor: "bg-orange-100", icon: FileText },
                    legal: { label: "Jurídico", color: "text-purple-600", bgColor: "bg-purple-100", icon: Scale },
                    labor: { label: "Laboral", color: "text-green-600", bgColor: "bg-green-100", icon: Briefcase },
                    accounting: { label: "Contabilidad", color: "text-blue-600", bgColor: "bg-blue-100", icon: Calculator },
                    procedures: { label: "Tramitología", color: "text-cyan-600", bgColor: "bg-cyan-100", icon: ClipboardCheck },
                }
                const mod = moduleMap[notif.module || notif.entity_type || ""] || moduleMap.procedure
                const modKey = notif.module === "procedure" ? "procedures" : (notif.module || "procedures")

                addItem({
                    id: `notif-${notif.id}`, module: modKey, moduleLabel: mod.label, moduleColor: mod.color,
                    moduleBgColor: mod.bgColor, moduleIcon: mod.icon, clientId: "", clientName: notif.from_user_name || "",
                    title: notif.title || "Nueva asignación",
                    description: notif.message || "Se te asignó una nueva tarea",
                    actionNeeded: notif.message || "Revisar y atender la asignación",
                    status: "pendiente", urgency: "high", createdAt: notif.created_at,
                })
            }
        }

        // --- Fiscal Obligations ---
        const { data: fiscalPending } = await supabase
            .from("fiscal_obligations")
            .select("id, obligation_type, status, due_date, created_at, client_id")
            .eq("user_id", userId)
            .in("status", ["pendiente", "en_proceso"])
            .order("due_date", { ascending: true })

        if (fiscalPending) {
            for (const ob of fiscalPending) {
                const clientName = await getClientName(ob.client_id)
                const dueDate = ob.due_date ? new Date(ob.due_date) : null
                const now = new Date()
                const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
                let urgency: "high" | "medium" | "low" = "low"
                if (daysUntilDue !== null && daysUntilDue <= 3) urgency = "high"
                else if (daysUntilDue !== null && daysUntilDue <= 7) urgency = "medium"
                else if (ob.status === "pendiente") urgency = "medium"

                const actionNeeded = ob.status === "pendiente"
                    ? `Presentar ${ob.obligation_type}${dueDate ? ` antes del ${dueDate.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}` : ""}`
                    : `Completar ${ob.obligation_type} (en proceso)`

                addItem({
                    id: `fo-${ob.id}`, module: "fiscal", moduleLabel: "Fiscal", moduleColor: "text-orange-600",
                    moduleBgColor: "bg-orange-100", moduleIcon: FileText, clientId: ob.client_id, clientName,
                    title: ob.obligation_type, description: `Obligación fiscal para ${clientName}`,
                    actionNeeded, status: ob.status, urgency, createdAt: ob.created_at, dueDate: ob.due_date,
                })
            }
        }

        // --- Fiscal Payments ---
        const { data: paymentsPending } = await supabase
            .from("fiscal_payments")
            .select("id, amount, tax_type, status, due_date, created_at, client_id")
            .eq("user_id", userId)
            .eq("status", "pendiente")
            .order("due_date", { ascending: true })

        if (paymentsPending) {
            for (const pay of paymentsPending) {
                const clientName = await getClientName(pay.client_id)
                const dueDate = pay.due_date ? new Date(pay.due_date) : null
                const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
                let urgency: "high" | "medium" | "low" = "medium"
                if (daysUntilDue !== null && daysUntilDue <= 3) urgency = "high"

                addItem({
                    id: `fp-${pay.id}`, module: "fiscal", moduleLabel: "Fiscal", moduleColor: "text-orange-600",
                    moduleBgColor: "bg-orange-100", moduleIcon: DollarSign, clientId: pay.client_id, clientName,
                    title: `Pago ${pay.tax_type || "fiscal"} - $${(pay.amount || 0).toLocaleString()}`,
                    description: `Pago pendiente para ${clientName}`,
                    actionNeeded: `Realizar pago de $${(pay.amount || 0).toLocaleString()}${dueDate ? ` antes del ${dueDate.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}` : ""}`,
                    status: pay.status, urgency, createdAt: pay.created_at, dueDate: pay.due_date,
                })
            }
        }

        // --- Judicial Cases ---
        const { data: casesPending } = await supabase
            .from("judicial_cases")
            .select("id, case_type, case_number, status, next_hearing_date, created_at, client_id")
            .eq("user_id", userId)
            .in("status", ["activo", "en_proceso"])
            .order("created_at", { ascending: false })

        if (casesPending) {
            for (const c of casesPending) {
                const clientName = await getClientName(c.client_id)
                const hearingDate = c.next_hearing_date ? new Date(c.next_hearing_date) : null
                const daysUntilHearing = hearingDate ? Math.ceil((hearingDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
                let urgency: "high" | "medium" | "low" = "medium"
                if (daysUntilHearing !== null && daysUntilHearing <= 5) urgency = "high"

                const actionNeeded = hearingDate
                    ? `Próxima audiencia: ${hearingDate.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })} — Preparar expediente`
                    : c.status === "activo" ? "Dar seguimiento al caso y actualizar estatus" : "Continuar con el proceso legal"

                addItem({
                    id: `jc-${c.id}`, module: "legal", moduleLabel: "Jurídico", moduleColor: "text-purple-600",
                    moduleBgColor: "bg-purple-100", moduleIcon: Scale, clientId: c.client_id, clientName,
                    title: `${c.case_type}${c.case_number ? " #" + c.case_number : ""}`,
                    description: `Caso jurídico de ${clientName}`, actionNeeded,
                    status: c.status, urgency, createdAt: c.created_at, dueDate: c.next_hearing_date,
                })
            }
        }

        // --- Procedures (user_id OR assigned_to) ---
        const { data: procsPending } = await supabase
            .from("procedures")
            .select("id, procedure_type, status, start_date, created_at, client_id")
            .or(`user_id.eq.${userId},assigned_to.eq.${userId}`)
            .in("status", ["pendiente", "en_proceso"])
            .order("created_at", { ascending: false })

        if (procsPending) {
            for (const p of procsPending) {
                const clientName = await getClientName(p.client_id)
                const typeName = formatProcedureType(p.procedure_type)
                let urgency: "high" | "medium" | "low" = p.status === "pendiente" ? "medium" : "low"
                const startDate = new Date(p.start_date || p.created_at)
                const daysSinceStart = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                if (daysSinceStart > 15) urgency = "high"
                else if (daysSinceStart > 7) urgency = "medium"

                const actionNeeded = p.status === "pendiente"
                    ? `Iniciar trámite de ${typeName}${daysSinceStart > 7 ? " (lleva " + daysSinceStart + " días sin avance)" : ""}`
                    : `Completar y marcar como terminado el trámite de ${typeName}`

                addItem({
                    id: `pr-${p.id}`, module: "procedures", moduleLabel: "Tramitología", moduleColor: "text-cyan-600",
                    moduleBgColor: "bg-cyan-100", moduleIcon: ClipboardCheck, clientId: p.client_id, clientName,
                    title: typeName, description: `Trámite de ${clientName}`, actionNeeded,
                    status: p.status, urgency, createdAt: p.created_at,
                })
            }
        }

        // --- Labor Payroll ---
        const { data: laborPending } = await supabase
            .from("labor_payroll")
            .select("id, period_type, period_number, status, created_at, client_id")
            .eq("user_id", userId)
            .in("status", ["pendiente", "en_proceso"])
            .order("created_at", { ascending: false })

        if (laborPending) {
            for (const lr of laborPending) {
                const clientName = await getClientName(lr.client_id)
                const urgency: "high" | "medium" | "low" = lr.status === "pendiente" ? "medium" : "low"

                const actionNeeded = lr.status === "pendiente"
                    ? `Procesar y timbrar nómina ${lr.period_type || ""} #${lr.period_number || ""}`
                    : `Completar proceso de nómina ${lr.period_type || ""} (en proceso)`

                addItem({
                    id: `lp-${lr.id}`, module: "labor", moduleLabel: "Laboral", moduleColor: "text-green-600",
                    moduleBgColor: "bg-green-100", moduleIcon: Briefcase, clientId: lr.client_id, clientName,
                    title: `Nómina ${lr.period_type || ""} ${lr.period_number ? "#" + lr.period_number : ""}`,
                    description: `Nómina de ${clientName}`, actionNeeded,
                    status: lr.status, urgency, createdAt: lr.created_at,
                })
            }
        }

        // --- Accounting Declarations ---
        const { data: declPending } = await supabase
            .from("monthly_declarations")
            .select("id, month, year, status, created_at, client_id")
            .eq("user_id", userId)
            .in("status", ["pendiente", "en_proceso"])
            .order("year", { ascending: false })

        if (declPending) {
            for (const d of declPending) {
                const clientName = await getClientName(d.client_id)
                const urgency: "high" | "medium" | "low" = "medium"

                const actionNeeded = d.status === "pendiente"
                    ? `Presentar declaración de ${MONTHS[(d.month || 1) - 1]} ${d.year || ""}`
                    : `Finalizar declaración de ${MONTHS[(d.month || 1) - 1]} ${d.year || ""} (en proceso)`

                addItem({
                    id: `md-${d.id}`, module: "accounting", moduleLabel: "Contabilidad", moduleColor: "text-blue-600",
                    moduleBgColor: "bg-blue-100", moduleIcon: Calculator, clientId: d.client_id, clientName,
                    title: `Declaración ${MONTHS[(d.month || 1) - 1]} ${d.year || ""}`,
                    description: `Declaración mensual de ${clientName}`, actionNeeded,
                    status: d.status, urgency, createdAt: d.created_at,
                })
            }
        }

        // Sort: high urgency first, then medium, then low
        const urgencyOrder = { high: 0, medium: 1, low: 2 }
        items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])

        setPendingItems(items)

        // Update totalPending to reflect real pending count
        setTotalPending(items.length)
    }

    const toggleModule = (module: string) => {
        setExpandedModules(prev => ({ ...prev, [module]: !prev[module] }))
    }

    const loadModuleStats = async () => {
        if (!userId) return

        const stats: ModuleStats[] = []

        // Fiscal
        const { data: fiscalAll } = await supabase
            .from("fiscal_obligations")
            .select("id, status")
            .eq("user_id", userId)

        if (fiscalAll) {
            const pending = fiscalAll.filter(f => f.status === "pendiente" || f.status === "en_proceso").length
            const completed = fiscalAll.filter(f => f.status === "presentada" || f.status === "pagada").length
            stats.push({
                label: "Fiscal",
                total: fiscalAll.length,
                completed,
                pending,
                icon: FileText,
                color: "text-orange-600",
                bgColor: "bg-orange-100",
            })
        }

        // Legal
        const { data: legalAll } = await supabase
            .from("judicial_cases")
            .select("id, status")
            .eq("user_id", userId)

        if (legalAll) {
            const pending = legalAll.filter(l => l.status === "activo" || l.status === "en_proceso").length
            const completed = legalAll.filter(l => l.status === "concluido").length
            stats.push({
                label: "Jurídico",
                total: legalAll.length,
                completed,
                pending,
                icon: Scale,
                color: "text-purple-600",
                bgColor: "bg-purple-100",
            })
        }

        // Labor
        const { data: laborAll } = await supabase
            .from("labor_payroll")
            .select("id, status")
            .eq("user_id", userId)

        if (laborAll) {
            const pending = laborAll.filter(l => l.status === "pendiente" || l.status === "en_proceso").length
            const completed = laborAll.filter(l => l.status === "timbrado" || l.status === "enviado").length
            stats.push({
                label: "Laboral",
                total: laborAll.length,
                completed,
                pending,
                icon: Briefcase,
                color: "text-green-600",
                bgColor: "bg-green-100",
            })
        }

        // Procedures (user_id OR assigned_to)
        const { data: procsAll } = await supabase
            .from("procedures")
            .select("id, status")
            .or(`user_id.eq.${userId},assigned_to.eq.${userId}`)

        if (procsAll) {
            // Deduplicate by id
            const uniqueProcs = Array.from(new Map(procsAll.map((p: any) => [p.id, p])).values()) as any[]
            const pending = uniqueProcs.filter((p: any) => p.status === "pendiente" || p.status === "en_proceso").length
            const completed = uniqueProcs.filter((p: any) => p.status === "completado").length
            stats.push({
                label: "Tramitología",
                total: uniqueProcs.length,
                completed,
                pending,
                icon: ClipboardCheck,
                color: "text-cyan-600",
                bgColor: "bg-cyan-100",
            })
        }

        // Accounting declarations
        const { data: declAll } = await supabase
            .from("monthly_declarations")
            .select("id, status")
            .eq("user_id", userId)

        if (declAll) {
            const pending = declAll.filter(d => d.status === "pendiente" || d.status === "en_proceso").length
            const completed = declAll.filter(d => d.status === "presentada" || d.status === "enviada").length
            stats.push({
                label: "Contabilidad",
                total: declAll.length,
                completed,
                pending,
                icon: Calculator,
                color: "text-blue-600",
                bgColor: "bg-blue-100",
            })
        }

        setModuleStats(stats)
    }

    const loadClientSummaries = async () => {
        if (!userId) return

        // Get distinct client_ids from all modules for this user
        const clientIds = new Set<string>()

        const tablesUserOnly = [
            "fiscal_obligations",
            "fiscal_payments",
            "judicial_cases",
            "labor_payroll",
            "monthly_declarations",
        ]

        for (const table of tablesUserOnly) {
            const { data } = await supabase
                .from(table)
                .select("client_id")
                .eq("user_id", userId)

            if (data) {
                data.forEach((d: { client_id: string }) => clientIds.add(d.client_id))
            }
        }

        // Procedures: also check assigned_to
        const { data: procClients } = await supabase
            .from("procedures")
            .select("client_id")
            .or(`user_id.eq.${userId},assigned_to.eq.${userId}`)

        if (procClients) {
            procClients.forEach((d: { client_id: string }) => clientIds.add(d.client_id))
        }

        setTotalClients(clientIds.size)

        // For each client, get pending counts
        const summaries: ClientSummary[] = []

        for (const cid of clientIds) {
            const clientName = await getClientName(cid)

            const { data: fo } = await supabase
                .from("fiscal_obligations")
                .select("id")
                .eq("user_id", userId)
                .eq("client_id", cid)
                .in("status", ["pendiente", "en_proceso"])

            const { data: fp } = await supabase
                .from("fiscal_payments")
                .select("id")
                .eq("user_id", userId)
                .eq("client_id", cid)
                .eq("status", "pendiente")

            const { data: jc } = await supabase
                .from("judicial_cases")
                .select("id")
                .eq("user_id", userId)
                .eq("client_id", cid)
                .in("status", ["activo", "en_proceso"])

            const { data: pr } = await supabase
                .from("procedures")
                .select("id")
                .or(`user_id.eq.${userId},assigned_to.eq.${userId}`)
                .eq("client_id", cid)
                .in("status", ["pendiente", "en_proceso"])

            const { data: lp } = await supabase
                .from("labor_payroll")
                .select("id")
                .eq("user_id", userId)
                .eq("client_id", cid)
                .in("status", ["pendiente", "en_proceso"])

            const pending = (fo?.length || 0) + (fp?.length || 0) + (jc?.length || 0) + (pr?.length || 0) + (lp?.length || 0)

            if (pending > 0 || true) { // Show all clients
                summaries.push({
                    client_id: cid,
                    client_name: clientName,
                    pendingFiscal: fo?.length || 0,
                    pendingPayments: fp?.length || 0,
                    pendingCases: jc?.length || 0,
                    pendingProcedures: pr?.length || 0,
                    pendingLabor: lp?.length || 0,
                })
            }
        }

        // Sort by total pending
        summaries.sort((a, b) => {
            const totalA = a.pendingFiscal + a.pendingPayments + a.pendingCases + a.pendingProcedures + a.pendingLabor
            const totalB = b.pendingFiscal + b.pendingPayments + b.pendingCases + b.pendingProcedures + b.pendingLabor
            return totalB - totalA
        })

        setClientSummaries(summaries)
    }

    // Client name cache
    const clientNameCache: Record<string, string> = {}
    const getClientName = async (clientId: string): Promise<string> => {
        if (clientNameCache[clientId]) return clientNameCache[clientId]

        const { data } = await supabase
            .from("clients")
            .select("name, business_name")
            .eq("id", clientId)
            .single()

        const name = data?.business_name || data?.name || "Cliente"
        clientNameCache[clientId] = name
        return name
    }

    const formatProcedureType = (type: string) => {
        const map: Record<string, string> = {
            alta_patronal_imss: "Alta patronal IMSS",
            alta_representante_legal: "Alta representante legal",
            efirma: "e.firma",
            sello_digital: "Sello Digital",
            opinion_cumplimiento: "Opinión de Cumplimiento",
            registro_publico: "Registro Público",
            otro: "Otro trámite",
        }
        return map[type] || type
    }

    const getModuleIcon = (module: string) => {
        switch (module) {
            case "fiscal": return <FileText className="h-4 w-4 text-orange-600" />
            case "legal": return <Scale className="h-4 w-4 text-purple-600" />
            case "labor": return <Briefcase className="h-4 w-4 text-green-600" />
            case "procedures": return <ClipboardCheck className="h-4 w-4 text-cyan-600" />
            case "accounting": return <Calculator className="h-4 w-4 text-blue-600" />
            default: return <FileText className="h-4 w-4" />
        }
    }

    const getModuleLabel = (module: string) => {
        switch (module) {
            case "fiscal": return "Fiscal"
            case "legal": return "Jurídico"
            case "labor": return "Laboral"
            case "procedures": return "Tramitología"
            case "accounting": return "Contabilidad"
            default: return module
        }
    }

    const getStatusBadge = (status?: string) => {
        if (!status) return null
        switch (status) {
            case "pendiente":
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
            case "en_proceso":
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs"><Clock className="h-3 w-3 mr-1" />En Proceso</Badge>
            case "activo":
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Activo</Badge>
            case "presentada":
            case "pagada":
            case "pagado":
            case "completado":
            case "concluido":
            case "timbrado":
            case "enviado":
            case "enviada":
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Completado</Badge>
            case "cancelado":
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">Cancelado</Badge>
            default:
                return <Badge variant="outline" className="text-xs">{status}</Badge>
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffHours < 1) return "Hace unos minutos"
        if (diffHours < 24) return `Hace ${diffHours}h`
        if (diffDays < 7) return `Hace ${diffDays}d`
        return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
    }

    const filteredActivity = filterModule === "all"
        ? recentActivity
        : recentActivity.filter(a => a.module === filterModule)

    if (loading) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                Cargando tu panel de control...
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Resumen General */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-yellow-200 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-yellow-700" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-yellow-800">{totalPending}</p>
                                <p className="text-xs text-yellow-600">Pendientes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-green-200 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-green-700" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-800">{totalCompleted}</p>
                                <p className="text-xs text-green-600">Completados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-200 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-blue-700" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-800">{totalThisMonth}</p>
                                <p className="text-xs text-blue-600">Este Mes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-200 flex items-center justify-center">
                                <Users className="h-5 w-5 text-emerald-700" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-emerald-800">{totalClients}</p>
                                <p className="text-xs text-emerald-600">Clientes Atendidos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resumen de Pendientes - Detallado y Accionable */}
            <Card className="border-2">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-emerald-600" />
                            Pendientes por Resolver
                            {pendingItems.length > 0 && (
                                <Badge className="bg-red-100 text-red-700 ml-2">{pendingItems.length}</Badge>
                            )}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span>Urgente</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500 inline-block"></span>Medio</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 inline-block"></span>Normal</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {pendingItems.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                            <p className="text-sm font-medium text-green-700">¡Todo al día!</p>
                            <p className="text-xs text-muted-foreground">No tienes pendientes por resolver</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Group by module */}
                            {["fiscal", "procedures", "legal", "labor", "accounting"].map(mod => {
                                const moduleItems = pendingItems.filter(i => i.module === mod)
                                if (moduleItems.length === 0) return null
                                const isExpanded = expandedModules[mod]
                                const firstItem = moduleItems[0]
                                const highCount = moduleItems.filter(i => i.urgency === "high").length

                                return (
                                    <div key={mod} className="border rounded-xl overflow-hidden">
                                        {/* Module header - clickable */}
                                        <button
                                            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                                            onClick={() => toggleModule(mod)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`h-8 w-8 rounded-lg ${firstItem.moduleBgColor} flex items-center justify-center`}>
                                                    <firstItem.moduleIcon className={`h-4 w-4 ${firstItem.moduleColor}`} />
                                                </div>
                                                <span className="font-semibold text-sm">{firstItem.moduleLabel}</span>
                                                <Badge variant="outline" className="text-xs">{moduleItems.length} pendiente{moduleItems.length > 1 ? "s" : ""}</Badge>
                                                {highCount > 0 && (
                                                    <Badge className="bg-red-100 text-red-700 text-xs">{highCount} urgente{highCount > 1 ? "s" : ""}</Badge>
                                                )}
                                            </div>
                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                        </button>

                                        {/* Expanded items */}
                                        {isExpanded && (
                                            <div className="border-t divide-y">
                                                {moduleItems.map(item => (
                                                    <div key={item.id} className="p-3 hover:bg-muted/30 transition-colors">
                                                        <div className="flex items-start gap-3">
                                                            {/* Urgency indicator */}
                                                            <div className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${item.urgency === "high" ? "bg-red-500 animate-pulse" :
                                                                item.urgency === "medium" ? "bg-yellow-500" : "bg-green-500"
                                                                }`} />

                                                            <div className="flex-1 min-w-0">
                                                                {/* Title and client */}
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-medium text-sm">{item.title}</span>
                                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.clientName}</Badge>
                                                                    {item.status === "en_proceso" && (
                                                                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">En proceso</Badge>
                                                                    )}
                                                                </div>

                                                                {/* Action needed - the key info */}
                                                                <div className="flex items-start gap-1.5 mt-1.5">
                                                                    <ArrowRight className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                                                    <span className="text-sm text-emerald-700 font-medium">{item.actionNeeded}</span>
                                                                </div>

                                                                {/* Due date if applicable */}
                                                                {item.dueDate && (
                                                                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                                        <Calendar className="h-3 w-3" />
                                                                        <span>Vence: {new Date(item.dueDate).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Progreso por Módulo - Barras */}
            <Card className="border-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        Progreso General
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {moduleStats.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay datos registrados aún</p>
                    ) : (
                        <div className="space-y-4">
                            {moduleStats.map((stat) => {
                                const Icon = stat.icon
                                const percentage = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0
                                return (
                                    <div key={stat.label} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-8 w-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                                </div>
                                                <span className="font-medium text-sm">{stat.label}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className="text-muted-foreground">
                                                    {stat.completed}/{stat.total}
                                                </span>
                                                {stat.pending > 0 && (
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                                                        {stat.pending} pendientes
                                                    </Badge>
                                                )}
                                                <span className="font-semibold">{percentage}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full transition-all duration-500 ${percentage === 100 ? "bg-green-500" :
                                                    percentage >= 50 ? "bg-emerald-500" :
                                                        percentage >= 25 ? "bg-yellow-500" :
                                                            "bg-red-400"
                                                    }`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pendientes por Cliente */}
            <Card className="border-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-600" />
                        Pendientes por Cliente
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {clientSummaries.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay clientes registrados</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-2 font-semibold">Cliente</th>
                                        <th className="pb-2 font-semibold text-center">
                                            <div className="flex items-center justify-center gap-1"><FileText className="h-3 w-3 text-orange-600" /> Fiscal</div>
                                        </th>
                                        <th className="pb-2 font-semibold text-center">
                                            <div className="flex items-center justify-center gap-1"><DollarSign className="h-3 w-3 text-green-600" /> Pagos</div>
                                        </th>
                                        <th className="pb-2 font-semibold text-center">
                                            <div className="flex items-center justify-center gap-1"><Scale className="h-3 w-3 text-purple-600" /> Legal</div>
                                        </th>
                                        <th className="pb-2 font-semibold text-center">
                                            <div className="flex items-center justify-center gap-1"><ClipboardCheck className="h-3 w-3 text-cyan-600" /> Trámites</div>
                                        </th>
                                        <th className="pb-2 font-semibold text-center">
                                            <div className="flex items-center justify-center gap-1"><Briefcase className="h-3 w-3 text-green-600" /> Laboral</div>
                                        </th>
                                        <th className="pb-2 font-semibold text-center">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientSummaries.map((cs) => {
                                        const total = cs.pendingFiscal + cs.pendingPayments + cs.pendingCases + cs.pendingProcedures + cs.pendingLabor
                                        return (
                                            <tr key={cs.client_id} className="border-b hover:bg-muted/50 transition-colors">
                                                <td className="py-3 font-medium">{cs.client_name}</td>
                                                <td className="py-3 text-center">
                                                    {cs.pendingFiscal > 0 ? (
                                                        <Badge className="bg-orange-100 text-orange-700">{cs.pendingFiscal}</Badge>
                                                    ) : <span className="text-muted-foreground">—</span>}
                                                </td>
                                                <td className="py-3 text-center">
                                                    {cs.pendingPayments > 0 ? (
                                                        <Badge className="bg-yellow-100 text-yellow-700">{cs.pendingPayments}</Badge>
                                                    ) : <span className="text-muted-foreground">—</span>}
                                                </td>
                                                <td className="py-3 text-center">
                                                    {cs.pendingCases > 0 ? (
                                                        <Badge className="bg-purple-100 text-purple-700">{cs.pendingCases}</Badge>
                                                    ) : <span className="text-muted-foreground">—</span>}
                                                </td>
                                                <td className="py-3 text-center">
                                                    {cs.pendingProcedures > 0 ? (
                                                        <Badge className="bg-cyan-100 text-cyan-700">{cs.pendingProcedures}</Badge>
                                                    ) : <span className="text-muted-foreground">—</span>}
                                                </td>
                                                <td className="py-3 text-center">
                                                    {cs.pendingLabor > 0 ? (
                                                        <Badge className="bg-green-100 text-green-700">{cs.pendingLabor}</Badge>
                                                    ) : <span className="text-muted-foreground">—</span>}
                                                </td>
                                                <td className="py-3 text-center">
                                                    {total > 0 ? (
                                                        <Badge className="bg-red-100 text-red-700 font-bold">{total}</Badge>
                                                    ) : (
                                                        <Badge className="bg-green-100 text-green-700">✓ Al día</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actividad Reciente */}
            <Card className="border-2">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-emerald-600" />
                            Actividad Reciente
                        </CardTitle>
                        <Select value={filterModule} onValueChange={setFilterModule}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Filtrar módulo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="fiscal">Fiscal</SelectItem>
                                <SelectItem value="legal">Jurídico</SelectItem>
                                <SelectItem value="labor">Laboral</SelectItem>
                                <SelectItem value="procedures">Tramitología</SelectItem>
                                <SelectItem value="accounting">Contabilidad</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredActivity.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No hay actividad registrada</p>
                    ) : (
                        <div className="space-y-3">
                            {filteredActivity.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                >
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {getModuleIcon(activity.module)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm truncate">{activity.description}</span>
                                            {getStatusBadge(activity.status)}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                {getModuleLabel(activity.module)}
                                            </Badge>
                                            {activity.client_name && (
                                                <span>• {activity.client_name}</span>
                                            )}
                                            <span>• {formatDate(activity.date)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
