"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
    MOTIVO_BAJA_OPTIONS,
    type EmployeeData,
} from "@/lib/constants/employee-fields"

interface EmployeeRequestViewProps {
    data: EmployeeData
    requestType: string
}

function findLabel(options: readonly { value: string; label: string }[], value: string) {
    return options.find((o) => o.value === value)?.label || value || "—"
}

export function EmployeeRequestView({ data, requestType }: EmployeeRequestViewProps) {
    const isAlta = requestType === "alta_empleado"
    const isBaja = requestType === "baja_empleado"

    return (
        <div className="space-y-3">
            {/* Personal data */}
            <Card className={isAlta ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30"}>
                <CardContent className="p-4">
                    <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isAlta ? "text-emerald-700" : "text-red-700"}`}>
                        {isAlta ? "📋 Alta de Empleado" : "📋 Baja de Empleado"}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <InfoRow label="Nombre" value={data.nombre} full />
                        <InfoRow label="NSS" value={data.nss} mono />
                        <InfoRow label="RFC" value={data.rfc} mono />
                        <InfoRow label="CURP" value={data.curp} mono />
                        <InfoRow label="Fecha de nacimiento" value={formatDate(data.fechaNacimiento)} />
                    </div>
                </CardContent>
            </Card>

            {/* Employment data */}
            <Card className="border-blue-200 bg-blue-50/30">
                <CardContent className="p-4">
                    <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                        💼 Datos Laborales
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <InfoRow label="Puesto" value={data.puesto} />
                        <InfoRow
                            label="Salario mensual"
                            value={data.salario ? `$${Number(data.salario).toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "—"}
                        />
                        <InfoRow label="Fecha de ingreso" value={formatDate(data.fechaIngreso)} />
                        {isBaja && (
                            <>
                                <InfoRow label="Fecha de baja" value={formatDate(data.fechaBaja || "")} />
                                <InfoRow label="Motivo de baja" value={findLabel(MOTIVO_BAJA_OPTIONS, data.motivoBaja || "")} full />
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Notes */}
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

function formatDate(dateStr: string): string {
    if (!dateStr) return "—"
    const d = new Date(dateStr + "T12:00:00")
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
}
