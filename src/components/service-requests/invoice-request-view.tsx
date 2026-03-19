"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
    USO_CFDI_OPTIONS,
    FORMA_PAGO_OPTIONS,
    METODO_PAGO_OPTIONS,
    REGIMEN_FISCAL_OPTIONS,
    UNIDAD_OPTIONS,
    MOTIVO_CANCELACION_OPTIONS,
    type InvoiceData,
} from "@/lib/constants/invoice-fields"

function findLabel(options: readonly { value: string; label: string }[], value: string) {
    return options.find((o) => o.value === value)?.label || value || "—"
}

interface InvoiceRequestViewProps {
    data: InvoiceData
    requestType: string
}

export function InvoiceRequestView({ data, requestType }: InvoiceRequestViewProps) {
    const isCancelacion = requestType === "cancelacion"
    const isNotaCredito = requestType === "nota_credito"

    // --- Cancelación view ---
    if (isCancelacion) {
        return (
            <Card className="border-amber-200 bg-amber-50/30">
                <CardContent className="p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                        Datos de Cancelación
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <InfoRow label="UUID a cancelar" value={data.uuidCancelar || "—"} mono />
                        <InfoRow
                            label="Motivo"
                            value={findLabel(MOTIVO_CANCELACION_OPTIONS, data.motivoCancelacion || "")}
                        />
                    </div>
                    {data.notas && (
                        <div>
                            <span className="text-xs text-muted-foreground">Notas:</span>
                            <p className="text-sm mt-0.5 whitespace-pre-wrap">{data.notas}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    // --- Full invoice / Nota de crédito view ---
    const subtotal = (data.conceptos || []).reduce((s, c) => s + c.quantity * c.unitPrice, 0)

    return (
        <div className="space-y-3">
            {/* UUID relacionada (nota de crédito) */}
            {isNotaCredito && data.uuidRelacionada && (
                <Card className="border-violet-200 bg-violet-50/30">
                    <CardContent className="p-4">
                        <h3 className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2">
                            Factura Relacionada
                        </h3>
                        <InfoRow label="UUID" value={data.uuidRelacionada} mono />
                    </CardContent>
                </Card>
            )}

            {/* Receptor */}
            <Card className="border-blue-200 bg-blue-50/30">
                <CardContent className="p-4">
                    <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                        Datos del Receptor
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <InfoRow label="RFC" value={data.rfcReceptor} mono />
                        <InfoRow label="Nombre / Razón Social" value={data.nombreReceptor} />
                        <InfoRow label="Régimen fiscal" value={findLabel(REGIMEN_FISCAL_OPTIONS, data.regimenFiscal)} />
                        <InfoRow label="Domicilio fiscal (C.P.)" value={data.domicilioFiscalCp} mono />
                        <InfoRow label="Uso CFDI" value={findLabel(USO_CFDI_OPTIONS, data.usoCfdi)} full />
                    </div>
                </CardContent>
            </Card>

            {/* Pago */}
            <Card className="border-emerald-200 bg-emerald-50/30">
                <CardContent className="p-4">
                    <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                        Datos de Pago
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <InfoRow label="Forma de pago" value={findLabel(FORMA_PAGO_OPTIONS, data.formaPago)} />
                        <InfoRow label="Método de pago" value={findLabel(METODO_PAGO_OPTIONS, data.metodoPago)} />
                    </div>
                </CardContent>
            </Card>

            {/* Conceptos */}
            {data.conceptos && data.conceptos.length > 0 && (
                <Card className="border-purple-200 bg-purple-50/30">
                    <CardContent className="p-4">
                        <h3 className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">
                            {isNotaCredito ? "Conceptos a Acreditar" : "Conceptos / Partidas"}
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-purple-200 text-xs text-muted-foreground">
                                        <th className="text-left py-1.5 pr-2">Clave SAT</th>
                                        <th className="text-left py-1.5 pr-2">Descripción</th>
                                        <th className="text-center py-1.5 px-2">Cant.</th>
                                        <th className="text-center py-1.5 px-2">Unidad</th>
                                        <th className="text-right py-1.5 px-2">P. Unit.</th>
                                        <th className="text-right py-1.5 pl-2">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.conceptos.map((c, i) => (
                                        <tr key={i} className="border-b border-purple-100 last:border-0">
                                            <td className="py-2 pr-2 font-mono text-xs">{c.claveSat || "—"}</td>
                                            <td className="py-2 pr-2">{c.description || "—"}</td>
                                            <td className="py-2 px-2 text-center">{c.quantity}</td>
                                            <td className="py-2 px-2 text-center text-xs">
                                                {findLabel(UNIDAD_OPTIONS, c.unit)}
                                            </td>
                                            <td className="py-2 px-2 text-right font-mono">
                                                ${Number(c.unitPrice).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-2 pl-2 text-right font-medium font-mono">
                                                ${(c.quantity * c.unitPrice).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-purple-200">
                                        <td colSpan={5} className="py-2 text-right font-medium text-muted-foreground">
                                            Subtotal:
                                        </td>
                                        <td className="py-2 pl-2 text-right font-bold text-purple-700 font-mono">
                                            ${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Notas */}
            {data.notas && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Notas Adicionales
                        </h3>
                        <p className="text-sm whitespace-pre-wrap">{data.notas}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function InfoRow({ label, value, mono, full }: { label: string; value: string; mono?: boolean; full?: boolean }) {
    return (
        <div className={full ? "sm:col-span-2" : ""}>
            <span className="text-xs text-muted-foreground">{label}</span>
            <p className={`font-medium ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
        </div>
    )
}
