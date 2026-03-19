"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Send, Paperclip, AlertTriangle } from "lucide-react"
import { InvoiceRequestFields, createEmptyInvoiceData, type InvoiceData } from "./invoice-request-fields"
import { isInvoiceFormType, type InvoiceFormType } from "@/lib/constants/invoice-fields"

// Request types per module
const MODULE_REQUEST_TYPES: Record<string, { label: string; value: string }[]> = {
    invoicing: [
        { label: "Factura — Persona Física", value: "factura_pf" },
        { label: "Factura — Persona Moral", value: "factura_pm" },
        { label: "Factura — RESICO", value: "factura_resico" },
        { label: "Factura — Otro tipo", value: "factura_otro" },
        { label: "Cancelación de factura", value: "cancelacion" },
        { label: "Nota de crédito", value: "nota_credito" },
    ],
    procedures: [
        { label: "Trámite nuevo", value: "tramite_nuevo" },
        { label: "Modificación de trámite", value: "tramite_modificacion" },
        { label: "Consulta sobre trámite", value: "tramite_consulta" },
    ],
    fiscal: [
        { label: "Declaración fiscal", value: "declaracion" },
        { label: "Consulta fiscal", value: "consulta_fiscal" },
        { label: "Devolución de impuestos", value: "devolucion" },
    ],
    accounting: [
        { label: "Reporte contable", value: "reporte_contable" },
        { label: "Consulta contable", value: "consulta_contable" },
    ],
    legal: [
        { label: "Consulta legal", value: "consulta_legal" },
        { label: "Trámite legal", value: "tramite_legal" },
    ],
    labor: [
        { label: "Nómina", value: "nomina" },
        { label: "Alta/Baja IMSS", value: "alta_baja_imss" },
        { label: "Incidencia laboral", value: "incidencia" },
        { label: "Consulta laboral", value: "consulta_laboral" },
    ],
    general: [
        { label: "Solicitud general", value: "general" },
        { label: "Otro", value: "otro" },
    ],
}

const MODULE_LABELS: Record<string, string> = {
    invoicing: "Facturación",
    procedures: "Trámites",
    fiscal: "Fiscal",
    accounting: "Contabilidad",
    legal: "Jurídico",
    labor: "Laboral",
    general: "General",
}

interface RequestFormProps {
    open: boolean
    onClose: () => void
    module: string
    clientId: string
    clientName: string
    onSuccess?: () => void
}

export function RequestForm({ open, onClose, module, clientId, clientName, onSuccess }: RequestFormProps) {
    const [requestType, setRequestType] = useState("")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [priority, setPriority] = useState("normal")
    const [files, setFiles] = useState<File[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [invoiceData, setInvoiceData] = useState<InvoiceData>(createEmptyInvoiceData())

    const types = MODULE_REQUEST_TYPES[module] || MODULE_REQUEST_TYPES.general
    const showInvoiceFields = module === "invoicing" && isInvoiceFormType(requestType)

    function resetForm() {
        setRequestType("")
        setTitle("")
        setDescription("")
        setPriority("normal")
        setFiles([])
        setError("")
        setInvoiceData(createEmptyInvoiceData())
    }

    function handleClose() {
        resetForm()
        onClose()
    }

    async function handleSubmit() {
        const selectedType = types.find(t => t.value === requestType)

        // Auto-generate title from receptor name for invoice requests
        const effectiveTitle = showInvoiceFields && !title.trim() && invoiceData.nombreReceptor
            ? `${selectedType?.label || requestType} — ${invoiceData.nombreReceptor}`
            : title.trim()

        if (!requestType || (!effectiveTitle && !showInvoiceFields)) {
            setError("Selecciona un tipo y escribe un título")
            return
        }

        if (showInvoiceFields && !invoiceData.rfcReceptor && !invoiceData.uuidCancelar) {
            setError("Llena al menos el RFC o UUID según el tipo de solicitud")
            return
        }

        setSubmitting(true)
        setError("")


        try {
            // Upload files if any
            const attachments: { name: string; url: string; size: number }[] = []
            if (files.length > 0) {
                for (const file of files) {
                    const formData = new FormData()
                    formData.append("file", file)
                    formData.append("path", `service-requests/${clientId}`)

                    const uploadRes = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                    })

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json()
                        attachments.push({
                            name: file.name,
                            url: uploadData.url,
                            size: file.size,
                        })
                    }
                }
            }

            const res = await fetch("/api/service-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clientId,
                    clientName,
                    module,
                    requestType,
                    title: effectiveTitle || `${selectedType?.label || requestType}`,
                    description: description.trim() || null,
                    priority,
                    attachments,
                    metadata: {
                        requestTypeLabel: selectedType?.label || requestType,
                        moduleLabel: MODULE_LABELS[module] || module,
                        ...(showInvoiceFields ? { invoiceData } : {}),
                    },
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Error al enviar solicitud")
            }

            handleClose()
            onSuccess?.()
        } catch (err) {
            console.error("Error submitting request:", err)
            setError(err instanceof Error ? err.message : "Error al enviar solicitud")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={v => !v && handleClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-indigo-600" />
                        Solicitar — {MODULE_LABELS[module] || module}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Request Type */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                            Tipo de solicitud *
                        </label>
                        <Select value={requestType} onValueChange={setRequestType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {types.map(t => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                            Título / Asunto {showInvoiceFields ? "(opcional — se genera del nombre)" : "*"}
                        </label>
                        <Input
                            placeholder={showInvoiceFields ? "Se genera automáticamente del nombre del receptor" : "Ej: Factura para venta de servicios"}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Invoice-specific fields OR Description */}
                    {showInvoiceFields ? (
                        <InvoiceRequestFields
                            requestType={requestType as InvoiceFormType}
                            value={invoiceData}
                            onChange={setInvoiceData}
                        />
                    ) : (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                Descripción / Detalles
                            </label>
                            <Textarea
                                placeholder="Describe lo que necesitas con el mayor detalle posible..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={4}
                            />
                        </div>
                    )}

                    {/* Priority */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                            Prioridad
                        </label>
                        <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="urgente">
                                    <span className="flex items-center gap-1.5">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                        Urgente
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* File attachments */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                            Archivos adjuntos
                        </label>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => document.getElementById("request-files")?.click()}
                                type="button"
                            >
                                <Paperclip className="h-3.5 w-3.5" />
                                Adjuntar
                            </Button>
                            <input
                                id="request-files"
                                type="file"
                                multiple
                                className="hidden"
                                onChange={e => setFiles(Array.from(e.target.files || []))}
                            />
                            {files.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {files.length} archivo{files.length > 1 ? "s" : ""} seleccionado{files.length > 1 ? "s" : ""}
                                </span>
                            )}
                        </div>
                        {files.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {files.map((f, i) => (
                                    <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                        {f.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    {/* Submit */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={handleClose} disabled={submitting}>
                            Cancelar
                        </Button>
                        <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gap-1.5">
                            <Send className="h-3.5 w-3.5" />
                            {submitting ? "Enviando..." : "Enviar Solicitud"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
