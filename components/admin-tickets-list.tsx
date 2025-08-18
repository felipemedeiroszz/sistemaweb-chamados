"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Filter } from "lucide-react"
import Link from "next/link"

interface Ticket {
  id: string
  title: string
  description: string
  service_type: string
  priority: string
  status: string
  created_at: string
  store: { name: string; email: string }
  technician?: { name: string; email: string }
}

interface AdminTicketsListProps {
  tickets: Ticket[]
}

export function AdminTicketsList({ tickets }: AdminTicketsListProps) {
  const [filter, setFilter] = useState<string>("todos")
  const [serviceFilter, setServiceFilter] = useState<string>("todos")

  const filteredTickets = tickets.filter((ticket) => {
    const statusMatch = filter === "todos" || ticket.status === filter
    const serviceMatch = serviceFilter === "todos" || ticket.service_type === serviceFilter
    return statusMatch && serviceMatch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "bg-red-100 text-red-800"
      case "em_andamento":
        return "bg-yellow-100 text-yellow-800"
      case "fechado":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "bg-red-100 text-red-800"
      case "media":
        return "bg-yellow-100 text-yellow-800"
      case "baixa":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Todos os Chamados ({filteredTickets.length})
          </CardTitle>

          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="todos">Todos os Status</option>
              <option value="aberto">Abertos</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="fechado">Fechados</option>
            </select>

            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="todos">Todos os Serviços</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Eletricista">Eletricista</option>
              <option value="Manutenção de computadores">Computadores</option>
              <option value="Suporte ao usuario / Sistema">Suporte</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                    <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                    <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                  </div>

                  <p className="text-gray-600 text-sm mb-2">{ticket.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      <strong>Loja:</strong> {ticket.store.name}
                    </span>
                    <span>
                      <strong>Serviço:</strong> {ticket.service_type}
                    </span>
                    {ticket.technician && (
                      <span>
                        <strong>Técnico:</strong> {ticket.technician.name}
                      </span>
                    )}
                    <span>
                      <strong>Criado:</strong> {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                <Link href={`/ticket/${ticket.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalhes
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {filteredTickets.length === 0 && (
            <div className="text-center py-8 text-gray-500">Nenhum chamado encontrado com os filtros selecionados.</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
