"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ChevronDown, ChevronRight, CheckCircle2, Circle } from "lucide-react"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LegalSection({ clientId }: { clientId: string }) {
  const [expandedProcess, setExpandedProcess] = useState<string | null>(null)

  // Ejemplo de proceso
  const exampleProcess = {
    id: "1",
    title: "Acta Constitutiva",
    status: "in_progress",
    steps: [
      { id: "1", name: "Autorización de denominación de uso", status: "completed" },
      { id: "2", name: "Proyecto constitutivo", status: "completed" },
      { id: "3", name: "Firma de acta", status: "in_progress" },
      { id: "4", name: "Inscripción en Registro Público", status: "pending" },
      { id: "5", name: "Obtención de RFC", status: "pending" },
    ],
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Procesos Jurídicos</span>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proceso
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Ejemplo de proceso */}
          <div className="border rounded-lg overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedProcess(expandedProcess === "1" ? null : "1")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedProcess === "1" ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <h4 className="font-semibold">{exampleProcess.title}</h4>
                    <p className="text-sm text-muted-foreground">{exampleProcess.steps.length} pasos · 2 completados</p>
                  </div>
                </div>
                <Badge variant="outline">En Progreso</Badge>
              </div>
            </div>

            {expandedProcess === "1" && (
              <div className="border-t p-4 space-y-3 bg-muted/30">
                {exampleProcess.steps.map((step, _index) => (
                  <div key={step.id} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                    {step.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : step.status === "in_progress" ? (
                      <Circle className="h-5 w-5 text-yellow-500 fill-yellow-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{step.name}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {step.status === "completed"
                          ? "Completado"
                          : step.status === "in_progress"
                            ? "En progreso"
                            : "Pendiente"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center py-4">
            Este es un ejemplo. Agrega nuevos procesos jurídicos según los necesites.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
