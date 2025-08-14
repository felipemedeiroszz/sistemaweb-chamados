import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import DashboardHeader from "@/components/dashboard-header"
import TechnicianTicketsList from "@/components/technician-tickets-list"
import StatsCards from "@/components/stats-cards"

export default async function TecnicoDashboard() {
  const user = await getSession()

  if (!user || user.user_type !== "tecnico") {
    redirect("/login")
  }

  const supabase = createServerClient()

  // Buscar chamados da especialidade do técnico
  const { data: availableTickets } = await supabase
    .from("tickets")
    .select(`
      *,
      store:store_id(name, store_number),
      assigned_technician:assigned_technician_id(name, speciality)
    `)
    .eq("service_type", user.speciality)
    .in("status", ["aberto", "em_andamento", "aguardando"])
    .order("created_at", { ascending: false })

  // Buscar chamados atribuídos ao técnico
  const { data: myTickets } = await supabase
    .from("tickets")
    .select(`
      *,
      store:store_id(name, store_number)
    `)
    .eq("assigned_technician_id", user.id)
    .order("created_at", { ascending: false })

  // Calcular estatísticas
  const stats = {
    total: myTickets?.length || 0,
    abertos: availableTickets?.filter((t) => t.status === "aberto" && !t.assigned_technician_id).length || 0,
    meus_em_andamento: myTickets?.filter((t) => t.status === "em_andamento").length || 0,
    resolvidos: myTickets?.filter((t) => t.status === "resolvido").length || 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard - {user.name}</h1>
          <p className="text-gray-600">Especialidade: {user.speciality}</p>
        </div>

        <StatsCards
          stats={{
            total: stats.total,
            abertos: stats.abertos,
            em_andamento: stats.meus_em_andamento,
            resolvidos: stats.resolvidos,
          }}
          labels={{
            total: "Meus Chamados",
            abertos: "Disponíveis",
            em_andamento: "Em Andamento",
            resolvidos: "Resolvidos",
          }}
        />

        <div className="mt-8 space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Chamados Disponíveis</h2>
            <TechnicianTicketsList
              tickets={availableTickets?.filter((t) => !t.assigned_technician_id) || []}
              type="available"
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Meus Chamados</h2>
            <TechnicianTicketsList tickets={myTickets || []} type="assigned" />
          </div>
        </div>
      </main>
    </div>
  )
}
