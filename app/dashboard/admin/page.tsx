"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
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
  // Abas principais: dashboard | chamados
  const [activeMainTab, setActiveMainTab] = useState("dashboard")
  // Abas de status dos chamados
  const [statusTab, setStatusTab] = useState("todos")

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

  // Filtrar chamados conforme as abas de status
  const filteredTickets = tickets.filter((ticket: Ticket) => {
    if (statusTab === "todos") return true
    if (statusTab === "em_andamento") return ticket.status === "em_andamento"
    if (statusTab === "aguardando") return ticket.status === "aguardando"
    if (statusTab === "resolvido") return ticket.status === "resolvido"
    return true
  })

  // Métricas básicas do Dashboard
  const total = tickets.length
  const countByStatus = tickets.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1
      return acc
    },
    { aberto: 0, em_andamento: 0, aguardando: 0, resolvido: 0 } as Record<Ticket["status"], number>
  )
  const countByPriority = tickets.reduce(
    (acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1
      return acc
    },
    { baixa: 0, media: 0, alta: 0 } as Record<Ticket["priority"], number>
  )
  const topLojas = Object.values(
    tickets.reduce((acc, t) => {
      const key = `${t.store_number}-${t.store_name}`
      if (!acc[key]) acc[key] = { key, name: t.store_name, number: t.store_number, count: 0 }
      acc[key].count += 1
      return acc
    }, {} as Record<string, { key: string; name: string; number: number; count: number }>)
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const topTecnicos = Object.values(
    tickets.reduce((acc, t) => {
      const tech = t.technician_name || "Não atribuído"
      if (!acc[tech]) acc[tech] = { name: tech, count: 0 }
      acc[tech].count += 1
      return acc
    }, {} as Record<string, { name: string; count: number }>)
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const recentes = [...tickets]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

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
        <CheckCircle className="mr-1 h-3 w-3" /> Resolvido
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
      </div>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
        <TabsList className="mb-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="chamados">Chamados</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total de Chamados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{total}</div>
                <p className="text-sm text-gray-500">Geral</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Em Andamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{countByStatus.em_andamento}</div>
                <p className="text-sm text-gray-500">Acompanhando</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Aguardando</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{countByStatus.aguardando}</div>
                <p className="text-sm text-gray-500">Pendentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Resolvidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{countByStatus.resolvido}</div>
                <p className="text-sm text-gray-500">Concluídos</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between"><span>Alta</span><span className="font-medium">{countByPriority.alta}</span></li>
                  <li className="flex justify-between"><span>Média</span><span className="font-medium">{countByPriority.media}</span></li>
                  <li className="flex justify-between"><span>Baixa</span><span className="font-medium">{countByPriority.baixa}</span></li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Lojas com mais chamados</CardTitle>
              </CardHeader>
              <CardContent>
                {topLojas.length === 0 ? (
                  <p className="text-sm text-gray-500">Sem dados</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {topLojas.map((l) => (
                      <li key={l.key} className="flex justify-between">
                        <span>{l.name} (#{l.number})</span>
                        <span className="font-medium">{l.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Técnicos com mais chamados</CardTitle>
              </CardHeader>
              <CardContent>
                {topTecnicos.length === 0 ? (
                  <p className="text-sm text-gray-500">Sem dados</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {topTecnicos.map((t) => (
                      <li key={t.name} className="flex justify-between">
                        <span>{t.name}</span>
                        <span className="font-medium">{t.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Chamados Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : recentes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Sem chamados recentes</div>
              ) : (
                <div className="space-y-3">
                  {recentes.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between text-sm border-b last:border-b-0 py-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{ticket.title}</span>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <div className="flex items-center space-x-4 text-gray-600">
                        <span>{ticket.store_name} (#{ticket.store_number})</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString("pt-BR")}</span>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/ticket/${ticket.id}`}>Detalhes</a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chamados">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Chamados</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={statusTab} onValueChange={setStatusTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
                  <TabsTrigger value="aguardando">Aguardando</TabsTrigger>
                  <TabsTrigger value="resolvido">Resolvido</TabsTrigger>
                </TabsList>

                <TabsContent value={statusTab}>
                  {loading ? (
                    <div className="text-center py-8">Carregando chamados...</div>
                  ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum chamado encontrado nesta categoria.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTickets.map((ticket: Ticket) => (
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
                                <span className="mr-2 text-gray-500">Loja</span>
                                <span>: {ticket.store_name} (#{ticket.store_number})</span>
                              </div>
                              <div className="flex items-center">
                                <span className="mr-2 text-gray-500">Criado</span>
                                <span>{new Date(ticket.created_at).toLocaleDateString("pt-BR")}</span>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
