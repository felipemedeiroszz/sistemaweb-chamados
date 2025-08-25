import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSession()

    if (!user || user.user_type !== "tecnico") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { status, comment, expected_resolution_at } = await request.json()

    if (!status) {
      return NextResponse.json({ error: "Status é obrigatório" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Verificar se o chamado pertence ao técnico
    const { data: ticket, error: fetchError } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", params.id)
      .eq("assigned_technician_id", user.id)
      .single()

    if (fetchError || !ticket) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 })
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === "resolvido") {
      updateData.resolved_at = new Date().toISOString()
    }

    // Se status for "aguardando", exigir e salvar o prazo estimado
    if (status === "aguardando") {
      if (!expected_resolution_at) {
        return NextResponse.json(
          { error: "Prazo de resolução é obrigatório quando o status é 'aguardando'" },
          { status: 400 }
        )
      }
      updateData.expected_resolution_at = expected_resolution_at
    }

    // Atualizar o status do chamado
    const { error: updateError } = await supabase.from("tickets").update(updateData).eq("id", params.id)

    if (updateError) {
      console.error("Database error:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar chamado" }, { status: 500 })
    }

    // Preparar comentário amigável com data/hora BR quando aplicável
    let historyComment = comment || `Status alterado para ${status}`
    if (status === "aguardando" && expected_resolution_at) {
      const date = new Date(expected_resolution_at)
      const formattedBR = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date)
      historyComment = comment || `Status alterado para aguardando (prazo: ${formattedBR})`
    }

    // Registrar a atualização no histórico
    await supabase.from("ticket_updates").insert({
      ticket_id: params.id,
      user_id: user.id,
      update_type: "status_change",
      old_value: ticket.status,
      new_value: status,
      comment: historyComment,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update ticket error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
