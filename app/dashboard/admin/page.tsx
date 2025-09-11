"use client"

import React from "react"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User 
} from "lucide-react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"

// Shim dos hooks do React para ambientes TS onde os tipos dos hooks não são exportados
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { useState, useEffect, useCallback } = React as any
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface Ticket {
  id: string
  ticket_number?: number
  title: string
  description: string
  status: "aberto" | "em_andamento" | "aguardando" | "resolvido"
  priority: "baixa" | "media" | "alta" | "urgente"
  created_at: string
  store_number: number
  store_name: string
  assigned_to?: string
  technician_name?: string
}

interface AdminUser {
  id: string
  email: string
  name: string
  user_type: "loja" | "tecnico" | "admin"
  store_number?: number | null
  speciality?: string | null
  phone?: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export default function AdminDashboardPage() {
  const [tickets, setTickets] = useState([] as Ticket[])
  const [loading, setLoading] = useState(true)
  // Abas principais: dashboard | chamados | usuarios
  const [activeMainTab, setActiveMainTab] = useState("dashboard")
  // Abas de status dos chamados
  const [statusTab, setStatusTab] = useState("todos")
  // Busca de chamados (por nº ou texto)
  const [ticketsSearch, setTicketsSearch] = useState("")
  // Usuários (admin)
  const [users, setUsers] = useState([] as AdminUser[])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null as AdminUser | null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState(null as AdminUser | null)
  const [form, setForm] = useState({
    email: "",
    name: "",
    user_type: "loja" as "loja" | "tecnico" | "admin",
    store_number: "" as string | number,
    speciality: "",
    phone: "",
    active: true,
    password: "",
  })
  // Filtros de usuários
  const [userFilterType, setUserFilterType] = useState("all" as "all" | "loja" | "tecnico" | "admin")
  const [userFilterActive, setUserFilterActive] = useState("all" as "all" | "active" | "inactive")
  const [userSearch, setUserSearch] = useState("")

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

  // Carregar usuários quando entrar na aba Usuarios
  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await fetch("/api/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (e) {
      console.error("Erro ao carregar usuários", e)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeMainTab === "usuarios") {
      loadUsers()
    }
  }, [activeMainTab, loadUsers])

  const resetForm = () => {
    setEditingUser(null)
    setForm({ email: "", name: "", user_type: "loja", store_number: "", speciality: "", phone: "", active: true, password: "" })
  }

  const openCreate = () => {
    resetForm()
    setUserModalOpen(true)
  }

  const openEdit = (u: AdminUser) => {
    setEditingUser(u)
    setForm({
      email: u.email,
      name: u.name,
      user_type: u.user_type,
      store_number: u.store_number ?? "",
      speciality: u.speciality ?? "",
      phone: u.phone ?? "",
      active: u.active,
      password: "",
    })
    setUserModalOpen(true)
  }

  const submitUser = async () => {
    try {
      const payload: any = {
        email: form.email,
        name: form.name,
        user_type: form.user_type,
        store_number: form.store_number === "" ? undefined : Number(form.store_number),
        speciality: form.speciality === "" ? undefined : form.speciality,
        phone: form.phone === "" ? undefined : form.phone,
        active: form.active,
      }
      // Envia a senha apenas se preenchida (tanto na criação quanto na edição)
      if (form.password) payload.password = form.password

      const res = await fetch(editingUser ? `/api/users/${editingUser.id}` : "/api/users", {
        method: editingUser ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Falha ao salvar usuário")
      setUserModalOpen(false)
      await loadUsers()
    } catch (e) {
      console.error(e)
    }
  }

  const toggleUserActive = async (u: AdminUser) => {
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !u.active }),
      })
      if (!res.ok) throw new Error("Falha ao alterar status do usuário")
      await loadUsers()
    } catch (e) {
      console.error(e)
    }
  }

  const openDelete = (u: AdminUser) => {
    setDeletingUser(u)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingUser) return
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) throw new Error("Falha ao excluir usuário")
      setDeleteDialogOpen(false)
      setDeletingUser(null)
      await loadUsers()
    } catch (e) {
      console.error(e)
    }
  }

  // Realtime: ouvir mudanças na tabela tickets e refazer o fetch
  useEffect(() => {
    if (!isSupabaseConfigured) return
    const channel = supabase
      .channel("tickets-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          // Recarregar ao inserir/atualizar/excluir
          fetchTickets()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTickets])

  // Filtrar chamados conforme as abas de status e busca
  const filteredTickets = tickets
    .filter((ticket: Ticket) => {
      if (statusTab === "todos") return true
      if (statusTab === "em_andamento") return ticket.status === "em_andamento"
      if (statusTab === "aguardando") return ticket.status === "aguardando"
      if (statusTab === "resolvido") return ticket.status === "resolvido"
      return true
    })
    .filter((ticket: Ticket) => {
      const term = ticketsSearch.trim().toLowerCase()
      if (!term) return true
      const numeric = term.startsWith("#") ? term.slice(1) : term
      if (/^\d+$/.test(numeric)) {
        return String(ticket.ticket_number ?? "") === numeric
      }
      const hay = `${ticket.title} ${ticket.description}`.toLowerCase()
      return hay.includes(term)
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
    { baixa: 0, media: 0, alta: 0, urgente: 0 } as Record<Ticket["priority"], number>
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

  // Dataset: últimos 14 dias (por dia)
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (13 - i))
    return d
  })
  const perDayMap = days.reduce((acc, d) => {
    acc[d.toISOString()] = 0
    return acc
  }, {} as Record<string, number>)
  tickets.forEach((t: Ticket) => {
    const d = new Date(t.created_at)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString()
    if (key in perDayMap) perDayMap[key] += 1
  })
  const perDayData = days.map((d) => ({
    day: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    total: perDayMap[d.toISOString()] || 0,
  }))

  // Dataset: por status e prioridade para gráficos
  const statusData = [
    { name: "Aberto", value: countByStatus.aberto },
    { name: "Em Andamento", value: countByStatus.em_andamento },
    { name: "Aguardando", value: countByStatus.aguardando },
    { name: "Resolvido", value: countByStatus.resolvido },
  ]
  const priorityData = [
    { name: "Urgente", value: countByPriority.urgente },
    { name: "Alta", value: countByPriority.alta },
    { name: "Média", value: countByPriority.media },
    { name: "Baixa", value: countByPriority.baixa },
  ]
  const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"]

  // Componente de badge de status
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
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
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
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie dataKey="value" data={priorityData} nameKey="name" outerRadius={80} label>
                        {priorityData.map((_, idx) => (
                          <Cell key={`cell-p-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Chamados por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData}>
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Qtd" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Chamados por Dia (14d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={perDayData}>
                      <XAxis dataKey="day" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" name="Chamados" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
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
                        <span className="font-medium">{ticket.ticket_number ? `#${ticket.ticket_number} - ` : ""}{ticket.title}</span>
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
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Todos os Chamados</CardTitle>
                <div className="relative w-full md:w-80">
                  <Input
                    placeholder="Buscar por nº do ticket (ex: #123) ou texto..."
                    value={ticketsSearch}
                    onChange={(e: any) => setTicketsSearch(e.target.value)}
                  />
                </div>
              </div>
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
                                <h3 className="font-medium">{ticket.ticket_number ? `#${ticket.ticket_number} - ` : ""}{ticket.title}</h3>
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

        <TabsContent value="usuarios">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <CardTitle>Usuários</CardTitle>
                <Button size="sm" onClick={openCreate}>Novo Usuário</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <label className="text-xs text-gray-600">Tipo</label>
                  <Select value={userFilterType} onValueChange={(v: any) => setUserFilterType(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="loja">Loja</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Status</label>
                  <Select value={userFilterActive} onValueChange={(v: any) => setUserFilterActive(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-600">Buscar (nome/email)</label>
                  <Input value={userSearch} onChange={(e: any) => setUserSearch(e.target.value)} placeholder="Buscar..." className="h-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : (() => {
                const term = userSearch.trim().toLowerCase()
                const filtered = users.filter((u: AdminUser) => {
                  if (userFilterType !== "all" && u.user_type !== userFilterType) return false
                  if (userFilterActive !== "all") {
                    if (userFilterActive === "active" && !u.active) return false
                    if (userFilterActive === "inactive" && u.active) return false
                  }

                  if (term) {
                    const hay = `${u.name} ${u.email}`.toLowerCase()
                    if (!hay.includes(term)) return false
                  }
                  return true
                })
                return filtered.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Nenhum usuário encontrado.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[1200px]">
                      <div className="grid grid-cols-10 gap-2 text-xs font-medium text-gray-500 mb-2">
                        <div>Email</div>
                        <div>Nome</div>
                        <div>Tipo</div>
                        <div>Loja</div>
                        <div>Especialidade</div>
                        <div>Ativo</div>
                        <div>Criado</div>
                        <div>Atualizado</div>
                        <div>Telefone</div>
                        <div>Ações</div>
                      </div>
                    <div className="space-y-2">
                      {filtered.map((u: AdminUser) => (
                        <div key={u.id} className="grid grid-cols-10 gap-2 items-center bg-white border rounded p-2">
                          <div className="truncate">{u.email}</div>
                          <div className="truncate">{u.name}</div>
                          <div>{u.user_type}</div>
                          <div>{u.store_number ?? "-"}</div>
                          <div className="truncate">{u.speciality ?? "-"}</div>
                          <div>
                            <Badge variant="outline" className={u.active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}>
                              {u.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <div>{new Date(u.created_at).toLocaleDateString("pt-BR")}</div>
                          <div>{new Date(u.updated_at).toLocaleDateString("pt-BR")}</div>
                          <div className="truncate">{u.phone ?? "-"}</div>
                          <div className="flex items-center justify-start md:justify-end">
                            {/* Mobile: menu compacto */}
                            <div className="flex w-full md:hidden">
                              <Select onValueChange={(v) => {
                                if (v === "edit") return openEdit(u)
                                if (v === "toggle") return toggleUserActive(u)
                                if (v === "delete") return openDelete(u)
                              }}>
                                <SelectTrigger className="h-8 w-full">
                                  <SelectValue placeholder="Ações" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="edit">Editar</SelectItem>
                                  <SelectItem value="toggle">{u.active ? "Desativar" : "Ativar"}</SelectItem>
                                  <SelectItem value="delete">Excluir</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {/* Desktop: botões alinhados */}
                            <div className="hidden md:flex items-center gap-2 justify-end w-full">
                              <Button size="sm" variant="outline" onClick={() => openEdit(u)}>Editar</Button>
                              <Button size="sm" variant={u.active ? "destructive" as any : "default"} onClick={() => toggleUserActive(u)}>
                                {u.active ? "Desativar" : "Ativar"}
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" title="Excluir" onClick={() => openDelete(u)}>
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar exclusão</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <p>Tem certeza que deseja excluir o usuário{deletingUser ? ` ${deletingUser.name}` : ""}? Esta ação não pode ser desfeita.</p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button variant="destructive" onClick={confirmDelete}>Sim, excluir</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <Input value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} placeholder="email@dominio.com" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Nome</label>
                    <Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="Nome" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Tipo</label>
                    <Select
                      value={form.user_type}
                      onValueChange={(v: "loja" | "tecnico" | "admin") =>
                        setForm({
                          ...form,
                          user_type: v,
                          // Limpa especialidade quando não for técnico
                          speciality: v === "tecnico" ? form.speciality : "",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loja">Loja</SelectItem>
                        <SelectItem value="tecnico">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Loja (opcional)</label>
                    <Input type="number" value={String(form.store_number)} onChange={(e: any) => setForm({ ...form, store_number: e.target.value })} placeholder="Número da loja" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Telefone</label>
                    <Input value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} placeholder="+5511987654321" />
                  </div>
                  {form.user_type === "tecnico" && (
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-600">Especialidade</label>
                      <Select value={form.speciality || undefined} onValueChange={(v: any) => setForm({ ...form, speciality: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a especialidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Departamento Pessoal">Departamento Pessoal</SelectItem>
                          <SelectItem value="RH">RH</SelectItem>
                          <SelectItem value="Comercial">Comercial</SelectItem>
                          <SelectItem value="Manutenção infraestrutura">Manutenção infraestrutura</SelectItem>
                          <SelectItem value="Manutenção de computadores">Manutenção de computadores</SelectItem>
                          <SelectItem value="Suporte TI">Suporte TI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-600">{editingUser ? "Nova senha (opcional)" : "Senha"}</label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e: any) => setForm({ ...form, password: e.target.value })}
                      placeholder={editingUser ? "Deixe em branco para manter a atual" : "Senha inicial"}
                    />
                    {editingUser && (
                      <p className="mt-1 text-xs text-gray-500">Se deixar em branco, a senha não será alterada.</p>
                    )}
                  </div>
                  <div className="md:col-span-2 flex items-center space-x-2">
                    <input id="active" type="checkbox" checked={form.active} onChange={(e: any) => setForm({ ...form, active: e.target.checked })} />
                    <label htmlFor="active" className="text-sm text-gray-700">Ativo</label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={submitUser}>{editingUser ? "Salvar" : "Criar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
