import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne, insert, generateUUID } from "@/lib/db"

// POST /api/checklists/[id]/clone - Clonar checklist para outras lojas
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Apenas administradores podem clonar checklists" }, { status: 403 })
    }

    const { id } = await params
    const { target_store_ids } = await request.json()

    if (!target_store_ids || !Array.isArray(target_store_ids) || target_store_ids.length === 0) {
      return NextResponse.json({ error: "Lista de lojas destino é obrigatória" }, { status: 400 })
    }

    // Buscar checklist original com itens
    const originalChecklist = await queryOne<any>(`
      SELECT c.*, s.name as store_name, s.store_number
      FROM checklists c
      LEFT JOIN users s ON c.store_id = s.id
      WHERE c.id = ?
    `, [id])

    if (!originalChecklist) {
      return NextResponse.json({ error: "Checklist não encontrado" }, { status: 404 })
    }

    const originalItems = await query<any>(`
      SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY order_index ASC
    `, [id])

    // Verificar se as lojas destino existem e são lojas
    const stores = await query<any>(`
      SELECT id, name, store_number FROM users 
      WHERE id IN (${target_store_ids.map(() => "?").join(",")}) 
      AND user_type = 'loja'
    `, target_store_ids)

    if (stores.length !== target_store_ids.length) {
      return NextResponse.json({ error: "Algumas lojas não foram encontradas ou não são lojas válidas" }, { status: 400 })
    }

    // Criar clones para cada loja
    const clonedChecklists = []
    for (const store of stores) {
      // Verificar se já existe checklist ativo para essa loja com o mesmo nome
      const existing = await queryOne<any>(`
        SELECT id FROM checklists 
        WHERE store_id = ? AND name = ? AND active = true
      `, [store.id, originalChecklist.name])

      if (existing) {
        // Atualizar checklist existente com os mesmos dados
        const { update } = await import("@/lib/db")
        await update("checklists", {
          is_recurring: originalChecklist.is_recurring,
          recurring_day_of_week: originalChecklist.recurring_day_of_week,
          recurring_time: originalChecklist.recurring_time,
        }, { id: existing.id })

        // Remover itens antigos e recriar
        const { deleteRow } = await import("@/lib/db")
        await deleteRow("checklist_items", { checklist_id: existing.id })

        for (let i = 0; i < originalItems.length; i++) {
          const item = originalItems[i]
          await insert("checklist_items", {
            id: generateUUID(),
            checklist_id: existing.id,
            title: item.title,
            description: item.description,
            requires_photo: item.requires_photo,
            order_index: i,
          })
        }

        const updated = await queryOne<any>(`
          SELECT c.*, s.name as store_name, s.store_number
          FROM checklists c
          LEFT JOIN users s ON c.store_id = s.id
          WHERE c.id = ?
        `, [existing.id])

        updated.items = await query<any>(`
          SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY order_index ASC
        `, [existing.id])

        clonedChecklists.push(updated)
      } else {
        // Criar novo checklist
        const newId = generateUUID()
        await insert("checklists", {
          id: newId,
          name: originalChecklist.name,
          store_id: store.id,
          is_recurring: originalChecklist.is_recurring,
          recurring_day_of_week: originalChecklist.recurring_day_of_week,
          recurring_time: originalChecklist.recurring_time,
          created_by: user.id,
          active: true,
        })

        // Copiar itens
        for (let i = 0; i < originalItems.length; i++) {
          const item = originalItems[i]
          await insert("checklist_items", {
            id: generateUUID(),
            checklist_id: newId,
            title: item.title,
            description: item.description,
            requires_photo: item.requires_photo,
            order_index: i,
          })
        }

        const newChecklist = await queryOne<any>(`
          SELECT c.*, s.name as store_name, s.store_number
          FROM checklists c
          LEFT JOIN users s ON c.store_id = s.id
          WHERE c.id = ?
        `, [newId])

        newChecklist.items = await query<any>(`
          SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY order_index ASC
        `, [newId])

        clonedChecklists.push(newChecklist)
      }
    }

    return NextResponse.json({ 
      message: `${clonedChecklists.length} checklist(s) criado(s)/atualizado(s) com sucesso`,
      checklists: clonedChecklists 
    })
  } catch (error) {
    console.error("Clone checklist error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
