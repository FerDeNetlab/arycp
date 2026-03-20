"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Truck } from "lucide-react"
import type { CartaPorteData } from "@/lib/constants/invoice-fields"

interface CartaPorteViewProps {
    data: CartaPorteData
}

export function CartaPorteView({ data }: CartaPorteViewProps) {
    const iva = data.importe * 0.16
    const subtotalConIva = data.importe + iva
    const retencion = data.importe * 0.04
    const total = subtotalConIva - retencion

    return (
        <Card className="border-sky-200">
            <CardContent className="p-4 space-y-4">
                <h3 className="text-xs font-semibold text-sky-700 uppercase flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" /> Carta Porte
                </h3>

                {/* Transporte */}
                <Section title="Transporte" color="sky">
                    <Row label="Unidad" value={data.unidadTransporte} />
                    <Row label="Nombre unidad" value={data.nombreUnidad} />
                    <Row label="Placas" value={data.placas} />
                    <Row label="Especificación" value={data.especificacion} />
                    <Row label="Permiso" value={data.permiso} />
                    <Row label="Póliza" value={data.poliza} />
                    <Row label="Aseguradora" value={data.aseguradora} />
                </Section>

                {/* Operadores */}
                <Section title="Operadores" color="indigo">
                    {data.operadores?.map((op, i) => (
                        <div key={i} className="text-sm">
                            <span className="font-medium">{op.nombre || "—"}</span>
                            {op.rfc && <span className="text-muted-foreground ml-2">RFC: {op.rfc}</span>}
                            {op.licencia && <span className="text-muted-foreground ml-2">Lic: {op.licencia}</span>}
                        </div>
                    ))}
                </Section>

                {/* Ruta */}
                <Section title="Ruta" color="emerald">
                    <Row label="Origen" value={data.origen} />
                    <Row label="Destino" value={data.destino} />
                    <Row label="Kilometraje" value={data.kilometraje} />
                    <Row label="Salida" value={`${data.fechaSalida} ${data.horaSalida}`} />
                    <Row label="Llegada" value={`${data.fechaLlegada} ${data.horaLlegada}`} />
                    <Row label="Remitente" value={data.remitente} />
                    <Row label="Destinatario" value={data.destinatario} />
                </Section>

                {/* Mercancías */}
                {data.mercancias?.length > 0 && (
                    <Section title="Mercancías" color="amber">
                        {data.mercancias.map((m, i) => (
                            <div key={i} className="text-sm border-b border-amber-100 pb-1 last:border-0">
                                <span className="font-mono text-xs text-muted-foreground">{m.claveSat}</span>
                                <span className="ml-2">{m.descripcion}</span>
                                <span className="text-muted-foreground ml-2">×{m.cantidad} — {m.peso} kg</span>
                            </div>
                        ))}
                    </Section>
                )}

                {/* Cálculos */}
                <div className="bg-purple-50 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between text-sm"><span>Importe:</span><span className="font-semibold">${data.importe?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-sm"><span>+ IVA 16%:</span><span>${iva.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-sm text-red-600"><span>− Retención 4%:</span><span>−${retencion.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-sm font-bold border-t pt-1"><span>Total:</span><span>${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>
                </div>

                {data.observaciones && (
                    <div className="text-sm"><span className="text-muted-foreground">Observaciones:</span> {data.observaciones}</div>
                )}
            </CardContent>
        </Card>
    )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
    return (
        <div className={`border-l-2 border-${color}-300 pl-3 space-y-1`}>
            <p className={`text-[11px] font-semibold text-${color}-600 uppercase`}>{title}</p>
            {children}
        </div>
    )
}

function Row({ label, value }: { label: string; value: string | undefined }) {
    if (!value || value.trim() === "") return null
    return (
        <div className="flex gap-2 text-sm">
            <span className="text-muted-foreground min-w-[100px]">{label}:</span>
            <span>{value}</span>
        </div>
    )
}
