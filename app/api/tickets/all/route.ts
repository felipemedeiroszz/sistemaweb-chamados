import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    // Check if user is authenticated and is admin
    const user = await getSession()
    
    if (!user || user.user_type !== "admin") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const supabase = createServerClient()
    
    // Get all tickets with store and technician information
    // Use explicit column-based relationship syntax to avoid relying on constraint names
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select(`
        *,
        store:users!store_id(name, store_number),
        technician:users!assigned_technician_id(name)
      `)
      .order("created_at", { ascending: false })
    
    if (error) {
      console.error("Erro ao buscar chamados:", error)
      return NextResponse.json(
        { error: "Erro ao buscar chamados" },
        { status: 500 }
      )
    }

    // Format tickets for frontend (include ticket_number)
    const formattedTickets = tickets.map((ticket: any) => ({
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      created_at: ticket.created_at,
      store_number: ticket.store?.store_number || 0,
      store_name: ticket.store?.name || "Desconhecida",
      assigned_to: ticket.assigned_technician_id || null,
      technician_name: ticket.technician?.name || null,
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
