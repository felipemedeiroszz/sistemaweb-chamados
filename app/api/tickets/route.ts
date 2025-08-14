import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user || user.user_type !== "loja") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { title, description, service_type, priority } = await request.json()

    if (!title || !description || !service_type) {
      return NextResponse.json({ error: "Título, descrição e tipo de serviço são obrigatórios" }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        title,
        description,
        service_type,
        priority: priority || "media",
        store_id: user.id,
        status: "aberto",
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Erro ao criar chamado" }, { status: 500 })
    }

    // Registrar a criação do chamado no histórico
    await supabase.from("ticket_updates").insert({
      ticket_id: ticket.id,
      user_id: user.id,
      update_type: "status_change",
      new_value: "aberto",
      comment: "Chamado criado",
    })

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("Create ticket error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
