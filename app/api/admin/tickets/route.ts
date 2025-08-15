import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const supabase = createClient()

    const { data: tickets, error } = await supabase
      .from("tickets")
      .select(`
        *,
        store:store_id (name),
        assigned_to:assigned_to (name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Erro ao buscar chamados" }, { status: 500 })
    }

    // Formatar dados para o frontend
    const formattedTickets = tickets.map((ticket) => ({
      ...ticket,
      store_name: ticket.store?.name || "Loja não encontrada",
      assigned_to_name: ticket.assigned_to?.name || null,
    }))

    return NextResponse.json(formattedTickets)
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
