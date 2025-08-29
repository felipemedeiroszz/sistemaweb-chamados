import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
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

  const supabase = createServerClient()

  // Buscar detalhes do chamado
  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(`
      *,
      store:users!store_id(name, store_number, email),
      assigned_technician:users!assigned_technician_id(name, speciality, email)
    `)
    .eq("id", params.id)
    .single()

  if (error || !ticket) {
    notFound()
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
  const { data: history } = await supabase
    .from("ticket_updates")
    .select(`
      *,
      user:user_id(name, user_type)
    `)
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true })

  // user is guaranteed after redirects above
  const userType = user!.user_type as "admin" | "loja" | "tecnico"
  const dashboardHref =
    userType === "admin" ? "/dashboard/admin" : userType === "loja" ? "/dashboard/loja" : "/dashboard/tecnico"

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Back to dashboard */}
          <div>
            <Link href={dashboardHref}>
              <Button variant="outline">← Voltar ao Dashboard</Button>
            </Link>
          </div>
          <TicketDetails ticket={ticket} user={user} />
          <TicketHistory history={history || []} />
        </div>
      </main>
    </div>
  )
}
