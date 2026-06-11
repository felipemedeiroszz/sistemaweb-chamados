import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Verificar se o usuário está autenticado e é admin
    const user = await getSession()
    
    if (!user || user.user_type !== "admin") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Obter todos os chamados com informações da loja e do técnico
    const tickets = await query<any>(
      `SELECT t.*,
         s.name as store_name, s.store_number,
         tech.name as technician_name
       FROM tickets t
       LEFT JOIN users s ON t.store_id = s.id
       LEFT JOIN users tech ON t.assigned_technician_id = tech.id
       ORDER BY t.created_at DESC`
    )

    // Formatar chamados para o frontend (inclui ticket_number)
    const formattedTickets = tickets.map((ticket: any) => ({
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      created_at: ticket.created_at,
      store_number: ticket.store_number || 0,
      store_name: ticket.store_name || "Desconhecida",
      assigned_to: ticket.assigned_technician_id || null,
      technician_name: ticket.technician_name || null,
    }))

    return NextResponse.json({ tickets: formattedTickets })
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
