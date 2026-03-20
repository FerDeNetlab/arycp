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
import { isInvoiceFormType, needsCartaPorteForm, needsComplementoForm, createEmptyCartaPorteData, createEmptyComplementoPagoData, type InvoiceFormType, type CartaPorteData, type ComplementoPagoData } from "@/lib/constants/invoice-fields"
import { CartaPorteFields } from "./carta-porte-fields"
import { ComplementoPagoFields } from "./complemento-pago-fields"
import { EmployeeRequestFields, type EmployeeData } from "./employee-request-fields"
import { isEmployeeFormType, createEmptyEmployeeData, type EmployeeFormType } from "@/lib/constants/employee-fields"

// Request types per module
const MODULE_REQUEST_TYPES: Record<string, { label: string; value: string }[]> = {
    invoicing: [
        { label: "Factura — Persona Física", value: "factura_pf" },
        { label: "Factura — Persona Moral", value: "factura_pm" },
        { label: "Factura — RESICO", value: "factura_resico" },
        { label: "Factura — Otro tipo", value: "factura_otro" },
        { label: "Carta Porte", value: "carta_porte" },
        { label: "Complemento de Pago (REP)", value: "complemento" },
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
        { label: "Alta de empleado (IMSS)", value: "alta_empleado" },
        { label: "Baja de empleado (IMSS)", value: "baja_empleado" },
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
    const [cartaPorteData, setCartaPorteData] = useState<CartaPorteData>(createEmptyCartaPorteData())
    const [complementoData, setComplementoData] = useState<ComplementoPagoData>(createEmptyComplementoPagoData())
    const [employeeData, setEmployeeData] = useState<EmployeeData>(createEmptyEmployeeData("alta"))

    const types = MODULE_REQUEST_TYPES[module] || MODULE_REQUEST_TYPES.general
    const showInvoiceFields = module === "invoicing" && isInvoiceFormType(requestType) && !needsCartaPorteForm(requestType as InvoiceFormType) && !needsComplementoForm(requestType as InvoiceFormType)
    const showCartaPorteFields = module === "invoicing" && isInvoiceFormType(requestType) && needsCartaPorteForm(requestType as InvoiceFormType)
    const showComplementoFields = module === "invoicing" && isInvoiceFormType(requestType) && needsComplementoForm(requestType as InvoiceFormType)
    const showEmployeeFields = module === "labor" && isEmployeeFormType(requestType)
    const showDynamicFields = showInvoiceFields || showCartaPorteFields || showComplementoFields || showEmployeeFields

    function resetForm() {
        setRequestType("")
        setTitle("")
        setDescription("")
        setPriority("normal")
        setFiles([])
        setError("")
        setInvoiceData(createEmptyInvoiceData())
        setCartaPorteData(createEmptyCartaPorteData())
        setComplementoData(createEmptyComplementoPagoData())
        setEmployeeData(createEmptyEmployeeData("alta"))
    }

    function handleClose() {
        resetForm()
        onClose()
    }

    async function handleSubmit() {
        const selectedType = types.find(t => t.value === requestType)

        // Auto-generate title for dynamic forms
        let effectiveTitle = title.trim()
        if (showInvoiceFields && !effectiveTitle && invoiceData.nombreReceptor) {
            effectiveTitle = `${selectedType?.label || requestType} — ${invoiceData.nombreReceptor}`
        } else if (showCartaPorteFields && !effectiveTitle && cartaPorteData.cliente) {
            effectiveTitle = `Carta Porte — ${cartaPorteData.cliente}`
        } else if (showComplementoFields && !effectiveTitle && complementoData.clienteQuePaga) {
            effectiveTitle = `Complemento de Pago — ${complementoData.clienteQuePaga}`
        } else if (showEmployeeFields && !effectiveTitle && employeeData.nombre) {
            effectiveTitle = `${selectedType?.label || requestType} — ${employeeData.nombre}`
        }

        if (!requestType || (!effectiveTitle && !showDynamicFields)) {
            setError("Selecciona un tipo y escribe un título")
            return
        }

        if (showInvoiceFields && !invoiceData.rfcReceptor && !invoiceData.uuidCancelar) {
            setError("Llena al menos el RFC o UUID según el tipo de solicitud")
            return
        }

        if (showEmployeeFields && !employeeData.nombre) {
            setError("El nombre del empleado es requerido")
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
                        ...(showCartaPorteFields ? { cartaPorteData } : {}),
                        ...(showComplementoFields ? { complementoData } : {}),
                        ...(showEmployeeFields ? { employeeData } : {}),
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
            <DialogContent className={`${showDynamicFields ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`}>
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
                            Título / Asunto {showDynamicFields ? "(opcional — se genera del nombre)" : "*"}
                        </label>
                        <Input
                            placeholder={showDynamicFields ? "Se genera automáticamente del nombre" : "Ej: Factura para venta de servicios"}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Dynamic fields OR Description */}
                    {showInvoiceFields ? (
                        <InvoiceRequestFields
                            requestType={requestType as InvoiceFormType}
                            value={invoiceData}
                            onChange={setInvoiceData}
                        />
                    ) : showCartaPorteFields ? (
                        <CartaPorteFields
                            value={cartaPorteData}
                            onChange={setCartaPorteData}
                        />
                    ) : showComplementoFields ? (
                        <ComplementoPagoFields
                            value={complementoData}
                            onChange={setComplementoData}
                        />
                    ) : showEmployeeFields ? (
                        <EmployeeRequestFields
                            requestType={requestType as EmployeeFormType}
                            value={employeeData}
                            onChange={setEmployeeData}
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
