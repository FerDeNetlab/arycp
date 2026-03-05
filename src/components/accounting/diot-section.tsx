"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Upload, X, Check, AlertCircle, FileX, Pencil, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

interface DiotRecord {
    id?: string
    month: number
    year: number
    status: string // presentado_con_datos, presentado_sin_datos, no_presentado
    folio_number?: string | null
    pdf_url?: string | null
    pdf_name?: string | null
    notes?: string | null
}

export function DiotSection({ clientId, userRole, selectedYear }: { clientId: string; userRole?: string; selectedYear: number }) {
    const isClient = userRole === "cliente"
    const [records, setRecords] = useState<Record<number, DiotRecord>>({})
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
    const [formStatus, setFormStatus] = useState("presentado_con_datos")
    const [formNotes, setFormNotes] = useState("")
    const [formFolio, setFormFolio] = useState("")
    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    useEffect(() => {
        loadRecords()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId, selectedYear])

    async function loadRecords() {
        try {
            const res = await fetch(`/api/accounting/diot?clientId=${clientId}&year=${selectedYear}`)
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            const recordsMap: Record<number, DiotRecord> = {}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result.data?.forEach((r: any) => {
                recordsMap[r.month] = r
            })
            setRecords(recordsMap)
        } catch (error) {
            console.error("Error loading DIOT records:", error)
        }
    }

    function openDialog(monthIndex: number, editing = false) {
        const month = monthIndex + 1
        setSelectedMonth(month)
        setIsEditing(editing)

        const existing = records[month]
        if (existing && editing) {
            setFormStatus(existing.status)
            setFormNotes(existing.notes || "")
            setFormFolio(existing.folio_number || "")
        } else {
            setFormStatus("presentado_con_datos")
            setFormNotes("")
            setFormFolio("")
        }
        setPdfFile(null)
        setIsDialogOpen(true)
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) setPdfFile(file)
    }

    async function handleSave() {
        if (selectedMonth === null) return
        setIsSaving(true)

        try {
            const formData = new FormData()
            formData.append("clientId", clientId)
            formData.append("year", selectedYear.toString())
            formData.append("month", selectedMonth.toString())
            formData.append("status", formStatus)
            if (formNotes) formData.append("notes", formNotes)
            if (formFolio) formData.append("folioNumber", formFolio)
            if (pdfFile) formData.append("pdf", pdfFile)

            const res = await fetch("/api/accounting/diot", {
                method: "POST",
                body: formData,
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            // If folio was extracted from PDF, show it
            if (result.folioNumber && !formFolio) {
                toast({
                    title: "✅ DIOT guardado",
                    description: `Folio extraído automáticamente: ${result.folioNumber}`,
                })
            } else {
                toast({ title: "✅ DIOT guardado correctamente" })
            }

            setIsDialogOpen(false)
            loadRecords()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    function getStatusConfig(status: string) {
        switch (status) {
            case "presentado_con_datos":
                return { label: "Con datos", badgeClass: "bg-emerald-600 text-white hover:bg-emerald-600", icon: Check, badgeVariant: "default" as const }
            case "presentado_sin_datos":
                return { label: "Sin datos", badgeClass: "bg-blue-600 text-white hover:bg-blue-600", icon: FileX, badgeVariant: "default" as const }
            case "no_presentado":
                return { label: "No presentado", badgeClass: "bg-red-600 text-white hover:bg-red-600", icon: AlertCircle, badgeVariant: "default" as const }
            default:
                return { label: "Pendiente", badgeClass: "bg-gray-200 text-gray-600", icon: FileText, badgeVariant: "outline" as const }
        }
    }

    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    DIOT - {selectedYear}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {months.map((month, index) => {
                        const record = records[index + 1]
                        const hasRecord = !!record
                        const config = hasRecord ? getStatusConfig(record.status) : getStatusConfig("")
                        const StatusIcon = config.icon

                        return (
                            <div
                                key={index}
                                className={`border rounded-lg p-4 ${!isClient ? 'hover:border-purple-300 transition-colors' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-sm">{month}</h4>
                                    <Badge variant={config.badgeVariant} className={`text-xs ${config.badgeClass}`}>
                                        {config.label}
                                    </Badge>
                                </div>

                                {hasRecord ? (
                                    <div className="space-y-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <StatusIcon className={`h-4 w-4 ${record.status === "no_presentado" ? "text-red-500" : record.status === "presentado_sin_datos" ? "text-blue-500" : "text-emerald-500"}`} />
                                            <span className="text-xs text-muted-foreground">
                                                {record.status === "presentado_con_datos" ? "Presentado con datos" :
                                                    record.status === "presentado_sin_datos" ? "Presentado sin datos" :
                                                        "No presentado"}
                                            </span>
                                        </div>

                                        {record.folio_number && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Folio:</span>
                                                <span className="font-mono font-medium text-purple-700">{record.folio_number}</span>
                                            </div>
                                        )}

                                        {record.pdf_url && (
                                            <a
                                                href={record.pdf_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                {record.pdf_name || "Ver acuse PDF"}
                                            </a>
                                        )}

                                        {record.notes && (
                                            <p className="text-xs text-muted-foreground italic border-l-2 border-red-200 pl-2">
                                                {record.notes}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-3 text-center">
                                        <p className="text-xs text-muted-foreground">Sin registro</p>
                                    </div>
                                )}

                                {!isClient && (
                                    <div className="flex gap-2">
                                        {!hasRecord ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                                                onClick={() => openDialog(index)}
                                            >
                                                <FileText className="h-3 w-3 mr-1" />
                                                Registrar
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                                                onClick={() => openDialog(index, true)}
                                            >
                                                <Pencil className="h-3 w-3 mr-1" />
                                                Editar
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* DIOT Dialog */}
                {!isClient && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                    {isEditing ? "Editar" : "Registrar"} DIOT — {selectedMonth && months[selectedMonth - 1]} {selectedYear}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Status select */}
                                <div>
                                    <Label>Estado de presentación</Label>
                                    <Select value={formStatus} onValueChange={setFormStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="presentado_con_datos">✅ Presentado con datos</SelectItem>
                                            <SelectItem value="presentado_sin_datos">📄 Presentado sin datos</SelectItem>
                                            <SelectItem value="no_presentado">❌ No presentado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* PDF upload (only for presentado states) */}
                                {formStatus !== "no_presentado" && (
                                    <div>
                                        <Label>Acuse PDF (opcional)</Label>
                                        <div className="mt-1">
                                            {!pdfFile ? (
                                                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-purple-400 transition-colors cursor-pointer"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept=".pdf"
                                                        className="hidden"
                                                        onChange={handleFileChange}
                                                    />
                                                    <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                                                    <p className="text-xs text-muted-foreground">
                                                        Subir acuse DIOT — el folio se extrae automáticamente
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                                                    <FileText className="h-4 w-4 text-purple-600" />
                                                    <span className="text-sm flex-1 truncate">{pdfFile.name}</span>
                                                    <Button size="sm" variant="ghost" onClick={() => { setPdfFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Manual folio input (for presentado states) */}
                                {formStatus !== "no_presentado" && (
                                    <div>
                                        <Label htmlFor="folio">Número de operación (folio)</Label>
                                        <Input
                                            id="folio"
                                            placeholder="Se extrae automáticamente del PDF"
                                            value={formFolio}
                                            onChange={(e) => setFormFolio(e.target.value)}
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Si subes el PDF, el folio se detecta solo. También puedes escribirlo manualmente.
                                        </p>
                                    </div>
                                )}

                                {/* Notes (for no_presentado) */}
                                {formStatus === "no_presentado" && (
                                    <div>
                                        <Label htmlFor="notes">Razón por la que no fue presentado</Label>
                                        <Textarea
                                            id="notes"
                                            placeholder="Escribe la razón..."
                                            value={formNotes}
                                            onChange={(e) => setFormNotes(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                )}

                                {/* Notes for presentado states too (optional) */}
                                {formStatus !== "no_presentado" && (
                                    <div>
                                        <Label htmlFor="notes-optional">Notas (opcional)</Label>
                                        <Input
                                            id="notes-optional"
                                            placeholder="Notas adicionales..."
                                            value={formNotes}
                                            onChange={(e) => setFormNotes(e.target.value)}
                                        />
                                    </div>
                                )}

                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving || (formStatus === "no_presentado" && !formNotes.trim())}
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                >
                                    {isSaving ? "Guardando..." : isEditing ? "Actualizar DIOT" : "Guardar DIOT"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </CardContent>
        </Card>
    )
}
