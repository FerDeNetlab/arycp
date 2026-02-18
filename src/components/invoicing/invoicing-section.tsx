"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, XCircle, FolderOpen, BarChart3 } from "lucide-react"
import { InvoicesTab } from "./invoices-tab"
import { CancellationsTab } from "./cancellations-tab"
import { TemplatesTab } from "./templates-tab"
import { SummaryTab } from "./summary-tab"

interface InvoicingSectionProps {
    clientId: string
    clientName: string
    canEdit: boolean
}

export function InvoicingSection({ clientId, clientName, canEdit }: InvoicingSectionProps) {
    const [activeTab, setActiveTab] = useState("invoices")

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-12">
                    <TabsTrigger value="invoices" className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Facturas</span>
                    </TabsTrigger>
                    <TabsTrigger value="cancellations" className="flex items-center gap-2 text-sm">
                        <XCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Cancelaciones</span>
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="flex items-center gap-2 text-sm">
                        <FolderOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">Plantillas</span>
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="flex items-center gap-2 text-sm">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Resumen</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="invoices" className="mt-6">
                    <InvoicesTab clientId={clientId} clientName={clientName} canEdit={canEdit} />
                </TabsContent>

                <TabsContent value="cancellations" className="mt-6">
                    <CancellationsTab clientId={clientId} clientName={clientName} canEdit={canEdit} />
                </TabsContent>

                <TabsContent value="templates" className="mt-6">
                    <TemplatesTab clientId={clientId} canEdit={canEdit} />
                </TabsContent>

                <TabsContent value="summary" className="mt-6">
                    <SummaryTab clientId={clientId} clientName={clientName} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
