import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne, insert, update, deleteRow, generateUUID } from "@/lib/db"

// GET /api/checklists - Lista checklists (admin vê todos, loja vê apenas o seu)
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let checklists: any[] = []

    if (user.user_type === "admin") {
      // Admin vê todos os checklists com informações da loja
      checklists = await query<any>(`
        SELECT c.*, 
          s.name as store_name, s.store_number,
          creator.name as created_by_name
        FROM checklists c
        LEFT JOIN users s ON c.store_id = s.id
        LEFT JOIN users creator ON c.created_by = creator.id
        WHERE c.active = true
        ORDER BY c.created_at DESC
      `)
    } else if (user.user_type === "loja") {
      // Loja vê apenas seus checklists
      checklists = await query<any>(`
        SELECT c.*, 
          s.name as store_name, s.store_number,
          creator.name as created_by_name
        FROM checklists c
        LEFT JOIN users s ON c.store_id = s.id
        LEFT JOIN users creator ON c.created_by = creator.id
        WHERE c.store_id = ? AND c.active = true
        ORDER BY c.created_at DESC
      `, [user.id])
    }

    // Para cada checklist, buscar seus itens
    for (const checklist of checklists) {
      const items = await query<any>(`
        SELECT * FROM checklist_items 
        WHERE checklist_id = ? 
        ORDER BY order_index ASC, created_at ASC
      `, [checklist.id])
      checklist.items = items
    }

    return NextResponse.json({ checklists })
  } catch (error) {
    console.error("Get checklists error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST /api/checklists - Criar novo checklist (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Apenas administradores podem criar checklists" }, { status: 403 })
    }

    const { name, store_id, is_recurring, recurring_day_of_week, recurring_time, items } = await request.json()

    if (!name || !store_id) {
      return NextResponse.json({ error: "Nome e loja são obrigatórios" }, { status: 400 })
    }

    const checklistId = generateUUID()

    await insert("checklists", {
      id: checklistId,
      name,
      store_id,
      is_recurring: is_recurring || false,
      recurring_day_of_week: recurring_day_of_week !== undefined ? recurring_day_of_week : null,
      recurring_time: recurring_time || null,
      created_by: user.id,
      active: true,
    })

    // Inserir itens se fornecidos
    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.title) {
          await insert("checklist_items", {
            id: generateUUID(),
            checklist_id: checklistId,
            title: item.title,
            description: item.description || null,
            requires_photo: item.requires_photo || false,
            order_index: i,
          })
        }
      }
    }

    // Buscar o checklist criado com itens
    const checklist = await queryOne<any>(`
      SELECT c.*, s.name as store_name, s.store_number
      FROM checklists c
      LEFT JOIN users s ON c.store_id = s.id
      WHERE c.id = ?
    `, [checklistId])

    const checklistItems = await query<any>(`
      SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY order_index ASC
    `, [checklistId])

    checklist.items = checklistItems

    return NextResponse.json({ checklist })
  } catch (error) {
    console.error("Create checklist error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
