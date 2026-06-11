import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { query, queryOne } from "@/lib/db"
import { notFound } from "next/navigation"
import DashboardHeader from "@/components/dashboard-header"
import TicketDetails from "@/components/ticket-details"
import TicketHistory from "@/components/ticket-history"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function TicketPage({ params }: { params: { id: string } }) {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  // Buscar detalhes do chamado
  const ticket = await queryOne<any>(
    `SELECT t.*,
      s.name as store_name, s.store_number as store_number, s.email as store_email,
      tech.name as assigned_technician_name, tech.speciality as assigned_technician_speciality, tech.email as assigned_technician_email
    FROM tickets t
    LEFT JOIN users s ON t.store_id = s.id
    LEFT JOIN users tech ON t.assigned_technician_id = tech.id
    WHERE t.id = ?
    LIMIT 1`,
    [params.id]
  )

  if (!ticket) {
    notFound()
  }

  // Format ticket to match previous structure
  let imageUrlsParsed = null
  try {
    if (ticket.image_urls) {
      imageUrlsParsed = JSON.parse(ticket.image_urls)
    }
  } catch (e) {
    console.error("Erro ao fazer parse de image_urls:", e)
    imageUrlsParsed = null
  }

  const formattedTicket = {
    ...ticket,
    image_urls: imageUrlsParsed,
    store: {
      name: ticket.store_name,
      store_number: ticket.store_number,
      email: ticket.store_email
    },
    assigned_technician: ticket.assigned_technician_name ? {
      name: ticket.assigned_technician_name,
      speciality: ticket.assigned_technician_speciality,
      email: ticket.assigned_technician_email
    } : null
  }

  // Verificar permissões
  const canView =
    user.user_type === "admin" ||
    (user.user_type === "loja" && ticket.store_id === user.id) ||
    (user.user_type === "tecnico" &&
      (ticket.assigned_technician_id === user.id || ticket.service_type === user.speciality))

  if (!canView) {
    redirect(user.user_type === "loja" ? "/dashboard/loja" : "/dashboard/tecnico")
  }

  // Buscar histórico do chamado
  const history = await query<any>(
    `SELECT tu.*, u.name as user_name, u.user_type as user_user_type
    FROM ticket_updates tu
    LEFT JOIN users u ON tu.user_id = u.id
    WHERE tu.ticket_id = ?
    ORDER BY tu.created_at ASC`,
    [params.id]
  )

  // Format history to match previous structure
  const formattedHistory = history.map(h => ({
    ...h,
    user: {
      name: h.user_name,
      user_type: h.user_user_type
    }
  }))

  // O usuário é garantido após os redirecionamentos acima
  const userType = user!.user_type as "admin" | "loja" | "tecnico"
  const dashboardHref =
    userType === "admin" ? "/dashboard/admin" : userType === "loja" ? "/dashboard/loja" : "/dashboard/tecnico"

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Voltar ao dashboard */}
          <div>
            <Link href={dashboardHref}>
              <Button variant="outline">← Voltar ao Dashboard</Button>
            </Link>
          </div>
          <TicketDetails ticket={formattedTicket} user={user} />
          <TicketHistory history={formattedHistory} />
        </div>
      </main>
    </div>
  )
}
