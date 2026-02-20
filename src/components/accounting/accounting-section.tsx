"use client"

import type React from "react"
import { sendDeclarationEmail } from "@/app/actions/send-email"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Mail, Upload, X, FileSpreadsheet, ArrowUpDown, TrendingUp, TrendingDown, Receipt, UserPlus, Check, Loader2, ClipboardList } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

interface MonthlyDeclaration {
  id?: string
  month: number
  year: number
  declaration_pdf_url?: string
  declaration_pdf_name?: string
  tax_payment?: number
  invoiced_amount?: number
  expenses_amount?: number
  iva_emitidos?: number
  iva_recibidos?: number
  num_facturas_emitidas?: number
  num_facturas_recibidas?: number
  gross_profit?: number
  iva_balance?: number
  notes?: string
}

export function AccountingSection({ clientId, userRole }: { clientId: string; userRole?: string }) {
  const isClient = userRole === "cliente"
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [declarations, setDeclarations] = useState<Record<number, MonthlyDeclaration>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [formData, setFormData] = useState<MonthlyDeclaration | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string>("")
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [emailRecipient, setEmailRecipient] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFiles, setImportFiles] = useState<File[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importMonth, setImportMonth] = useState<number | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  // DIOT state
  const [isDiotDialogOpen, setIsDiotDialogOpen] = useState(false)
  const [diotMonth, setDiotMonth] = useState<number | null>(null)
  const [diotContadores, setDiotContadores] = useState<Array<{ id: string; auth_user_id: string; full_name: string; role: string }>>([])
  const [diotLoading, setDiotLoading] = useState(false)
  const [diotAssigning, setDiotAssigning] = useState(false)
  const [diotAssignedMonth, setDiotAssignedMonth] = useState<Record<number, string>>({})
  const { toast } = useToast()
  const supabase = createClient()

  const years = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => 1990 + i).reverse()

  useEffect(() => {
    loadDeclarations()
  }, [clientId, selectedYear])

  async function loadDeclarations() {
    try {
      const res = await fetch(`/api/accounting/declarations?clientId=${clientId}&year=${selectedYear}`)
      const result = await res.json()

      if (!res.ok) throw new Error(result.error)

      const declarationsMap: Record<number, MonthlyDeclaration> = {}
      result.data?.forEach((decl: any) => {
        declarationsMap[decl.month] = decl
      })
      setDeclarations(declarationsMap)
    } catch (error) {
      console.error("Error loading declarations:", error)
    }
  }

  function openMonthDialog(monthIndex: number) {
    setSelectedMonth(monthIndex + 1)
    const existingDeclaration = declarations[monthIndex + 1]
    setFormData(
      existingDeclaration || {
        month: monthIndex + 1,
        year: selectedYear,
        tax_payment: 0,
        invoiced_amount: 0,
        expenses_amount: 0,
        notes: "",
      },
    )
    setPdfFile(null)
    setSelectedFileName("")
    setIsDialogOpen(true)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPdfFile(file)
      setSelectedFileName(file.name)
    }
  }

  function clearSelectedFile() {
    setPdfFile(null)
    setSelectedFileName("")
  }

  async function handleSaveDeclaration() {
    if (!formData || selectedMonth === null) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return
      }

      let pdfUrl = formData.declaration_pdf_url || ""
      let pdfName = formData.declaration_pdf_name || ""

      if (pdfFile) {
        const filePath = `${user.id}/${clientId}/declarations/${selectedYear}/${selectedMonth}/${Date.now()}.pdf`

        const { error: uploadError } = await supabase.storage.from("client-documents").upload(filePath, pdfFile)

        if (uploadError) {
          throw uploadError
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("client-documents").getPublicUrl(filePath)

        pdfUrl = publicUrl
        pdfName = pdfFile.name
      }

      const declarationData = {
        client_id: clientId,
        user_id: user.id,
        year: selectedYear,
        month: selectedMonth,
        declaration_pdf_url: pdfUrl,
        declaration_pdf_name: pdfName,
        tax_payment: formData.tax_payment || 0,
        invoiced_amount: formData.invoiced_amount || 0,
        expenses_amount: formData.expenses_amount || 0,
        notes: formData.notes || "",
      }

      if (formData.id) {
        const { error } = await supabase.from("monthly_declarations").update(declarationData).eq("id", formData.id)

        if (error) {
          throw error
        }
      } else {
        const { error } = await supabase.from("monthly_declarations").insert(declarationData)

        if (error) {
          throw error
        }
      }

      toast({ title: "Declaración guardada correctamente" })
      setIsDialogOpen(false)
      setPdfFile(null)
      setSelectedFileName("")
      loadDeclarations()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  async function handleSendDeclarationEmail(declaration: MonthlyDeclaration) {
    if (!emailRecipient) {
      toast({ title: "Error", description: "Por favor ingresa un correo electrónico", variant: "destructive" })
      return
    }

    setIsSendingEmail(true)

    try {
      const monthName = months[declaration.month - 1]

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { margin-bottom: 30px; }
              .content { margin-bottom: 30px; }
              .signature { margin-top: 40px; }
              .signature img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Declaración Mensual</h2>
              </div>
              <div class="content">
                <p>Hola!</p>
                <p>Soy Robot Contador de AR&CP, te dejo a la mano tu declaración de <strong>${monthName}</strong> del año <strong>${declaration.year}</strong>.</p>
                ${declaration.declaration_pdf_url ? `<p><a href="${declaration.declaration_pdf_url}" style="color: #0066cc; text-decoration: none;">📄 Descargar Declaración PDF</a></p>` : ""}
                ${declaration.invoiced_amount ? `<p><strong>Facturado:</strong> $${declaration.invoiced_amount.toLocaleString()}</p>` : ""}
                ${declaration.expenses_amount ? `<p><strong>Gastos:</strong> $${declaration.expenses_amount.toLocaleString()}</p>` : ""}
                ${declaration.tax_payment ? `<p><strong>Impuestos:</strong> $${declaration.tax_payment.toLocaleString()}</p>` : ""}
                ${declaration.gross_profit ? `<p><strong>Utilidad bruta:</strong> $${declaration.gross_profit.toLocaleString()}</p>` : ""}
              </div>
              <div class="signature">
                <img src="${window.location.origin}/images/robot-contador-firma.jpg" alt="Robot Contador - AR&CP" />
              </div>
            </div>
          </body>
        </html>
      `

      const result = await sendDeclarationEmail({
        to: emailRecipient,
        subject: `Declaración ${monthName} ${declaration.year} - AR&CP`,
        html: emailHtml,
        clientId,
        attachmentUrl: declaration.declaration_pdf_url,
      })

      if (!result.success) {
        throw new Error(result.error || "Error al enviar el correo")
      }

      toast({ title: "Correo enviado correctamente" })
      setIsEmailDialogOpen(false)
      setEmailRecipient("")
    } catch (error: any) {
      console.error("[v0] Error al enviar correo:", error)
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsSendingEmail(false)
    }
  }

  function openEmailDialog(declaration: MonthlyDeclaration) {
    setFormData(declaration)
    setIsEmailDialogOpen(true)
  }

  // === DIOT Logic ===
  async function openDiotDialog(monthIndex: number) {
    setDiotMonth(monthIndex + 1)
    setIsDiotDialogOpen(true)
    if (diotContadores.length === 0) {
      setDiotLoading(true)
      try {
        const res = await fetch("/api/users/contadores")
        const result = await res.json()
        if (res.ok) {
          setDiotContadores(result.data || [])
        }
      } catch (err) {
        console.error("Error loading contadores:", err)
      } finally {
        setDiotLoading(false)
      }
    }
  }

  async function assignDiot(contador: { id: string; auth_user_id: string; full_name: string }) {
    if (!diotMonth) return
    setDiotAssigning(true)
    try {
      const res = await fetch("/api/activity/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "diot_assignment",
          entityId: `${clientId}-${selectedYear}-${diotMonth}`,
          assignToUserId: contador.auth_user_id,
          module: "accounting",
        }),
      })

      const result = await res.json()
      console.log("[DIOT Response]", result)

      if (res.ok) {
        setDiotAssignedMonth(prev => ({ ...prev, [diotMonth]: contador.full_name }))
        toast({
          title: "DIOT asignado",
          description: `Se asignó DIOT de ${months[diotMonth - 1]} a ${contador.full_name}`,
        })
        setIsDiotDialogOpen(false)
      } else {
        throw new Error(result.error)
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setDiotAssigning(false)
    }
  }

  // === Import Excel Logic ===
  function openImportDialog(monthIndex: number) {
    setImportMonth(monthIndex + 1)
    setImportFiles([])
    setIsImportDialogOpen(true)
  }

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setImportFiles((prev) => [...prev, ...files])
    if (importInputRef.current) {
      importInputRef.current.value = ""
    }
  }

  function removeImportFile(index: number) {
    setImportFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleImportExcel() {
    if (!importMonth || importFiles.length === 0) return

    setIsImporting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const formData = new FormData()
      formData.append("clientId", clientId)
      formData.append("year", selectedYear.toString())
      formData.append("month", importMonth.toString())
      formData.append("userId", user.id)

      importFiles.forEach((file, i) => {
        formData.append(`file${i}`, file)
      })

      const res = await fetch("/api/accounting/import", {
        method: "POST",
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Error al importar")
      }

      toast({
        title: "✅ Datos importados correctamente",
        description: `Emitidos: $${result.data.totalEmitidos.toLocaleString()} | Recibidos: $${result.data.totalRecibidos.toLocaleString()}`,
      })

      setIsImportDialogOpen(false)
      setImportFiles([])
      loadDeclarations()
    } catch (error: any) {
      toast({ title: "Error al importar", description: error.message, variant: "destructive" })
    } finally {
      setIsImporting(false)
    }
  }

  function getFileTypeLabel(fileName: string) {
    const lower = fileName.toLowerCase()
    if (lower.includes("trasladado")) return { label: "IVA Trasladado", color: "text-blue-600 bg-blue-100" }
    if (lower.includes("acreditable")) return { label: "IVA Acreditable", color: "text-purple-600 bg-purple-100" }
    if (lower.includes("emitido")) return { label: "Emitidos", color: "text-emerald-600 bg-emerald-100" }
    if (lower.includes("recibido")) return { label: "Recibidos", color: "text-orange-600 bg-orange-100" }
    return { label: "Excel", color: "text-gray-600 bg-gray-100" }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Contabilidad - {selectedYear}</span>
          <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(Number.parseInt(val))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {months.map((month, index) => {
            const declaration = declarations[index + 1]
            const hasData = !!declaration
            const hasImportedData = hasData && (declaration.num_facturas_emitidas || declaration.num_facturas_recibidas)

            return (
              <div
                key={index}
                className={`border rounded-lg p-4 ${!isClient ? 'hover:border-primary transition-colors cursor-pointer' : ''}`}
                onClick={() => !isClient && openMonthDialog(index)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">{month}</h4>
                  <Badge variant={hasData ? "default" : "outline"} className="text-xs">
                    {hasData ? "Completo" : "Pendiente"}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Declaración:</span>
                    <FileText
                      className={`h-4 w-4 ${declaration?.declaration_pdf_url ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      Facturado:
                    </span>
                    <span className="font-medium">${(declaration?.invoiced_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      Gastos:
                    </span>
                    <span className="font-medium">${(declaration?.expenses_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Impuestos:</span>
                    <span className="font-medium">${(declaration?.tax_payment || 0).toLocaleString()}</span>
                  </div>

                  {/* EZAudita imported data */}
                  {hasImportedData && (
                    <>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <ArrowUpDown className="h-3 w-3 text-blue-500" />
                            IVA Balance:
                          </span>
                          <span className={`font-medium ${(declaration.iva_balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ${(declaration.iva_balance || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Receipt className="h-3 w-3 text-purple-500" />
                            Utilidad:
                          </span>
                          <span className={`font-medium ${(declaration.gross_profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ${(declaration.gross_profit || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            📄 {declaration.num_facturas_emitidas || 0} emitidas
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            📥 {declaration.num_facturas_recibidas || 0} recibidas
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {!isClient && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                      onClick={(e) => {
                        e.stopPropagation()
                        openMonthDialog(index)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {hasData ? "Editar" : "Agregar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                      title="Importar Excel de EZAudita"
                      onClick={(e) => {
                        e.stopPropagation()
                        openImportDialog(index)
                      }}
                    >
                      <FileSpreadsheet className="h-3 w-3" />
                    </Button>
                    {hasData && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={`${diotAssignedMonth[index + 1] ? 'border-purple-400 bg-purple-50 text-purple-800' : 'border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800'}`}
                        title={diotAssignedMonth[index + 1] ? `DIOT: ${diotAssignedMonth[index + 1]}` : "Asignar DIOT"}
                        onClick={(e) => {
                          e.stopPropagation()
                          openDiotDialog(index)
                        }}
                      >
                        <ClipboardList className="h-3 w-3" />
                      </Button>
                    )}
                    {hasData && declaration.declaration_pdf_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEmailDialog(declaration)
                        }}
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Manual Edit Dialog */}
        {!isClient && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedMonth && `${months[selectedMonth - 1]} ${selectedYear}`}</DialogTitle>
              </DialogHeader>
              {formData && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pdf">Declaración PDF</Label>
                    <div className="space-y-2">
                      {!selectedFileName && !formData.declaration_pdf_name && (
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                          <Input id="pdf" type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                          <Label htmlFor="pdf" className="cursor-pointer flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Seleccionar archivo PDF</span>
                          </Label>
                        </div>
                      )}

                      {selectedFileName && (
                        <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="text-sm flex-1 truncate">{selectedFileName}</span>
                          <Button size="sm" variant="ghost" onClick={clearSelectedFile}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {!selectedFileName && formData.declaration_pdf_name && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="text-sm flex-1 truncate">{formData.declaration_pdf_name}</span>
                          </div>
                          <Input
                            id="pdf-replace"
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          <Label htmlFor="pdf-replace">
                            <Button size="sm" variant="outline" className="w-full bg-transparent" asChild>
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                Cambiar archivo
                              </span>
                            </Button>
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tax">Pago de Impuestos</Label>
                    <Input
                      id="tax"
                      type="number"
                      step="0.01"
                      value={formData.tax_payment || ""}
                      onChange={(e) => setFormData({ ...formData, tax_payment: Number.parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiced">Facturado</Label>
                    <Input
                      id="invoiced"
                      type="number"
                      step="0.01"
                      value={formData.invoiced_amount || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, invoiced_amount: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="expenses">Gastos</Label>
                    <Input
                      id="expenses"
                      type="number"
                      step="0.01"
                      value={formData.expenses_amount || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, expenses_amount: Number.parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <Button onClick={handleSaveDeclaration} className="w-full">
                    Guardar
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Import Excel Dialog */}
        {!isClient && (
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  Importar Excel - {importMonth && `${months[importMonth - 1]} ${selectedYear}`}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sube los archivos Excel exportados desde EZAudita. El sistema identifica automáticamente el tipo por el nombre:
                  <strong> emitidos</strong>, <strong>recibidos</strong>, <strong>IVA trasladado</strong> y <strong>IVA acreditable</strong>.
                </p>

                {/* File drop zone */}
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
                  <Input
                    ref={importInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    multiple
                    className="hidden"
                    id="import-excel"
                    onChange={handleImportFileChange}
                  />
                  <Label htmlFor="import-excel" className="cursor-pointer flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-10 w-10 text-emerald-500" />
                    <span className="text-sm font-medium">Seleccionar archivos Excel</span>
                    <span className="text-xs text-muted-foreground">Puedes subir múltiples archivos a la vez</span>
                  </Label>
                </div>

                {/* Selected files list */}
                {importFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Archivos seleccionados:</Label>
                    {importFiles.map((file, i) => {
                      const typeInfo = getFileTypeLabel(file.name)
                      return (
                        <div key={i} className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                          <FileSpreadsheet className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-sm flex-1 truncate">{file.name}</span>
                          <Badge variant="outline" className={`text-[10px] ${typeInfo.color} border-0`}>
                            {typeInfo.label}
                          </Badge>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeImportFile(i)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}

                <Button
                  onClick={handleImportExcel}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={importFiles.length === 0 || isImporting}
                >
                  {isImporting ? (
                    "Importando..."
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar {importFiles.length > 0 ? `(${importFiles.length} archivo${importFiles.length > 1 ? "s" : ""})` : ""}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Email Dialog */}
        {!isClient && (
          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Enviar Declaración por Correo</DialogTitle>
              </DialogHeader>
              {formData && (
                <div className="space-y-4">
                  <div>
                    <Label>Mes y Año</Label>
                    <p className="text-sm font-medium">
                      {months[formData.month - 1]} {formData.year}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="email">Correo del Destinatario</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="cliente@ejemplo.com"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => handleSendDeclarationEmail(formData)}
                    className="w-full"
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? "Enviando..." : "Enviar Correo"}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* DIOT Assignment Dialog */}
        {!isClient && (
          <Dialog open={isDiotDialogOpen} onOpenChange={setIsDiotDialogOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Asignar DIOT - {diotMonth && `${months[diotMonth - 1]} ${selectedYear}`}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Selecciona al contador que realizará el DIOT de este mes.
              </p>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {diotLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : diotContadores.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No hay contadores disponibles</p>
                ) : (
                  diotContadores.map((contador) => (
                    <button
                      key={contador.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      onClick={() => assignDiot(contador)}
                      disabled={diotAssigning}
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {contador.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{contador.full_name}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{contador.role}</p>
                      </div>
                      {diotMonth && diotAssignedMonth[diotMonth] === contador.full_name && (
                        <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}
