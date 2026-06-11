"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CheckCircle, Circle, Camera, ChevronDown, ChevronUp } from "lucide-react"

interface ChecklistItem {
  id: string
  title: string
  description: string | null
  requires_photo: boolean
  order_index: number
}

interface Checklist {
  id: string
  name: string
  store_id: string
  is_recurring: boolean
  recurring_day_of_week: number | null
  recurring_time: string | null
  items: ChecklistItem[]
  created_at: string
}

interface ChecklistExecution {
  id: string
  checklist_id: string
  executed_at: string
  due_date: string
  responses: {
    item_id: string
    completed: boolean
    photo_url: string | null
    notes: string | null
  }[]
}

interface ChecklistBrowserProps {
  checklists: Checklist[]
  executions: ChecklistExecution[]
  onStartExecution: (checklistId: string) => void
  onSubmitExecution: (executionId: string, responses: { item_id: string; completed: boolean; photo_url?: string; notes?: string }[]) => void
}

export default function ChecklistBrowser({
  checklists,
  executions,
  onStartExecution,
  onSubmitExecution,
}: ChecklistBrowserProps) {
  const [selectedChecklist, setSelectedChecklist] = React.useState<Checklist | null>(null)
  const [activeExecution, setActiveExecution] = React.useState<ChecklistExecution | null>(null)
  const [executionResponses, setExecutionResponses] = React.useState<Record<string, { completed: boolean; photo_url: string; notes: string }>>({})
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({})
  const [photoModalOpen, setPhotoModalOpen] = React.useState(false)
  const [currentPhotoItem, setCurrentPhotoItem] = React.useState<string | null>(null)

  // Inicializar respostas quando uma execução é aberta
  React.useEffect(() => {
    if (activeExecution) {
      const initialResponses: Record<string, { completed: boolean; photo_url: string; notes: string }> = {}
      activeExecution.responses.forEach((resp) => {
        initialResponses[resp.item_id] = {
          completed: resp.completed,
          photo_url: resp.photo_url || "",
          notes: resp.notes || "",
        }
      })
      setExecutionResponses(initialResponses)
    }
  }, [activeExecution])

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  const updateResponse = (itemId: string, field: "completed" | "photo_url" | "notes", value: any) => {
    setExecutionResponses((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [completed]: prev[itemId]?.completed ?? false,
        photo_url: prev[itemId]?.photo_url ?? "",
        notes: prev[itemId]?.notes ?? "",
        [field]: value,
      },
    }))
  }

  const handleSubmit = () => {
    if (!activeExecution) return
    const responses = Object.entries(executionResponses).map(([item_id, data]) => ({
      item_id,
      completed: data.completed,
      photo_url: data.photo_url || undefined,
      notes: data.notes || undefined,
    }))
    onSubmitExecution(activeExecution.id, responses)
    setActiveExecution(null)
    setExecutionResponses({})
  }

  const openExecution = (checklist: Checklist) => {
    // Buscar execução existente para hoje ou criar nova
    const today = new Date().toISOString().split("T")[0]
    const existingExecution = executions.find(
      (e) => e.checklist_id === checklist.id && e.due_date === today
    )

    if (existingExecution) {
      setActiveExecution(existingExecution)
    } else {
      setSelectedChecklist(checklist)
      onStartExecution(checklist.id)
    }
  }

  const getExecutionForChecklist = (checklistId: string): ChecklistExecution | undefined => {
    const today = new Date().toISOString().split("T")[0]
    return executions.find((e) => e.checklist_id === checklistId && e.due_date === today)
  }

  const isItemCompleted = (itemId: string): boolean => {
    if (!activeExecution) return false
    const response = activeExecution.responses.find((r) => r.item_id === itemId)
    return response?.completed ?? false
  }

  if (checklists.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checklists</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            Nenhum checklist disponível para sua loja no momento.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {checklists.map((checklist) => {
        const execution = getExecutionForChecklist(checklist.id)
        const isCompleted = execution?.responses?.every((r) => r.completed) ?? false

        return (
          <Card key={checklist.id} className={isCompleted ? "border-green-200 bg-green-50" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg">{checklist.name}</CardTitle>
                  {isCompleted && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle className="mr-1 h-3 w-3" /> Concluído
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => openExecution(checklist)}
                  variant={isCompleted ? "outline" : "default"}
                >
                  {execution ? "Ver/Editar" : "Iniciar"}
                </Button>
              </div>
              {checklist.is_recurring && (
                <p className="text-sm text-gray-500 mt-1">
                  Recorrente: {getDayName(checklist.recurring_day_of_week)} às {checklist.recurring_time}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {checklist.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-start space-x-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer transition"
                    onClick={() => toggleItemExpanded(item.id)}
                  >
                    <div className="mt-0.5">
                      {isItemCompleted(item.id) ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {index + 1}. {item.title}
                        </span>
                        <div className="flex items-center space-x-2">
                          {item.requires_photo && (
                            <Badge variant="outline" className="text-xs">
                              <Camera className="mr-1 h-3 w-3" /> Foto
                            </Badge>
                          )}
                          {expandedItems[item.id] ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      {expandedItems[item.id] && item.description && (
                        <p className="text-sm text-gray-600 mt-1 pl-7">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Modal de Execução do Checklist */}
      <Dialog open={!!activeExecution} onOpenChange={(open) => !open && setActiveExecution(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activeExecution?.checklist?.name || selectedChecklist?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedChecklist?.items.map((item, index) => {
              const response = executionResponses[item.id] || { completed: false, photo_url: "", notes: "" }
              return (
                <Card key={item.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={response.completed}
                          onChange={(e) => {
                            const newResponses = {
                              ...executionResponses,
                              [item.id]: { ...response, completed: e.target.checked },
                            }
                            setExecutionResponses(newResponses)
                          }}
                          className="mt-1"
                        />
                        <div>
                          <span className="font-medium">{index + 1}. {item.title}</span>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                      {item.requires_photo && (
                        <Badge variant="outline" className="text-xs">
                          <Camera className="mr-1 h-3 w-3" /> Foto obrigatória
                        </Badge>
                      )}
                    </div>
                    {item.requires_photo && (
                      <div className="pl-8">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentPhotoItem(item.id)
                            setPhotoModalOpen(true)
                          }}
                        >
                          <Camera className="mr-1 h-4 w-4" />
                          {response.photo_url ? "Alterar foto" : "Adicionar foto"}
                        </Button>
                        {response.photo_url && (
                          <p className="text-xs text-green-600 mt-1">Foto adicionada</p>
                        )}
                      </div>
                    )}
                    <div className="pl-8">
                      <Input
                        placeholder="Observações (opcional)"
                        value={response.notes}
                        onChange={(e) => {
                          const newResponses = {
                            ...executionResponses,
                            [item.id]: { ...response, notes: e.target.value },
                          }
                          setExecutionResponses(newResponses)
                        }}
                      />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSubmit}>Salvar Respostas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Foto (simplificado - em produção seria upload real) */}
      <Dialog open={photoModalOpen} onOpenChange={setPhotoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Foto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Em produção, aqui seria aberto o seletor de arquivos ou câmera do dispositivo.
            </p>
            <Input
              placeholder="Cole a URL da imagem aqui (para teste)"
              value={executionResponses[currentPhotoItem || ""]?.photo_url || ""}
              onChange={(e) => {
                if (currentPhotoItem) {
                  const newResponses = {
                    ...executionResponses,
                    [currentPhotoItem]: {
                      ...executionResponses[currentPhotoItem],
                      photo_url: e.target.value,
                    },
                  }
                  setExecutionResponses(newResponses)
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setPhotoModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function getDayName(dayOfWeek: number | null): string {
  if (dayOfWeek === null) return ""
  const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
  return days[dayOfWeek] || ""
}
