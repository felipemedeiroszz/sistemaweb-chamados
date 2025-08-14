import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MessageSquare, UserCheck, RotateCcw } from "lucide-react"

interface HistoryItem {
  id: string
  update_type: string
  old_value?: string
  new_value?: string
  comment?: string
  created_at: string
  user: {
    name: string
    user_type: string
  }
}

interface TicketHistoryProps {
  history: HistoryItem[]
}

const updateTypeIcons = {
  status_change: RotateCcw,
  assignment: UserCheck,
  comment: MessageSquare,
  priority_change: RotateCcw,
}

const updateTypeLabels = {
  status_change: "Mudança de Status",
  assignment: "Atribuição",
  comment: "Comentário",
  priority_change: "Mudança de Prioridade",
}

const userTypeColors = {
  loja: "bg-blue-100 text-blue-800",
  tecnico: "bg-green-100 text-green-800",
}

export default function TicketHistory({ history }: TicketHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico do Chamado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Nenhuma atualização registrada</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico do Chamado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item, index) => {
            const Icon = updateTypeIcons[item.update_type as keyof typeof updateTypeIcons] || MessageSquare
            const isLast = index === history.length - 1

            return (
              <div key={item.id} className="relative">
                {!isLast && <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200" />}

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {updateTypeLabels[item.update_type as keyof typeof updateTypeLabels]}
                      </span>
                      <Badge className={userTypeColors[item.user.user_type as keyof typeof userTypeColors]}>
                        {item.user.name}
                      </Badge>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      {item.update_type === "status_change" && (
                        <span>
                          Status alterado de <strong>{item.old_value}</strong> para <strong>{item.new_value}</strong>
                        </span>
                      )}
                      {item.update_type === "assignment" && <span>Chamado atribuído ao técnico</span>}
                      {item.update_type === "priority_change" && (
                        <span>
                          Prioridade alterada de <strong>{item.old_value}</strong> para{" "}
                          <strong>{item.new_value}</strong>
                        </span>
                      )}
                      {item.update_type === "comment" && <span>Comentário adicionado</span>}
                    </div>

                    {item.comment && <div className="bg-gray-50 rounded-lg p-3 text-sm mb-2">{item.comment}</div>}

                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(item.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
