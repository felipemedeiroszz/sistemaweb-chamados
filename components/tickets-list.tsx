import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, User, Wrench, Eye } from "lucide-react"
import Link from "next/link"

interface Ticket {
  id: string
  ticket_number: number
  title: string
  description: string
  service_type: string
  priority: string
  status: string
  created_at: string
  assigned_technician?: {
    name: string
    speciality: string
  }
}

interface TicketsListProps {
  tickets: Ticket[]
  userType: "loja" | "tecnico"
}

const statusColors = {
  aberto: "bg-red-100 text-red-800",
  em_andamento: "bg-yellow-100 text-yellow-800",
  aguardando: "bg-blue-100 text-blue-800",
  resolvido: "bg-green-100 text-green-800",
  fechado: "bg-gray-100 text-gray-800",
}

const priorityColors = {
  baixa: "bg-gray-100 text-gray-800",
  media: "bg-blue-100 text-blue-800",
  alta: "bg-orange-100 text-orange-800",
  urgente: "bg-red-100 text-red-800",
}

export default function TicketsList({ tickets, userType }: TicketsListProps) {
  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Nenhum chamado encontrado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">
                  #{ticket.ticket_number} - {ticket.title}
                </h3>
                <p className="text-gray-600 mt-1">{ticket.description}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                  {ticket.status.replace("_", " ")}
                </Badge>
                <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                  {ticket.priority}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <Wrench className="h-4 w-4" />
                <span>{ticket.service_type}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(ticket.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
              {ticket.assigned_technician && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{ticket.assigned_technician.name}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Link href={`/ticket/${ticket.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
