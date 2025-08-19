"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  Calendar, 
  User 
} from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"

interface Ticket {
  id: string
  title: string
  description: string
  status: "aberto" | "em_andamento" | "aguardando" | "resolvido"
  priority: "baixa" | "media" | "alta"
  created_at: string
  store_number: number
  store_name: string
  assigned_to?: string
  technician_name?: string
}

export default function AdminDashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("todos")

  const fetchTickets = useCallback(async () => {
    try {
      const response = await fetch("/api/tickets/all")
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets)
      } else {
        console.error("Erro ao buscar chamados")
      }
    } catch (error) {
      console.error("Erro na requisição:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Realtime: ouvir mudanças na tabela tickets e refazer o fetch
  useEffect(() => {
    if (!isSupabaseConfigured) return
    const channel = supabase
      .channel("tickets-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          // Refetch ao inserir/atualizar/excluir
          fetchTickets()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTickets])

  // Filtrar chamados conforme as abas solicitadas
  const filteredTickets = tickets.filter((ticket) => {
    if (activeTab === "todos") return true
    if (activeTab === "em_andamento") return ticket.status === "em_andamento"
    if (activeTab === "aguardando") return ticket.status === "aguardando"
    if (activeTab === "resolvido") return ticket.status === "resolvido"
    return true
  })

  // Status badge component
  const StatusBadge = ({ status }: { status: Ticket["status"] }) => {
    if (status === "aguardando") {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="mr-1 h-3 w-3" /> Aguardando
        </Badge>
      )
    }
    if (status === "em_andamento") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <AlertCircle className="mr-1 h-3 w-3" /> Em Andamento
        </Badge>
      )
    }
    if (status === "aberto") {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <Clock className="mr-1 h-3 w-3" /> Aberto
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Resolvido
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Chamados</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
              <TabsTrigger value="aguardando">Aguardando</TabsTrigger>
              <TabsTrigger value="resolvido">Resolvido</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="text-center py-8">Carregando chamados...</div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum chamado encontrado nesta categoria.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => (
                    <Card key={ticket.id} className="overflow-hidden">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{ticket.title}</h3>
                            <StatusBadge status={ticket.status} />
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/ticket/${ticket.id}`}>Ver Detalhes</a>
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center">
                            <Building2 className="mr-2 h-4 w-4 text-gray-500" />
                            <span>Loja: {ticket.store_name} (#{ticket.store_number})</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                            <span>
                              {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-gray-500" />
                            <span>
                              {ticket.technician_name || "Não atribuído"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
