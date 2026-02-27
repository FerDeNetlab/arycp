"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FolderOpen, Upload, Trash2, Download, X } from "lucide-react"

interface Template {
    id: string
    file_name: string
    file_url: string
    description: string
    created_at: string
}

interface TemplatesTabProps {
    clientId: string
    canEdit: boolean
}

export function TemplatesTab({ clientId, canEdit }: TemplatesTabProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [showUpload, setShowUpload] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [description, setDescription] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    useEffect(() => {
        loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId])

    async function loadTemplates() {
        setLoading(true)
        try {
            const res = await fetch(`/api/invoicing/templates?clientId=${clientId}`)
            const result = await res.json()
            if (res.ok && result.data) setTemplates(result.data)
        } catch (err) {
            console.error("Error:", err)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpload() {
        if (!selectedFile) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("clientId", clientId)
            formData.append("file", selectedFile)
            formData.append("description", description)

            const res = await fetch("/api/invoicing/templates", {
                method: "POST",
                body: formData,
            })

            if (res.ok) {
                setShowUpload(false)
                setSelectedFile(null)
                setDescription("")
                loadTemplates()
            }
        } catch (err) {
            console.error("Error:", err)
        } finally {
            setUploading(false)
        }
    }

    async function handleDelete(templateId: string) {
        if (!confirm("¿Eliminar esta plantilla?")) return
        try {
            const res = await fetch(`/api/invoicing/templates?id=${templateId}`, { method: "DELETE" })
            if (res.ok) loadTemplates()
        } catch (err) {
            console.error("Error:", err)
        }
    }

    function getFileIcon(fileName: string) {
        const ext = fileName.split(".").pop()?.toLowerCase()
        if (ext === "xlsx" || ext === "xls") return "📊"
        if (ext === "pdf") return "📄"
        if (ext === "docx" || ext === "doc") return "📝"
        if (ext === "jpg" || ext === "png" || ext === "jpeg") return "🖼️"
        return "📎"
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Plantillas de Diseño</h3>
                    <p className="text-sm text-muted-foreground">
                        Archivos de formato para que el cliente llene con sus datos
                    </p>
                </div>
                {canEdit && (
                    <Button onClick={() => setShowUpload(!showUpload)} size="sm" className="gap-1">
                        {showUpload ? <X className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                        {showUpload ? "Cancelar" : "Subir Plantilla"}
                    </Button>
                )}
            </div>

            {showUpload && (
                <Card className="border-2 border-blue-200 bg-blue-50/50 animate-fade-in-up">
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Archivo</label>
                            <Input
                                type="file"
                                accept=".xlsx,.xls,.pdf,.docx,.doc,.jpg,.png,.jpeg"
                                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Descripción (opcional)</label>
                            <Input
                                placeholder="Ej: Formato base para facturación mensual"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="gap-1">
                                <Upload className="h-4 w-4" />
                                {uploading ? "Subiendo..." : "Subir"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="p-8 text-center text-muted-foreground">Cargando plantillas...</div>
            ) : templates.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FolderOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">No hay plantillas subidas</p>
                        <p className="text-xs text-muted-foreground mt-1">Sube archivos de formato para este cliente</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {templates.map(t => (
                        <Card key={t.id} className="hover:shadow-md transition-shadow group">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{getFileIcon(t.file_name)}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" title={t.file_name}>{t.file_name}</p>
                                        {t.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                                        )}
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            {new Date(t.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 flex-1"
                                        onClick={() => window.open(t.file_url, "_blank")}>
                                        <Download className="h-3 w-3" /> Descargar
                                    </Button>
                                    {canEdit && (
                                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                                            onClick={() => handleDelete(t.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
