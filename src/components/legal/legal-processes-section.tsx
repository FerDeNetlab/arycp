"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Scale, Plus, ChevronDown, ChevronUp, Trash2, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface LegalProcess {
  id: string
  title: string
  description: string | null
  status: string
  created_at: string
}

interface LegalProcessStep {
  id: string
  legal_process_id: string
  step_name: string
  step_order: number
  status: string
  notes: string | null
  completed_at: string | null
}

export function LegalProcessesSection({ clientId }: { clientId: string }) {
  const [processes, setProcesses] = useState<LegalProcess[]>([])
  const [processSteps, setProcessSteps] = useState<Record<string, LegalProcessStep[]>>({})
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newProcess, setNewProcess] = useState({ title: "", description: "" })
  const [newSteps, setNewSteps] = useState<string[]>([""])
  const supabase = createClient()

  useEffect(() => {
    loadProcesses()
  }, [clientId])

  const loadProcesses = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from("legal_processes")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })

    if (data) {
      setProcesses(data)
      // Cargar pasos de cada proceso
      for (const process of data) {
        const { data: steps } = await supabase
          .from("legal_process_steps")
          .select("*")
          .eq("legal_process_id", process.id)
          .order("step_order", { ascending: true })

        if (steps) {
          setProcessSteps((prev) => ({ ...prev, [process.id]: steps }))
        }
      }
    }
    setIsLoading(false)
  }

  const handleCreateProcess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !newProcess.title.trim()) return

    const { data: process, error } = await supabase
      .from("legal_processes")
      .insert({
        client_id: clientId,
        user_id: user.id,
        title: newProcess.title,
        description: newProcess.description || null,
        status: "in_progress",
      })
      .select()
      .single()

    if (process) {
      // Crear pasos
      const validSteps = newSteps.filter((s) => s.trim())
      if (validSteps.length > 0) {
        const stepsToInsert = validSteps.map((step, index) => ({
          legal_process_id: process.id,
          user_id: user.id,
          step_name: step,
          step_order: index + 1,
          status: "pending",
        }))

        await supabase.from("legal_process_steps").insert(stepsToInsert)
      }

      setNewProcess({ title: "", description: "" })
      setNewSteps([""])
      setIsDialogOpen(false)
      loadProcesses()
    }
  }

  const toggleProcessExpanded = (processId: string) => {
    setExpandedProcesses((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(processId)) {
        newSet.delete(processId)
      } else {
        newSet.add(processId)
      }
      return newSet
    })
  }

  const handleToggleStepStatus = async (step: LegalProcessStep) => {
    const newStatus = step.status === "completed" ? "pending" : "completed"
    await supabase
      .from("legal_process_steps")
      .update({
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", step.id)

    loadProcesses()
  }

  const handleDeleteProcess = async (processId: string) => {
    if (!confirm("¿Estás seguro de eliminar este proceso y todos sus pasos?")) return

    await supabase.from("legal_processes").delete().eq("id", processId)
    loadProcesses()
  }

  const handleUpdateProcessStatus = async (processId: string, status: string) => {
    await supabase.from("legal_processes").update({ status }).eq("id", processId)
    loadProcesses()
  }

  const addStepInput = () => {
    setNewSteps([...newSteps, ""])
  }

  const updateStepInput = (index: number, value: string) => {
    const updated = [...newSteps]
    updated[index] = value
    setNewSteps(updated)
  }

  const removeStepInput = (index: number) => {
    if (newSteps.length > 1) {
      setNewSteps(newSteps.filter((_, i) => i !== index))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700"
      case "in_progress":
        return "bg-blue-100 text-blue-700"
      case "cancelled":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado"
      case "in_progress":
        return "En Progreso"
      case "cancelled":
        return "Cancelado"
      default:
        return "Pendiente"
    }
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-purple-600" />
            Procesos Jurídicos
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proceso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Proceso Jurídico</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Título del Proceso</label>
                  <Input
                    placeholder="Ej: Acta Constitutiva"
                    value={newProcess.title}
                    onChange={(e) => setNewProcess({ ...newProcess, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Descripción (opcional)</label>
                  <Textarea
                    placeholder="Descripción del proceso..."
                    value={newProcess.description}
                    onChange={(e) => setNewProcess({ ...newProcess, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Pasos del Proceso</label>
                  <div className="space-y-2">
                    {newSteps.map((step, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex items-center justify-center w-8 h-10 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                          {index + 1}
                        </div>
                        <Input
                          placeholder={`Paso ${index + 1}`}
                          value={step}
                          onChange={(e) => updateStepInput(index, e.target.value)}
                          className="flex-1"
                        />
                        {newSteps.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStepInput(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" onClick={addStepInput} className="mt-2 w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Paso
                  </Button>
                </div>
                <Button onClick={handleCreateProcess} className="w-full" disabled={!newProcess.title.trim()}>
                  Crear Proceso
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando procesos...</div>
        ) : processes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay procesos jurídicos registrados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {processes.map((process) => (
              <div key={process.id} className="border rounded-lg overflow-hidden">
                <div
                  className="p-4 bg-muted/30 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleProcessExpanded(process.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedProcesses.has(process.id) ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <h4 className="font-semibold">{process.title}</h4>
                      {process.description && <p className="text-sm text-muted-foreground">{process.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={process.status}
                      onValueChange={(value) => handleUpdateProcessStatus(process.id, value)}
                    >
                      <SelectTrigger className={`w-36 ${getStatusColor(process.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProcess(process.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expandedProcesses.has(process.id) && (
                  <div className="p-4 border-t bg-background">
                    <h5 className="text-sm font-medium mb-3">Pasos del proceso:</h5>
                    {processSteps[process.id]?.length > 0 ? (
                      <div className="space-y-2">
                        {processSteps[process.id].map((step) => (
                          <div
                            key={step.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              step.status === "completed" ? "bg-green-50 border-green-200" : "bg-white"
                            }`}
                          >
                            <button
                              onClick={() => handleToggleStepStatus(step)}
                              className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors ${
                                step.status === "completed"
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "border-gray-300 hover:border-purple-500"
                              }`}
                            >
                              {step.status === "completed" && <Check className="h-4 w-4" />}
                            </button>
                            <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                              {step.step_order}
                            </div>
                            <span
                              className={`flex-1 ${
                                step.status === "completed" ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {step.step_name}
                            </span>
                            {step.completed_at && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(step.completed_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay pasos definidos</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
