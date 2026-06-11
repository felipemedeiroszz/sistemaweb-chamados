import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { queryOne, update, insert, generateUUID } from "@/lib/db"
import { sendTicketStatusChangeSMS } from "@/lib/sms"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getSession()

    if (!user || user.user_type !== "tecnico") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { status, comment, expected_resolution_at } = await request.json()

    if (!status) {
      return NextResponse.json({ error: "Status é obrigatório" }, { status: 400 })
    }

    // Verificar se o chamado pertence ao técnico
    const ticket = await queryOne<any>(
      "SELECT * FROM tickets WHERE id = ? AND assigned_technician_id = ? LIMIT 1",
      [id, user.id]
    )

    if (!ticket) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 })
    }

    const updateData: any = {
      status,
    }

    if (status === "resolvido") {
      updateData.resolved_at = new Date()
    }

    // Se status for "aguardando", exigir e salvar o prazo estimado
    if (status === "aguardando") {
      if (!expected_resolution_at) {
        return NextResponse.json(
          { error: "Prazo de resolução é obrigatório quando o status é 'aguardando'" },
          { status: 400 }
        )
      }
      updateData.expected_resolution_at = new Date(expected_resolution_at)
    }

    // Atualizar o status do chamado
    await update("tickets", updateData, { id })

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
    await insert("ticket_updates", {
      id: generateUUID(),
      ticket_id: id,
      user_id: user.id,
      update_type: "status_change",
      old_value: ticket.status,
      new_value: status,
      comment: historyComment,
    })

    // Buscar dados da loja para envio de SMS
    const storeData = await queryOne<any>(
      "SELECT phone FROM users WHERE id = ? LIMIT 1",
      [ticket.store_id]
    )

    // Enviar SMS de notificação se a loja tiver telefone
    if (storeData?.phone) {
      try {
        await sendTicketStatusChangeSMS(
          storeData.phone,
          ticket.ticket_number?.toString() || id,
          status
        )
      } catch (smsError) {
        console.error("Erro ao enviar SMS:", smsError)
        // Não falha a operação se o SMS falhar
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update ticket error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
