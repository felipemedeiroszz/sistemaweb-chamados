import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { queryOne, update, insert, generateUUID } from "@/lib/db"
import { sendTicketAssignedSMS } from "@/lib/sms"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getSession()

    if (!user || user.user_type !== "tecnico") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se o chamado existe e está disponível
    const ticket = await queryOne<any>(
      "SELECT * FROM tickets WHERE id = ? AND service_type = ? AND assigned_technician_id IS NULL LIMIT 1",
      [id, user.speciality]
    )

    if (!ticket) {
      return NextResponse.json({ error: "Chamado não encontrado ou não disponível" }, { status: 404 })
    }

    // Atribuir o chamado ao técnico
    await update("tickets", {
      assigned_technician_id: user.id,
      status: "em_andamento",
    }, { id })

    // Registrar a atribuição no histórico
    await insert("ticket_updates", {
      id: generateUUID(),
      ticket_id: id,
      user_id: user.id,
      update_type: "assignment",
      new_value: user.id,
      comment: "Chamado assumido pelo técnico",
    })

    // Buscar dados da loja para envio de SMS
    const storeData = await queryOne<any>(
      "SELECT phone FROM users WHERE id = ? LIMIT 1",
      [ticket.store_id]
    )

    // Enviar SMS de notificação se a loja tiver telefone
    if (storeData?.phone) {
      try {
        await sendTicketAssignedSMS(
          storeData.phone,
          ticket.ticket_number?.toString() || id,
          user.name
        )
      } catch (smsError) {
        console.error("Erro ao enviar SMS:", smsError)
        // Não falha a operação se o SMS falhar
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Assign ticket error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
