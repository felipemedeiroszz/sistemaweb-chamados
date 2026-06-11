import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { query } from "@/lib/db"
import DashboardHeader from "@/components/dashboard-header"
import TechnicianTicketsBrowser from "@/components/technician-tickets-browser"
import StatsCards from "@/components/stats-cards"

export default async function TecnicoDashboard() {
  const user = await getSession()

  if (!user || user.user_type !== "tecnico") {
    redirect("/login")
  }

  // Buscar chamados da especialidade do técnico
  const availableTickets = await query<any>(
    `SELECT t.*,
      s.name as store_name, s.store_number as store_number,
      tech.name as assigned_technician_name, tech.speciality as assigned_technician_speciality
    FROM tickets t
    LEFT JOIN users s ON t.store_id = s.id
    LEFT JOIN users tech ON t.assigned_technician_id = tech.id
    WHERE t.service_type = ?
    AND t.status IN ('aberto', 'em_andamento', 'aguardando')
    ORDER BY t.created_at DESC`,
    [user.speciality]
  )

  // Buscar chamados atribuídos ao técnico
  const myTickets = await query<any>(
    `SELECT t.*,
      s.name as store_name, s.store_number as store_number
    FROM tickets t
    LEFT JOIN users s ON t.store_id = s.id
    WHERE t.assigned_technician_id = ?
    ORDER BY t.created_at DESC`,
    [user.id]
  )

  // Format tickets to match previous structure
  const formatTicket = (ticket: any) => {
    let imageUrlsParsed = null
    try {
      if (ticket.image_urls) {
        imageUrlsParsed = JSON.parse(ticket.image_urls)
      }
    } catch (e) {
      console.error("Erro ao fazer parse de image_urls:", e)
      imageUrlsParsed = null
    }

    return {
      ...ticket,
      image_urls: imageUrlsParsed,
      store: {
        name: ticket.store_name,
        store_number: ticket.store_number
      },
      assigned_technician: ticket.assigned_technician_name ? {
        name: ticket.assigned_technician_name,
        speciality: ticket.assigned_technician_speciality
      } : null
    }
  }

  const formattedAvailableTickets = availableTickets.map(formatTicket)
  const formattedMyTickets = myTickets.map(formatTicket)

  // Calcular estatísticas
  const stats = {
    total: formattedMyTickets.length,
    abertos: formattedAvailableTickets.filter((t) => t.status === "aberto" && !t.assigned_technician_id).length,
    meus_em_andamento: formattedMyTickets.filter((t) => t.status === "em_andamento").length,
    resolvidos: formattedMyTickets.filter((t) => t.status === "resolvido").length,
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

        <div className="mt-8">
          <TechnicianTicketsBrowser
            available={formattedAvailableTickets.filter((t: any) => !t.assigned_technician_id)}
            assigned={formattedMyTickets}
          />
        </div>
      </main>
    </div>
  )
}
