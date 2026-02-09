"use client"

import type React from "react"
import { sendDeclarationEmail } from "@/app/actions/send-email"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Mail, Upload, X } from "lucide-react"
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
  const { toast } = useToast()
  const supabase = createClient()

  const years = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => 1990 + i).reverse()

  useEffect(() => {
    loadDeclarations()
  }, [clientId, selectedYear])

  async function loadDeclarations() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("monthly_declarations")
        .select("*")
        .eq("client_id", clientId)
        .eq("user_id", user.id)
        .eq("year", selectedYear)

      if (error) throw error

      const declarationsMap: Record<number, MonthlyDeclaration> = {}
      data?.forEach((decl: any) => {
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
                ${declaration.tax_payment ? `<p><strong>Impuestos:</strong> $${declaration.tax_payment.toLocaleString()}</p>` : ""}
                ${declaration.invoiced_amount ? `<p><strong>Facturado:</strong> $${declaration.invoiced_amount.toLocaleString()}</p>` : ""}
                ${declaration.expenses_amount ? `<p><strong>Gastos:</strong> $${declaration.expenses_amount.toLocaleString()}</p>` : ""}
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
                    <span className="text-muted-foreground">Impuestos:</span>
                    <span className="font-medium">${(declaration?.tax_payment || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Facturado:</span>
                    <span className="font-medium">${(declaration?.invoiced_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Gastos:</span>
                    <span className="font-medium">${(declaration?.expenses_amount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {!isClient && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        openMonthDialog(index)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {hasData ? "Editar" : "Agregar Datos"}
                    </Button>
                    {hasData && declaration.declaration_pdf_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent"
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
      </CardContent>
    </Card>
  )
}
