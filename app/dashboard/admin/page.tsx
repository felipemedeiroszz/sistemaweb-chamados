"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, TicketIcon, Eye } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import NewUserModal from "@/components/new-user-modal"

interface User {
  id: string
  email: string
  name: string
  user_type: string
  store_number?: number
  speciality?: string
  active: boolean
  created_at: string
}

interface Ticket {
  id: string
  title: string
  description: string
  service_type: string
  priority: string
  status: string
  store_name: string
  assigned_to_name?: string
  created_at: string
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [showNewUserModal, setShowNewUserModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
    fetchTickets()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    }
  }

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/admin/tickets")
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      }
    } catch (error) {
      console.error("Erro ao buscar chamados:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto":
        return "bg-red-100 text-red-800"
      case "em_andamento":
        return "bg-yellow-100 text-yellow-800"
      case "resolvido":
        return "bg-green-100 text-green-800"
      case "fechado":
        return "bg-gray-100 text-gray-800"
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie usuários e visualize todos os chamados do sistema</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Chamados</CardTitle>
              <TicketIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chamados Abertos</CardTitle>
              <TicketIcon className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.filter((t) => t.status === "aberto").length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <TicketIcon className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.filter((t) => t.status === "em_andamento").length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gerenciamento de Usuários */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usuários do Sistema</CardTitle>
                  <CardDescription>Gerencie lojas e técnicos</CardDescription>
                </div>
                <Button onClick={() => setShowNewUserModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.user_type === "loja" && user.store_number && (
                        <div className="text-xs text-blue-600">Loja {user.store_number}</div>
                      )}
                      {user.user_type === "tecnico" && user.speciality && (
                        <div className="text-xs text-green-600">{user.speciality}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.user_type === "admin" ? "destructive" : "secondary"}>{user.user_type}</Badge>
                      <Badge variant={user.active ? "default" : "secondary"}>{user.active ? "Ativo" : "Inativo"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Todos os Chamados */}
          <Card>
            <CardHeader>
              <CardTitle>Todos os Chamados</CardTitle>
              <CardDescription>Visualize todos os chamados do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium">{ticket.title}</div>
                        <div className="text-sm text-gray-600 mb-2">{ticket.store_name}</div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                          <Badge variant="outline">{ticket.service_type}</Badge>
                        </div>
                        {ticket.assigned_to_name && (
                          <div className="text-xs text-gray-500">Técnico: {ticket.assigned_to_name}</div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/ticket/${ticket.id}`}>
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleString("pt-BR")}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showNewUserModal && (
        <NewUserModal
          onClose={() => setShowNewUserModal(false)}
          onUserCreated={() => {
            fetchUsers()
            setShowNewUserModal(false)
          }}
        />
      )}
    </div>
  )
}
