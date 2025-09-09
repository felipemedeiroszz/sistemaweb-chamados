import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createServerClient } from "@/lib/supabase/server"
import { sendTicketAssignedSMS } from "@/lib/sms"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSession()

    if (!user || user.user_type !== "tecnico") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const supabase = createServerClient()

    // Verificar se o chamado existe e está disponível
    const { data: ticket, error: fetchError } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", params.id)
      .eq("service_type", user.speciality)
      .is("assigned_technician_id", null)
      .single()

    if (fetchError || !ticket) {
      return NextResponse.json({ error: "Chamado não encontrado ou não disponível" }, { status: 404 })
    }

    // Atribuir o chamado ao técnico
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        assigned_technician_id: user.id,
        status: "em_andamento",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (updateError) {
      console.error("Database error:", updateError)
      return NextResponse.json({ error: "Erro ao assumir chamado" }, { status: 500 })
    }

    // Registrar a atribuição no histórico
    await supabase.from("ticket_updates").insert({
      ticket_id: params.id,
      user_id: user.id,
      update_type: "assignment",
      new_value: user.id,
      comment: "Chamado assumido pelo técnico",
    })

    // Buscar dados da loja para envio de SMS
    const { data: storeData } = await supabase
      .from("users")
      .select("phone")
      .eq("id", ticket.store_id)
      .single()

    // Enviar SMS de notificação se a loja tiver telefone
    if (storeData?.phone) {
      try {
        await sendTicketAssignedSMS(
          storeData.phone,
          ticket.ticket_number?.toString() || params.id,
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
