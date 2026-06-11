import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne, insert, update, deleteRow, generateUUID } from "@/lib/db"

// GET /api/checklists/[id] - Obter um checklist específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    const checklist = await queryOne<any>(`
      SELECT c.*, s.name as store_name, s.store_number,
        creator.name as created_by_name
      FROM checklists c
      LEFT JOIN users s ON c.store_id = s.id
      LEFT JOIN users creator ON c.created_by = creator.id
      WHERE c.id = ?
    `, [id])

    if (!checklist) {
      return NextResponse.json({ error: "Checklist não encontrado" }, { status: 404 })
    }

    // Verificar permissão
    if (user.user_type !== "admin" && checklist.store_id !== user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    // Buscar itens
    const items = await query<any>(`
      SELECT * FROM checklist_items 
      WHERE checklist_id = ? 
      ORDER BY order_index ASC, created_at ASC
    `, [id])

    checklist.items = items

    return NextResponse.json({ checklist })
  } catch (error) {
    console.error("Get checklist error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PATCH /api/checklists/[id] - Atualizar checklist
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Apenas administradores podem atualizar checklists" }, { status: 403 })
    }

    const { id } = await params
    const { name, is_recurring, recurring_day_of_week, recurring_time, items, active } = await request.json()

    const existing = await queryOne<any>("SELECT * FROM checklists WHERE id = ?", [id])
    if (!existing) {
      return NextResponse.json({ error: "Checklist não encontrado" }, { status: 404 })
    }

    // Atualizar dados principais do checklist
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (is_recurring !== undefined) updateData.is_recurring = is_recurring
    if (recurring_day_of_week !== undefined) updateData.recurring_day_of_week = recurring_day_of_week
    if (recurring_time !== undefined) updateData.recurring_time = recurring_time
    if (active !== undefined) updateData.active = active

    if (Object.keys(updateData).length > 0) {
      await update("checklists", updateData, { id })
    }

    // Atualizar itens se fornecidos
    if (items && Array.isArray(items)) {
      // Remover itens existentes e recriar
      await deleteRow("checklist_items", { checklist_id: id })
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.title) {
          await insert("checklist_items", {
            id: generateUUID(),
            checklist_id: id,
            title: item.title,
            description: item.description || null,
            requires_photo: item.requires_photo || false,
            order_index: i,
          })
        }
      }
    }

    // Buscar checklist atualizado
    const checklist = await queryOne<any>(`
      SELECT c.*, s.name as store_name, s.store_number
      FROM checklists c
      LEFT JOIN users s ON c.store_id = s.id
      WHERE c.id = ?
    `, [id])

    const updatedItems = await query<any>(`
      SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY order_index ASC
    `, [id])

    checklist.items = updatedItems

    return NextResponse.json({ checklist })
  } catch (error) {
    console.error("Update checklist error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE /api/checklists/[id] - Excluir checklist (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Apenas administradores podem excluir checklists" }, { status: 403 })
    }

    const { id } = await params

    const existing = await queryOne<any>("SELECT * FROM checklists WHERE id = ?", [id])
    if (!existing) {
      return NextResponse.json({ error: "Checklist não encontrado" }, { status: 404 })
    }

    // Soft delete
    await update("checklists", { active: false }, { id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete checklist error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
