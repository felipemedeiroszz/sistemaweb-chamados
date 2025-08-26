import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user || user.user_type !== "loja") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { title, description, service_type, priority, image_urls } = await request.json()

    if (!title || !description || !service_type) {
      return NextResponse.json({ error: "Título, descrição e tipo de serviço são obrigatórios" }, { status: 400 })
    }

    // Validar anexos (opcionais)
    let images: string[] | undefined = undefined
    if (image_urls !== undefined) {
      if (!Array.isArray(image_urls)) {
        return NextResponse.json({ error: "image_urls deve ser um array de URLs" }, { status: 400 })
      }
      if (image_urls.length > 5) {
        return NextResponse.json({ error: "Máximo de 5 imagens permitido" }, { status: 400 })
      }
      // Filtra valores inválidos e garante strings
      images = image_urls.filter((u: any) => typeof u === "string" && u.trim().length > 0).slice(0, 5)
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
        image_urls: images && images.length ? images : undefined,
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
