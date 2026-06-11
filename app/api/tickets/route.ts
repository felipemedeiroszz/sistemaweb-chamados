import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { queryOne, query, insert, generateUUID } from "@/lib/db"

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
    let imagesJson = null
    if (image_urls !== undefined) {
      if (!Array.isArray(image_urls)) {
        return NextResponse.json({ error: "image_urls deve ser um array de URLs" }, { status: 400 })
      }
      if (image_urls.length > 5) {
        return NextResponse.json({ error: "Máximo de 5 imagens permitido" }, { status: 400 })
      }
      // Filtra valores inválidos e garante strings
      const filteredImages = image_urls.filter((u: any) => typeof u === "string" && u.trim().length > 0).slice(0, 5)
      if (filteredImages.length > 0) {
        imagesJson = JSON.stringify(filteredImages)
      }
    }

    const ticketId = generateUUID()

    await insert("tickets", {
      id: ticketId,
      title,
      description,
      service_type,
      priority: priority || "media",
      store_id: user.id,
      status: "aberto",
      image_urls: imagesJson,
    })

    // Obter o ticket criado
    const ticket = await queryOne<any>(
      "SELECT * FROM tickets WHERE id = ?",
      [ticketId]
    )

    // Registrar a criação do chamado no histórico
    await insert("ticket_updates", {
      id: generateUUID(),
      ticket_id: ticketId,
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

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let tickets: any[] = []

    if (user.user_type === "loja") {
      tickets = await query<any>(
        `SELECT t.*, 
          s.name as store_name, s.store_number,
          tech.name as technician_name
         FROM tickets t
         LEFT JOIN users s ON t.store_id = s.id
         LEFT JOIN users tech ON t.assigned_technician_id = tech.id
         WHERE t.store_id = ?
         ORDER BY t.created_at DESC`,
        [user.id]
      )
    } else if (user.user_type === "tecnico") {
      tickets = await query<any>(
        `SELECT t.*, 
          s.name as store_name, s.store_number,
          tech.name as technician_name
         FROM tickets t
         LEFT JOIN users s ON t.store_id = s.id
         LEFT JOIN users tech ON t.assigned_technician_id = tech.id
         WHERE t.service_type = ?
         ORDER BY t.created_at DESC`,
        [user.speciality]
      )
    }

    // Formatar tickets com image_urls parseado
  const formattedTickets = tickets.map(ticket => {
    let imageUrlsParsed = null
    try {
      if (ticket.image_urls) {
        imageUrlsParsed = JSON.parse(ticket.image_urls)
      }
    } catch (e) {
      console.error("Erro ao fazer parse de image_urls:", e)
      imageUrlsParsed = null
    }

    return {
      ...ticket,
      image_urls: imageUrlsParsed,
      store: {
        name: ticket.store_name,
        store_number: ticket.store_number
      },
      technician: ticket.technician_name ? { name: ticket.technician_name } : null
    }
  })

    return NextResponse.json({ tickets: formattedTickets })
  } catch (error) {
    console.error("Get tickets error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
