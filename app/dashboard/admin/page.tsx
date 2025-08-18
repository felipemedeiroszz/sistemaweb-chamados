import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { AdminTicketsList } from "@/components/admin-tickets-list"

export default async function AdminDashboard() {
  const user = await getUser()

  if (!user || user.user_type !== "administrador") {
    redirect("/login")
  }

  const supabase = createClient()

  // Buscar todos os chamados para o admin
  const { data: tickets } = await supabase
    .from("tickets")
    .select(`
      *,
      store:users!tickets_store_id_fkey(name, email),
      technician:users!tickets_technician_id_fkey(name, email)
    `)
    .order("created_at", { ascending: false })

  // Calcular estatísticas gerais
  const totalTickets = tickets?.length || 0
  const openTickets = tickets?.filter((t) => t.status === "aberto").length || 0
  const inProgressTickets = tickets?.filter((t) => t.status === "em_andamento").length || 0
  const closedTickets = tickets?.filter((t) => t.status === "fechado").length || 0

  const stats = [
    { title: "Total de Chamados", value: totalTickets, color: "blue" },
    { title: "Abertos", value: openTickets, color: "red" },
    { title: "Em Andamento", value: inProgressTickets, color: "yellow" },
    { title: "Fechados", value: closedTickets, color: "green" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600">Visão geral de todos os chamados do sistema</p>
        </div>

        <StatsCards stats={stats} />

        <div className="mt-8">
          <AdminTicketsList tickets={tickets || []} />
        </div>
      </main>
    </div>
  )
}
