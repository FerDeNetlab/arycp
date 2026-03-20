"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CreditCard } from "lucide-react"
import type { ComplementoPagoData } from "@/lib/constants/invoice-fields"

interface ComplementoPagoViewProps {
    data: ComplementoPagoData
}

export function ComplementoPagoView({ data }: ComplementoPagoViewProps) {
    return (
        <Card className="border-emerald-200">
            <CardContent className="p-4 space-y-4">
                <h3 className="text-xs font-semibold text-emerald-700 uppercase flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" /> Complemento de Pago (REP)
                </h3>

                {/* Depósito */}
                <div className="border-l-2 border-emerald-300 pl-3 space-y-1">
                    <p className="text-[11px] font-semibold text-emerald-600 uppercase">Datos del Depósito</p>
                    <Row label="Fecha depósito" value={data.fechaDeposito} />
                    <Row label="Banco receptor" value={data.bancoReceptor} />
                    <Row label="Cantidad" value={data.cantidadDepositada ? `$${parseFloat(data.cantidadDepositada).toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : ""} />
                    <Row label="Forma de pago" value={data.formaPagoCliente} />
                </div>

                {/* Cliente */}
                <div className="border-l-2 border-blue-300 pl-3 space-y-1">
                    <p className="text-[11px] font-semibold text-blue-600 uppercase">Cliente que Paga</p>
                    <Row label="Nombre" value={data.clienteQuePaga} />
                    <Row label="Banco" value={data.bancoCliente} />
                    <Row label="CLABE" value={data.clabeCliente} mono />
                    <Row label="No. Cuenta" value={data.cuentaCliente} mono />
                </div>

                {/* Facturas */}
                {data.facturas?.length > 0 && (
                    <div className="border-l-2 border-purple-300 pl-3 space-y-1">
                        <p className="text-[11px] font-semibold text-purple-600 uppercase">Facturas que Paga</p>
                        {data.facturas.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="font-mono text-xs bg-purple-50 px-1.5 py-0.5 rounded">{f.uuid || "—"}</span>
                                {f.monto && <span className="text-muted-foreground">${parseFloat(f.monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>}
                            </div>
                        ))}
                    </div>
                )}

                {data.observaciones && (
                    <div className="text-sm"><span className="text-muted-foreground">Observaciones:</span> {data.observaciones}</div>
                )}
            </CardContent>
        </Card>
    )
}

function Row({ label, value, mono }: { label: string; value: string | undefined; mono?: boolean }) {
    if (!value || value.trim() === "") return null
    return (
        <div className="flex gap-2 text-sm">
            <span className="text-muted-foreground min-w-[100px]">{label}:</span>
            <span className={mono ? "font-mono" : ""}>{value}</span>
        </div>
    )
}
