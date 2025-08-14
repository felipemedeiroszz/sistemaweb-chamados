import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSession()

    if (!user || user.user_type !== "loja") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const supabase = createServerClient()

    // Verificar se o chamado pertence à loja e está resolvido
    const { data: ticket, error: fetchError } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", params.id)
      .eq("store_id", user.id)
      .eq("status", "resolvido")
      .single()

    if (fetchError || !ticket) {
      return NextResponse.json({ error: "Chamado não encontrado ou não pode ser fechado" }, { status: 404 })
    }

    // Fechar o chamado
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        status: "fechado",
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (updateError) {
      console.error("Database error:", updateError)
      return NextResponse.json({ error: "Erro ao fechar chamado" }, { status: 500 })
    }

    // Registrar o fechamento no histórico
    await supabase.from("ticket_updates").insert({
      ticket_id: params.id,
      user_id: user.id,
      update_type: "status_change",
      old_value: "resolvido",
      new_value: "fechado",
      comment: "Chamado fechado pela loja",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Close ticket error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
