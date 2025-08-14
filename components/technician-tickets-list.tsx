"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, User, Wrench, Building2, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import UpdateTicketModal from "./update-ticket-modal"
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
  store?: {
    name: string
    store_number: number
  }
  assigned_technician?: {
    name: string
    speciality: string
  }
}

interface TechnicianTicketsListProps {
  tickets: Ticket[]
  type: "available" | "assigned"
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

export default function TechnicianTicketsList({ tickets, type }: TechnicianTicketsListProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleAssignTicket = async (ticketId: string) => {
    setLoading(ticketId)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: "POST",
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Erro ao assumir chamado:", error)
    } finally {
      setLoading(null)
    }
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">
            {type === "available" ? "Nenhum chamado disponível" : "Nenhum chamado atribuído"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
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
                {ticket.store && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>Loja {ticket.store.store_number}</span>
                  </div>
                )}
                {ticket.assigned_technician && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{ticket.assigned_technician.name}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {type === "available" && (
                  <Button size="sm" onClick={() => handleAssignTicket(ticket.id)} disabled={loading === ticket.id}>
                    {loading === ticket.id ? "Assumindo..." : "Assumir Chamado"}
                  </Button>
                )}
                {type === "assigned" && (
                  <Button size="sm" variant="outline" onClick={() => setSelectedTicket(ticket)}>
                    Atualizar Status
                  </Button>
                )}
                <Link href={`/ticket/${ticket.id}`}>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTicket && (
        <UpdateTicketModal ticket={selectedTicket} isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </>
  )
}
