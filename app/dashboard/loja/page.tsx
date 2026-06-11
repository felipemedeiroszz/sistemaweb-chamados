import { getSession } from "@/lib/auth"
import  { redirect }  from "next/navigation"
import { query } from "@/lib/db"
import DashboardHeader from "@/components/dashboard-header"
import TicketsBrowser from "@/components/tickets-browser"
import NewTicketButton from "@/components/new-ticket-button"
import StatsCards from "@/components/stats-cards"

export default async function LojaDashboard() {
  const user = await getSession()

  if (!user || user.user_type !== "loja") {
    redirect("/login")
  }

  // Buscar chamados da loja
  const tickets = await query<any>(
    `SELECT t.*,
      tech.name as assigned_technician_name, tech.speciality as assigned_technician_speciality
    FROM tickets t
    LEFT JOIN users tech ON t.assigned_technician_id = tech.id
    WHERE t.store_id = ?
    ORDER BY t.created_at DESC`,
    [user.id]
  )

  // Format tickets to match previous structure
  const formattedTickets = tickets.map(ticket => ({
    ...ticket,
    image_urls: ticket.image_urls ? JSON.parse(ticket.image_urls) : null,
    assigned_technician: ticket.assigned_technician_name ? {
      name: ticket.assigned_technician_name,
      speciality: ticket.assigned_technician_speciality
    } : null
  }))

  // Calcular estatísticas
  const stats = {
    total: formattedTickets.length,
    abertos: formattedTickets.filter((t) => t.status === "aberto").length,
    em_andamento: formattedTickets.filter((t) => t.status === "em_andamento").length,
    resolvidos: formattedTickets.filter((t) => t.status === "resolvido").length,
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
          <TicketsBrowser tickets={formattedTickets} userType="loja" />
        </div>
      </main>
    </div>
  )
}
