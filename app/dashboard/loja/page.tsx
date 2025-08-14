import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import DashboardHeader from "@/components/dashboard-header"
import TicketsList from "@/components/tickets-list"
import NewTicketButton from "@/components/new-ticket-button"
import StatsCards from "@/components/stats-cards"

export default async function LojaDashboard() {
  const user = await getSession()

  if (!user || user.user_type !== "loja") {
    redirect("/login")
  }

  const supabase = createServerClient()

  // Buscar chamados da loja
  const { data: tickets } = await supabase
    .from("tickets")
    .select(`
      *,
      assigned_technician:assigned_technician_id(name, speciality)
    `)
    .eq("store_id", user.id)
    .order("created_at", { ascending: false })

  // Calcular estatísticas
  const stats = {
    total: tickets?.length || 0,
    abertos: tickets?.filter((t) => t.status === "aberto").length || 0,
    em_andamento: tickets?.filter((t) => t.status === "em_andamento").length || 0,
    resolvidos: tickets?.filter((t) => t.status === "resolvido").length || 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard - {user.name}</h1>
          <p className="text-gray-600">Gerencie seus chamados de suporte técnico</p>
        </div>

        <StatsCards stats={stats} />

        <div className="mt-8 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Meus Chamados</h2>
          <NewTicketButton />
        </div>

        <div className="mt-6">
          <TicketsList tickets={tickets || []} userType="loja" />
        </div>
      </main>
    </div>
  )
}
