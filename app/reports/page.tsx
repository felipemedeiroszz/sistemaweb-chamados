import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import DashboardHeader from "@/components/dashboard-header"
import ReportsDashboard from "@/components/reports-dashboard"

export default async function ReportsPage() {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  const supabase = createServerClient()

  // Buscar dados para relatórios
  const { data: allTickets } = await supabase.from("tickets").select("*").order("created_at", { ascending: false })

  if (!allTickets) {
    return <div>Erro ao carregar dados</div>
  }

  // Processar dados para relatórios
  const ticketsByStatus = [
    { name: "Aberto", value: allTickets.filter((t) => t.status === "aberto").length },
    { name: "Em Andamento", value: allTickets.filter((t) => t.status === "em_andamento").length },
    { name: "Aguardando", value: allTickets.filter((t) => t.status === "aguardando").length },
    { name: "Resolvido", value: allTickets.filter((t) => t.status === "resolvido").length },
    { name: "Fechado", value: allTickets.filter((t) => t.status === "fechado").length },
  ].filter((item) => item.value > 0)

  const ticketsByPriority = [
    { name: "Baixa", value: allTickets.filter((t) => t.priority === "baixa").length },
    { name: "Média", value: allTickets.filter((t) => t.priority === "media").length },
    { name: "Alta", value: allTickets.filter((t) => t.priority === "alta").length },
    { name: "Urgente", value: allTickets.filter((t) => t.priority === "urgente").length },
  ].filter((item) => item.value > 0)

  const serviceTypes = ["Manutenção", "Eletricista", "Manutenção de computadores", "Suporte ao usuario / Sistema"]
  const ticketsByService = serviceTypes
    .map((service) => ({
      name: service.replace("Suporte ao usuario / Sistema", "Suporte"),
      value: allTickets.filter((t) => t.service_type === service).length,
    }))
    .filter((item) => item.value > 0)

  // Dados mensais (últimos 6 meses)
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const ticketsByMonth = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const monthTickets = allTickets.filter((t) => t.created_at.startsWith(monthKey))
    return {
      month: monthNames[date.getMonth()],
      tickets: monthTickets.length,
    }
  })

  // Calcular tempo médio de resolução
  const resolvedTickets = allTickets.filter((t) => t.resolved_at)
  const averageResolutionTime = resolvedTickets.length
    ? Math.round(
        resolvedTickets.reduce((acc, ticket) => {
          const created = new Date(ticket.created_at)
          const resolved = new Date(ticket.resolved_at!)
          const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
          return acc + hours
        }, 0) / resolvedTickets.length,
      )
    : 0

  const reportData = {
    ticketsByStatus,
    ticketsByPriority,
    ticketsByService,
    ticketsByMonth,
    averageResolutionTime,
    totalTickets: allTickets.length,
    resolvedTickets: allTickets.filter((t) => t.status === "resolvido" || t.status === "fechado").length,
    pendingTickets: allTickets.filter((t) => !["resolvido", "fechado"].includes(t.status)).length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Relatórios e Métricas</h1>
          <p className="text-gray-600">Acompanhe o desempenho do sistema de chamados</p>
        </div>

        <ReportsDashboard data={reportData} />
      </main>
    </div>
  )
}
