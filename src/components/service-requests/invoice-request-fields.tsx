"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import {
    USO_CFDI_OPTIONS,
    FORMA_PAGO_OPTIONS,
    METODO_PAGO_OPTIONS,
    REGIMEN_FISCAL_OPTIONS,
    UNIDAD_OPTIONS,
    MOTIVO_CANCELACION_OPTIONS,
    needsFullForm,
    needsCancelForm,
    needsCreditNoteForm,
    isResicoType,
    createEmptyInvoiceData,
    type InvoiceData,
    type InvoiceConcept,
    type InvoiceFormType,
} from "@/lib/constants/invoice-fields"

interface InvoiceRequestFieldsProps {
    requestType: InvoiceFormType
    value: InvoiceData
    onChange: (data: InvoiceData) => void
}

export function InvoiceRequestFields({ requestType, value, onChange }: InvoiceRequestFieldsProps) {
    const update = useCallback(
        (partial: Partial<InvoiceData>) => onChange({ ...value, ...partial }),
        [value, onChange]
    )

    const updateConcept = useCallback(
        (index: number, partial: Partial<InvoiceConcept>) => {
            const newConceptos = [...value.conceptos]
            newConceptos[index] = { ...newConceptos[index], ...partial }
            update({ conceptos: newConceptos })
        },
        [value.conceptos, update]
    )

    const addConcept = useCallback(() => {
        update({
            conceptos: [...value.conceptos, { claveSat: "", description: "", quantity: 1, unit: "E48", unitPrice: 0 }],
        })
    }, [value.conceptos, update])

    const removeConcept = useCallback(
        (index: number) => {
            if (value.conceptos.length <= 1) return
            update({ conceptos: value.conceptos.filter((_, i) => i !== index) })
        },
        [value.conceptos, update]
    )

    const subtotal = value.conceptos.reduce((s, c) => s + c.quantity * c.unitPrice, 0)

    // --- Cancelación form ---
    if (needsCancelForm(requestType)) {
        return (
            <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    Datos de Cancelación
                </p>
                <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">UUID de la factura a cancelar *</label>
                        <Input
                            placeholder="Ej: 6A1B2C3D-4E5F-6789-ABCD-EFGHIJK12345"
                            value={value.uuidCancelar || ""}
                            onChange={(e) => update({ uuidCancelar: e.target.value })}
                            className="font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Motivo de cancelación *</label>
                        <Select
                            value={value.motivoCancelacion || ""}
                            onValueChange={(v) => update({ motivoCancelacion: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona el motivo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {MOTIVO_CANCELACION_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Notas adicionales</label>
                        <Textarea
                            placeholder="Información adicional sobre la cancelación..."
                            value={value.notas}
                            onChange={(e) => update({ notas: e.target.value })}
                            rows={2}
                        />
                    </div>
                </div>
            </div>
        )
    }

    // --- Nota de crédito form ---
    if (needsCreditNoteForm(requestType)) {
        return (
            <div className="space-y-4">
                <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4 space-y-3">
                    <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                        Datos de la Nota de Crédito
                    </p>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">UUID de la factura relacionada *</label>
                        <Input
                            placeholder="UUID de la factura original"
                            value={value.uuidRelacionada || ""}
                            onChange={(e) => update({ uuidRelacionada: e.target.value })}
                            className="font-mono text-sm"
                        />
                    </div>
                    <ReceptorFields value={value} update={update} />
                </div>
                <ConceptosSection
                    conceptos={value.conceptos}
                    updateConcept={updateConcept}
                    addConcept={addConcept}
                    removeConcept={removeConcept}
                    subtotal={subtotal}
                    requestType={requestType}
                    label="Conceptos a acreditar"
                />
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Notas adicionales</label>
                    <Textarea
                        placeholder="Información adicional..."
                        value={value.notas}
                        onChange={(e) => update({ notas: e.target.value })}
                        rows={2}
                    />
                </div>
            </div>
        )
    }

    // --- Full CFDI form (PF, PM, RESICO, Otro) ---
    if (needsFullForm(requestType)) {
        return (
            <div className="space-y-4">
                {/* Receptor */}
                <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 space-y-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                        Datos del Receptor
                    </p>
                    <ReceptorFields value={value} update={update} />
                </div>

                {/* Pago */}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-4 space-y-3">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                        Datos de Pago
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Forma de pago *</label>
                            <Select value={value.formaPago} onValueChange={(v) => update({ formaPago: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {FORMA_PAGO_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Método de pago *</label>
                            <Select value={value.metodoPago} onValueChange={(v) => update({ metodoPago: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {METODO_PAGO_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Conceptos */}
                <ConceptosSection
                    conceptos={value.conceptos}
                    updateConcept={updateConcept}
                    addConcept={addConcept}
                    removeConcept={removeConcept}
                    subtotal={subtotal}
                    requestType={requestType}
                />

                {/* Notas */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Notas adicionales</label>
                    <Textarea
                        placeholder="Información adicional para el contador..."
                        value={value.notas}
                        onChange={(e) => update({ notas: e.target.value })}
                        rows={2}
                    />
                </div>
            </div>
        )
    }

    return null
}

// --- Sub-components ---

function ReceptorFields({
    value,
    update,
}: {
    value: InvoiceData
    update: (partial: Partial<InvoiceData>) => void
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">RFC del receptor *</label>
                <Input
                    placeholder="Ej: XAXX010101000"
                    value={value.rfcReceptor}
                    onChange={(e) => update({ rfcReceptor: e.target.value.toUpperCase() })}
                    maxLength={13}
                    className="uppercase font-mono"
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nombre / Razón Social *</label>
                <Input
                    placeholder="Nombre completo o razón social"
                    value={value.nombreReceptor}
                    onChange={(e) => update({ nombreReceptor: e.target.value })}
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Régimen fiscal *</label>
                <Select value={value.regimenFiscal} onValueChange={(v) => update({ regimenFiscal: v })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                        {REGIMEN_FISCAL_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Domicilio fiscal (C.P.) *</label>
                <Input
                    placeholder="Ej: 64000"
                    value={value.domicilioFiscalCp}
                    onChange={(e) => update({ domicilioFiscalCp: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                    maxLength={5}
                    className="font-mono"
                />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Uso CFDI *</label>
                <Select value={value.usoCfdi} onValueChange={(v) => update({ usoCfdi: v })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar uso del CFDI..." />
                    </SelectTrigger>
                    <SelectContent>
                        {USO_CFDI_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

function ConceptosSection({
    conceptos,
    updateConcept,
    addConcept,
    removeConcept,
    subtotal,
    requestType,
    label = "Conceptos / Partidas",
}: {
    conceptos: InvoiceConcept[]
    updateConcept: (i: number, p: Partial<InvoiceConcept>) => void
    addConcept: () => void
    removeConcept: (i: number) => void
    subtotal: number
    requestType: InvoiceFormType
    label?: string
}) {
    const isResico = isResicoType(requestType)
    const iva = subtotal * 0.16
    const retencionIsr = isResico ? subtotal * 0.0125 : 0
    const total = subtotal - retencionIsr + iva
    return (
        <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">{label}</p>
                <Button type="button" variant="outline" size="sm" onClick={addConcept} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" /> Agregar
                </Button>
            </div>

            <div className="space-y-3">
                {conceptos.map((c, i) => (
                    <div key={i} className="rounded-lg border border-purple-100 bg-white p-3 space-y-2">
                        {/* Row 1: Clave SAT + Descripción */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground">Clave SAT</label>
                                <Input
                                    placeholder="Ej: 80161500"
                                    value={c.claveSat || ""}
                                    onChange={(e) => updateConcept(i, { claveSat: e.target.value.replace(/\D/g, "") })}
                                    className="font-mono"
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[11px] text-muted-foreground">Descripción</label>
                                <Input
                                    placeholder="Descripción del concepto"
                                    value={c.description}
                                    onChange={(e) => updateConcept(i, { description: e.target.value })}
                                />
                            </div>
                        </div>
                        {/* Row 2: Cantidad + Unidad + P.Unitario + Subtotal + Delete */}
                        <div className="grid grid-cols-4 gap-2 items-end">
                            <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground">Cantidad</label>
                                <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={c.quantity || ""}
                                    onChange={(e) => updateConcept(i, { quantity: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground">Unidad</label>
                                <Select value={c.unit} onValueChange={(v) => updateConcept(i, { unit: v })}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {UNIDAD_OPTIONS.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground">P. Unitario</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="$0.00"
                                    value={c.unitPrice || ""}
                                    onChange={(e) => updateConcept(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="flex items-center justify-between h-9">
                                <span className="text-sm font-semibold text-purple-700">
                                    ${(c.quantity * c.unitPrice).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </span>
                                {conceptos.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => removeConcept(i)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desglose */}
            <div className="pt-2 border-t border-purple-200">
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">Subtotal:</span>
                        <span className="text-sm font-semibold text-purple-700 w-28 text-right">
                            ${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    {isResico && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-red-600">− Retención ISR 1.25%:</span>
                            <span className="text-sm font-semibold text-red-600 w-28 text-right">
                                −${retencionIsr.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">+ IVA 16%:</span>
                        <span className="text-sm font-semibold text-purple-700 w-28 text-right">
                            ${iva.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 pt-1 border-t border-purple-300">
                        <span className="text-xs font-bold text-foreground">Total:</span>
                        <span className="text-base font-bold text-purple-800 w-28 text-right">
                            ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export { createEmptyInvoiceData }
export type { InvoiceData }
