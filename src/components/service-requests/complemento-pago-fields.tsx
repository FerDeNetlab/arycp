"use client"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import {
    FORMA_PAGO_OPTIONS,
} from "@/lib/constants/invoice-fields"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { ComplementoPagoData, ComplementoFactura } from "@/lib/constants/invoice-fields"

interface ComplementoPagoFieldsProps {
    value: ComplementoPagoData
    onChange: (data: ComplementoPagoData) => void
}

export function ComplementoPagoFields({ value, onChange }: ComplementoPagoFieldsProps) {
    const update = useCallback(
        (partial: Partial<ComplementoPagoData>) => onChange({ ...value, ...partial }),
        [value, onChange]
    )

    const updateFactura = useCallback(
        (index: number, partial: Partial<ComplementoFactura>) => {
            const facts = [...value.facturas]
            facts[index] = { ...facts[index], ...partial }
            update({ facturas: facts })
        },
        [value.facturas, update]
    )

    const addFactura = () => {
        update({ facturas: [...value.facturas, { uuid: "", monto: "" }] })
    }

    const removeFactura = (i: number) => {
        if (value.facturas.length <= 1) return
        update({ facturas: value.facturas.filter((_, idx) => idx !== i) })
    }

    return (
        <div className="space-y-4">
            {/* Datos del depósito */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                    Datos del Depósito / Pago
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Fecha de depósito *</label>
                        <Input type="date" value={value.fechaDeposito} onChange={e => update({ fechaDeposito: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Cantidad depositada *</label>
                        <Input type="number" min="0" step="0.01" placeholder="$0.00" value={value.cantidadDepositada} onChange={e => update({ cantidadDepositada: e.target.value })} />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Banco en que se aplica el depósito *</label>
                        <Input placeholder="Ej: BBVA, Banorte, Banamex..." value={value.bancoReceptor} onChange={e => update({ bancoReceptor: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Forma de pago del cliente</label>
                        <Select value={value.formaPagoCliente} onValueChange={v => update({ formaPagoCliente: v })}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent>
                                {FORMA_PAGO_OPTIONS.map(o => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Datos del cliente que paga */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    Cliente que Paga
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Nombre del cliente *</label>
                        <Input placeholder="Nombre o razón social" value={value.clienteQuePaga} onChange={e => update({ clienteQuePaga: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Banco del que paga</label>
                        <Input placeholder="Banco del cliente" value={value.bancoCliente} onChange={e => update({ bancoCliente: e.target.value })} />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">CLABE del cliente</label>
                        <Input placeholder="18 dígitos" maxLength={18} value={value.clabeCliente} onChange={e => update({ clabeCliente: e.target.value.replace(/\D/g, "").slice(0, 18) })} className="font-mono" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">No. cuenta del cliente</label>
                        <Input placeholder="Número de cuenta" value={value.cuentaCliente} onChange={e => update({ cuentaCliente: e.target.value })} className="font-mono" />
                    </div>
                </div>
            </div>

            {/* Facturas que paga */}
            <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                        Facturas que paga el cliente
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={addFactura} className="h-7 text-xs gap-1">
                        <Plus className="h-3 w-3" /> Agregar factura
                    </Button>
                </div>
                <div className="space-y-2">
                    {value.facturas.map((f, i) => (
                        <div key={i} className="flex gap-2 items-end">
                            <div className="flex-1 space-y-1">
                                <label className="text-[11px] text-muted-foreground">UUID de factura {i + 1}</label>
                                <Input
                                    placeholder="Ej: 6A1B2C3D-4E5F-6789-ABCD-EFGHIJK12345"
                                    value={f.uuid}
                                    onChange={e => updateFactura(i, { uuid: e.target.value })}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div className="w-32 space-y-1">
                                <label className="text-[11px] text-muted-foreground">Monto</label>
                                <Input
                                    type="number" min="0" step="0.01" placeholder="$0.00"
                                    value={f.monto}
                                    onChange={e => updateFactura(i, { monto: e.target.value })}
                                />
                            </div>
                            {value.facturas.length > 1 && (
                                <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-400 hover:text-red-600" onClick={() => removeFactura(i)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    ))}
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
