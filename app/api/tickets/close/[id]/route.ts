import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { queryOne, update, insert, generateUUID } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSession()

    if (!user || user.user_type !== "loja") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se o chamado pertence à loja e está resolvido
    const ticket = await queryOne<any>(
      "SELECT * FROM tickets WHERE id = ? AND store_id = ? AND status = 'resolvido' LIMIT 1",
      [params.id, user.id]
    )

    if (!ticket) {
      return NextResponse.json({ error: "Chamado não encontrado ou não pode ser fechado" }, { status: 404 })
    }

    // Fechar o chamado
    await update("tickets", {
      status: "fechado",
      closed_at: new Date(),
    }, { id: params.id })

    // Registrar o fechamento no histórico
    await insert("ticket_updates", {
      id: generateUUID(),
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
