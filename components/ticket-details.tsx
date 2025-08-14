"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, User, Wrench, Building2, Mail, Clock } from "lucide-react"
import type { User as UserType } from "@/lib/auth"
import UpdateTicketModal from "./update-ticket-modal"
import { useRouter } from "next/navigation"

interface TicketDetailsProps {
  ticket: {
    id: string
    ticket_number: number
    title: string
    description: string
    service_type: string
    priority: string
    status: string
    created_at: string
    updated_at: string
    resolved_at?: string
    store: {
      name: string
      store_number: number
      email: string
    }
    assigned_technician?: {
      name: string
      speciality: string
      email: string
    }
  }
  user: UserType
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

export default function TicketDetails({ ticket, user }: TicketDetailsProps) {
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const canUpdate = user.user_type === "tecnico" && ticket.assigned_technician?.email === user.email
  const canAssign =
    user.user_type === "tecnico" && !ticket.assigned_technician && ticket.service_type === user.speciality

  const handleAssignTicket = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/assign`, {
        method: "POST",
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Erro ao assumir chamado:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                Chamado #{ticket.ticket_number} - {ticket.title}
              </CardTitle>
              <p className="text-gray-600 mt-2">{ticket.description}</p>
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
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informações do Chamado</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Tipo de Serviço: {ticket.service_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Criado em: {new Date(ticket.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Atualizado em: {new Date(ticket.updated_at).toLocaleString("pt-BR")}</span>
                </div>
                {ticket.resolved_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      Resolvido em: {new Date(ticket.resolved_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informações da Loja</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Loja {ticket.store.store_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{ticket.store.email}</span>
                </div>
              </div>

              {ticket.assigned_technician && (
                <>
                  <h3 className="font-semibold text-lg">Técnico Responsável</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{ticket.assigned_technician.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{ticket.assigned_technician.speciality}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{ticket.assigned_technician.email}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {(canUpdate || canAssign) && (
            <div className="flex gap-2 pt-4 border-t">
              {canAssign && (
                <Button onClick={handleAssignTicket} disabled={loading}>
                  {loading ? "Assumindo..." : "Assumir Chamado"}
                </Button>
              )}
              {canUpdate && (
                <Button variant="outline" onClick={() => setShowUpdateModal(true)}>
                  Atualizar Status
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showUpdateModal && (
        <UpdateTicketModal ticket={ticket} isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} />
      )}
    </>
  )
}
