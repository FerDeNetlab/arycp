"use client"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    MOTIVO_BAJA_OPTIONS,
    type EmployeeData,
    type EmployeeFormType,
} from "@/lib/constants/employee-fields"

interface EmployeeRequestFieldsProps {
    requestType: EmployeeFormType
    value: EmployeeData
    onChange: (data: EmployeeData) => void
}

export function EmployeeRequestFields({ requestType, value, onChange }: EmployeeRequestFieldsProps) {
    const update = useCallback(
        (partial: Partial<EmployeeData>) => onChange({ ...value, ...partial }),
        [value, onChange]
    )

    const isAlta = requestType === "alta_empleado"
    const isBaja = requestType === "baja_empleado"

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className={`rounded-lg border p-4 space-y-3 ${isAlta ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30"}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${isAlta ? "text-emerald-700" : "text-red-700"}`}>
                    {isAlta ? "📋 Datos del Empleado — Alta" : "📋 Datos del Empleado — Baja"}
                </p>

                {/* Row 1: Nombre */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Nombre completo *</label>
                    <Input
                        placeholder="Nombre(s) y Apellidos"
                        value={value.nombre}
                        onChange={(e) => update({ nombre: e.target.value })}
                    />
                </div>

                {/* Row 2: NSS + RFC */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">NSS (Número de Seguro Social) *</label>
                        <Input
                            placeholder="Ej: 12345678901"
                            value={value.nss}
                            onChange={(e) => update({ nss: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                            maxLength={11}
                            className="font-mono"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">RFC *</label>
                        <Input
                            placeholder="Ej: XAXX010101000"
                            value={value.rfc}
                            onChange={(e) => update({ rfc: e.target.value.toUpperCase() })}
                            maxLength={13}
                            className="uppercase font-mono"
                        />
                    </div>
                </div>

                {/* Row 3: CURP + Fecha de nacimiento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">CURP *</label>
                        <Input
                            placeholder="Ej: XAXX010101HDFRRN09"
                            value={value.curp}
                            onChange={(e) => update({ curp: e.target.value.toUpperCase() })}
                            maxLength={18}
                            className="uppercase font-mono"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Fecha de nacimiento *</label>
                        <Input
                            type="date"
                            value={value.fechaNacimiento}
                            onChange={(e) => update({ fechaNacimiento: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Employment details */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    💼 Datos Laborales
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Puesto *</label>
                        <Input
                            placeholder="Ej: Auxiliar contable"
                            value={value.puesto}
                            onChange={(e) => update({ puesto: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Salario (mensual) *</label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="$0.00"
                            value={value.salario}
                            onChange={(e) => update({ salario: parseFloat(e.target.value) || "" })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                            {isAlta ? "Fecha de ingreso *" : "Fecha de ingreso"}
                        </label>
                        <Input
                            type="date"
                            value={value.fechaIngreso}
                            onChange={(e) => update({ fechaIngreso: e.target.value })}
                        />
                    </div>

                    {/* Baja-specific fields */}
                    {isBaja && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Fecha de baja *</label>
                                <Input
                                    type="date"
                                    value={value.fechaBaja || ""}
                                    onChange={(e) => update({ fechaBaja: e.target.value })}
                                />
                            </div>
                        </>
                    )}
                </div>

                {isBaja && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Motivo de baja *</label>
                        <Select value={value.motivoBaja || ""} onValueChange={(v) => update({ motivoBaja: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona el motivo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {MOTIVO_BAJA_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Notas adicionales</label>
                <Textarea
                    placeholder="Información adicional para la contadora..."
                    value={value.notas}
                    onChange={(e) => update({ notas: e.target.value })}
                    rows={2}
                />
            </div>
        </div>
    )
}

export { type EmployeeData }
