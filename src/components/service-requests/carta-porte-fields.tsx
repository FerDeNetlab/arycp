"use client"

import { useCallback } from "react"
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
import { Plus, Trash2, Truck } from "lucide-react"
import {
    REGIMEN_FISCAL_OPTIONS,
    FORMA_PAGO_OPTIONS,
    METODO_PAGO_OPTIONS,
    USO_CFDI_OPTIONS,
    UNIDAD_OPTIONS,
    type CartaPorteData,
    type CartaPorteOperador,
    type CartaPorteMercancia,
} from "@/lib/constants/invoice-fields"

interface CartaPorteFieldsProps {
    value: CartaPorteData
    onChange: (data: CartaPorteData) => void
}

export function CartaPorteFields({ value, onChange }: CartaPorteFieldsProps) {
    const update = useCallback(
        (partial: Partial<CartaPorteData>) => onChange({ ...value, ...partial }),
        [value, onChange]
    )

    const updateOperador = useCallback(
        (index: number, partial: Partial<CartaPorteOperador>) => {
            const ops = [...value.operadores]
            ops[index] = { ...ops[index], ...partial }
            update({ operadores: ops })
        },
        [value.operadores, update]
    )

    const addOperador = () => {
        if (value.operadores.length >= 2) return
        update({ operadores: [...value.operadores, { nombre: "", rfc: "", licencia: "" }] })
    }

    const updateMercancia = useCallback(
        (index: number, partial: Partial<CartaPorteMercancia>) => {
            const mercs = [...value.mercancias]
            mercs[index] = { ...mercs[index], ...partial }
            update({ mercancias: mercs })
        },
        [value.mercancias, update]
    )

    const addMercancia = () => {
        update({
            mercancias: [...value.mercancias, { claveSat: "", cantidad: 1, unidad: "E48", descripcion: "", peso: "" }],
        })
    }

    const removeMercancia = (i: number) => {
        if (value.mercancias.length <= 1) return
        update({ mercancias: value.mercancias.filter((_, idx) => idx !== i) })
    }

    // Calculations
    const iva = value.importe * 0.16
    const subtotalConIva = value.importe + iva
    const retencion4 = value.importe * 0.04
    const total = subtotalConIva - retencion4

    return (
        <div className="space-y-4">
            {/* Transporte */}
            <div className="rounded-lg border border-sky-200 bg-sky-50/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" /> Datos del Transporte
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Unidad de transporte" value={value.unidadTransporte} onChange={v => update({ unidadTransporte: v })} />
                    <Field label="Nombre de unidad" value={value.nombreUnidad} onChange={v => update({ nombreUnidad: v })} />
                    <Field label="Placas" value={value.placas} onChange={v => update({ placas: v.toUpperCase() })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Especificación" placeholder="Ej: 2 ejes 3.5 ton" value={value.especificacion} onChange={v => update({ especificacion: v })} />
                    <Field label="Permiso" value={value.permiso} onChange={v => update({ permiso: v })} />
                    <Field label="Aseguradora" value={value.aseguradora} onChange={v => update({ aseguradora: v })} />
                </div>
                <Field label="Póliza" value={value.poliza} onChange={v => update({ poliza: v })} />
            </div>

            {/* Operadores */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Operadores</p>
                    {value.operadores.length < 2 && (
                        <Button type="button" variant="outline" size="sm" onClick={addOperador} className="h-7 text-xs gap-1">
                            <Plus className="h-3 w-3" /> Agregar operador
                        </Button>
                    )}
                </div>
                {value.operadores.map((op, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Field label={`Nombre operador ${i + 1}`} value={op.nombre} onChange={v => updateOperador(i, { nombre: v })} />
                        <Field label="RFC" value={op.rfc} onChange={v => updateOperador(i, { rfc: v.toUpperCase() })} mono />
                        <Field label="Licencia" value={op.licencia} onChange={v => updateOperador(i, { licencia: v })} />
                    </div>
                ))}
            </div>

            {/* Cliente y Fiscal */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Datos del Cliente</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Cliente" value={value.cliente} onChange={v => update({ cliente: v })} />
                    <Field label="Domicilio fiscal" value={value.domicilioFiscal} onChange={v => update({ domicilioFiscal: v })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Régimen fiscal</label>
                        <Select value={value.regimenFiscal} onValueChange={v => update({ regimenFiscal: v })}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent>
                                {REGIMEN_FISCAL_OPTIONS.map(o => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Uso CFDI</label>
                        <Select value={value.usoCfdi} onValueChange={v => update({ usoCfdi: v })}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent>
                                {USO_CFDI_OPTIONS.map(o => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Forma de pago</label>
                        <Select value={value.formaPago} onValueChange={v => update({ formaPago: v })}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent>
                                {FORMA_PAGO_OPTIONS.map(o => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Método de pago</label>
                        <Select value={value.metodoPago} onValueChange={v => update({ metodoPago: v })}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent>
                                {METODO_PAGO_OPTIONS.map(o => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Ruta */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Ruta</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label="Fecha salida" value={value.fechaSalida} onChange={v => update({ fechaSalida: v })} type="date" />
                    <Field label="Hora salida" value={value.horaSalida} onChange={v => update({ horaSalida: v })} type="time" />
                    <Field label="Fecha llegada" value={value.fechaLlegada} onChange={v => update({ fechaLlegada: v })} type="date" />
                    <Field label="Hora llegada" value={value.horaLlegada} onChange={v => update({ horaLlegada: v })} type="time" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Origen" value={value.origen} onChange={v => update({ origen: v })} />
                    <Field label="Destino" value={value.destino} onChange={v => update({ destino: v })} />
                    <Field label="Kilometraje" value={value.kilometraje} onChange={v => update({ kilometraje: v })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Remitente / Expeditor" value={value.remitente} onChange={v => update({ remitente: v })} />
                    <Field label="Destinatario" value={value.destinatario} onChange={v => update({ destinatario: v })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Domicilio origen" value={value.domicilioOrigen} onChange={v => update({ domicilioOrigen: v })} />
                    <Field label="Domicilio destino" value={value.domicilioDestino} onChange={v => update({ domicilioDestino: v })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Se recoge en" value={value.seRecogeEn} onChange={v => update({ seRecogeEn: v })} />
                    <Field label="Se entrega en" value={value.seEntregaEn} onChange={v => update({ seEntregaEn: v })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Valor declarado" value={value.valorDeclarado} onChange={v => update({ valorDeclarado: v })} />
                    <Field label="Fecha de entrega" value={value.fechaEntrega} onChange={v => update({ fechaEntrega: v })} type="date" />
                </div>
            </div>

            {/* Mercancías */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Mercancías a transportar</p>
                    <Button type="button" variant="outline" size="sm" onClick={addMercancia} className="h-7 text-xs gap-1">
                        <Plus className="h-3 w-3" /> Agregar
                    </Button>
                </div>
                {value.mercancias.map((m, i) => (
                    <div key={i} className="rounded-lg border border-amber-100 bg-white p-3 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                            <Field label="Clave SAT" value={m.claveSat} onChange={v => updateMercancia(i, { claveSat: v })} mono />
                            <div className="col-span-2">
                                <Field label="Descripción" value={m.descripcion} onChange={v => updateMercancia(i, { descripcion: v })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 items-end">
                            <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground">Cantidad</label>
                                <Input type="number" min="1" value={m.cantidad || ""} onChange={e => updateMercancia(i, { cantidad: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] text-muted-foreground">Unidad</label>
                                <Select value={m.unidad} onValueChange={v => updateMercancia(i, { unidad: v })}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {UNIDAD_OPTIONS.map(o => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Field label="Peso" value={m.peso} onChange={v => updateMercancia(i, { peso: v })} placeholder="Kg" />
                            <div className="flex items-center h-9">
                                {value.mercancias.length > 1 && (
                                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => removeMercancia(i)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Servicio y cálculos */}
            <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Servicio y Cálculos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Descripción del servicio" value={value.descripcionServicio} onChange={v => update({ descripcionServicio: v })} />
                    <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Importe</label>
                        <Input type="number" min="0" step="0.01" placeholder="$0.00" value={value.importe || ""} onChange={e => update({ importe: parseFloat(e.target.value) || 0 })} />
                    </div>
                </div>
                <div className="pt-2 border-t border-purple-200">
                    <div className="flex flex-col items-end gap-1">
                        <Row label="Subtotal:" value={value.importe} />
                        <Row label="+ IVA 16%:" value={iva} />
                        <Row label="Subtotal con IVA:" value={subtotalConIva} />
                        <Row label="− Retención 4%:" value={retencion4} negative />
                        <div className="flex items-center gap-3 pt-1 border-t border-purple-300">
                            <span className="text-xs font-bold text-foreground">Total:</span>
                            <span className="text-base font-bold text-purple-800 w-28 text-right">
                                ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Observaciones</label>
                <Textarea placeholder="Observaciones adicionales..." value={value.observaciones} onChange={e => update({ observaciones: e.target.value })} rows={2} />
            </div>
        </div>
    )
}

// --- Helpers ---
function Field({ label, value, onChange, placeholder, type = "text", mono }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean
}) {
    return (
        <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">{label}</label>
            <Input type={type} placeholder={placeholder || ""} value={value} onChange={e => onChange(e.target.value)} className={mono ? "font-mono" : ""} />
        </div>
    )
}

function Row({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <span className={`text-xs ${negative ? "text-red-600" : "text-muted-foreground"}`}>{label}</span>
            <span className={`text-sm font-semibold w-28 text-right ${negative ? "text-red-600" : "text-purple-700"}`}>
                {negative ? "−" : ""}${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
        </div>
    )
}
