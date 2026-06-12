import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne, insert, update, generateUUID } from "@/lib/db"

// PATCH /api/checklists/executions/[id]/responses - Atualizar respostas de uma execução
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const { responses } = await request.json()

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json({ error: "Respostas são obrigatórias" }, { status: 400 })
    }

    // Verificar se a execução existe
    const execution = await queryOne<any>(`
      SELECT e.*, c.name as checklist_name
      FROM checklist_executions e
      JOIN checklists c ON e.checklist_id = c.id
      WHERE e.id = ?
    `, [id])

    if (!execution) {
      return NextResponse.json({ error: "Execução não encontrada" }, { status: 404 })
    }

    // Verificar permissão
    if (user.user_type === "loja" && execution.store_id !== user.id) {
      return NextResponse.json({ error: "Você não tem acesso a esta execução" }, { status: 403 })
    }

    // Buscar todos os itens do checklist para garantir que temos todos
    const allItems = await query<any>(`
      SELECT * FROM checklist_items WHERE checklist_id = ?
    `, [execution.checklist_id])

    // Validar cada resposta
    for (const resp of responses) {
      if (!resp.item_id) continue

      // Verificar se o item pertence ao checklist da execução
      const item = allItems.find(i => i.id === resp.item_id)
      if (!item) {
        return NextResponse.json({ 
          error: `Item ${resp.item_id} não pertence a este checklist` 
        }, { status: 400 })
      }

      // Se o item requer foto e a resposta marca como concluída, exigir foto
      if (item.requires_photo && resp.completed && !resp.photo_url) {
        return NextResponse.json({ 
          error: `Foto é obrigatória para o item: ${item.title}` 
        }, { status: 400 })
      }
    }

    // Atualizar ou inserir respostas
    for (const resp of responses) {
      if (!resp.item_id) continue

      const existing = await queryOne<any>(`
        SELECT * FROM checklist_item_responses 
        WHERE execution_id = ? AND item_id = ?
      `, [id, resp.item_id])

      if (existing) {
        await update("checklist_item_responses", {
          completed: resp.completed !== undefined ? resp.completed : existing.completed,
          photo_url: resp.photo_url !== undefined ? resp.photo_url : existing.photo_url,
          notes: resp.notes !== undefined ? resp.notes : existing.notes,
        }, { id: existing.id })
      } else {
        await insert("checklist_item_responses", {
          id: generateUUID(),
          execution_id: id,
          item_id: resp.item_id,
          completed: resp.completed || false,
          photo_url: resp.photo_url || null,
          notes: resp.notes || null,
        })
      }
    }

    // Verificar se TODOS os itens foram marcados como concluídos
    const updatedResponses = await query<any>(`
      SELECT r.*, i.requires_photo as item_requires_photo
      FROM checklist_item_responses r
      JOIN checklist_items i ON r.item_id = i.id
      WHERE r.execution_id = ?
    `, [id])

    const allItemsWithResponses = allItems.map(item => {
      const response = updatedResponses.find(r => r.item_id === item.id)
      return {
        ...item,
        response
      }
    })

    // Verificar se todos os itens têm respostas e estão concluídos
    const allItemsCompleted = allItemsWithResponses.every(itemWithResp => {
      if (!itemWithResp.response) return false
      if (!itemWithResp.response.completed) return false
      if (itemWithResp.requires_photo && !itemWithResp.response.photo_url) return false
      return true
    })

    // Atualizar executed_at apenas se todos os itens estiverem concluídos
    if (allItemsCompleted && !execution.executed_at) {
      await update("checklist_executions", {
        executed_by: user.id,
        executed_at: new Date()
      }, { id })
    }

    // Buscar execução atualizada
    const updatedExecution = await queryOne<any>(`
      SELECT e.*, c.name as checklist_name
      FROM checklist_executions e
      JOIN checklists c ON e.checklist_id = c.id
      WHERE e.id = ?
    `, [id])

    const responsesList = await query<any>(`
      SELECT r.*, i.title as item_title, i.description as item_description,
        i.requires_photo as item_requires_photo
      FROM checklist_item_responses r
      JOIN checklist_items i ON r.item_id = i.id
      WHERE r.execution_id = ?
    `, [id])

    updatedExecution.responses = responsesList

    return NextResponse.json({ execution: updatedExecution })
  } catch (error) {
    console.error("Update responses error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
