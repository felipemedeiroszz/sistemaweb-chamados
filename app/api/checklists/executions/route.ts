import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne, insert, update, generateUUID } from "@/lib/db"

// GET /api/checklists/executions - Listaexecuções de checklists para a loja atual
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let executions: any[] = []

    if (user.user_type === "loja") {
      // Buscarexecuções da loja atual
      executions = await query<any>(`
        SELECT e.*, c.name as checklist_name,
          u.name as executed_by_name
        FROM checklist_executions e
        JOIN checklists c ON e.checklist_id = c.id
        LEFT JOIN users u ON e.executed_by = u.id
        WHERE e.store_id = ?
        ORDER BY e.executed_at DESC
      `, [user.id])
    } else if (user.user_type === "admin") {
      // Admin pode ver todas
      const storeId = request.nextUrl.searchParams.get("store_id")
      if (storeId) {
        executions = await query<any>(`
          SELECT e.*, c.name as checklist_name,
            u.name as executed_by_name,
            s.name as store_name
          FROM checklist_executions e
          JOIN checklists c ON e.checklist_id = c.id
          LEFT JOIN users u ON e.executed_by = u.id
          LEFT JOIN users s ON e.store_id = s.id
          WHERE e.store_id = ?
          ORDER BY e.executed_at DESC
        `, [storeId])
      } else {
        executions = await query<any>(`
          SELECT e.*, c.name as checklist_name,
            u.name as executed_by_name,
            s.name as store_name
          FROM checklist_executions e
          JOIN checklists c ON e.checklist_id = c.id
          LEFT JOIN users u ON e.executed_by = u.id
          LEFT JOIN users s ON e.store_id = s.id
          ORDER BY e.executed_at DESC
          LIMIT 100
        `)
      }
    }

    // Para cada execução, buscar as respostas dos itens
    for (const execution of executions) {
      const responses = await query<any>(`
        SELECT r.*, i.title as item_title, i.description as item_description, 
          i.requires_photo as item_requires_photo
        FROM checklist_item_responses r
        JOIN checklist_items i ON r.item_id = i.id
        WHERE r.execution_id = ?
      `, [execution.id])
      execution.responses = responses
    }

    return NextResponse.json({ executions })
  } catch (error) {
    console.error("Get executions error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST /api/checklists/executions - Criar nova execução de checklist
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { checklist_id, due_date, responses } = await request.json()

    if (!checklist_id || !due_date) {
      return NextResponse.json({ error: "Checklist ID e data de vencimento são obrigatórios" }, { status: 400 })
    }

    // Verificar se o checklist existe e pertence à loja do usuário (ou é admin)
    const checklist = await queryOne<any>(`
      SELECT c.*, s.name as store_name
      FROM checklists c
      LEFT JOIN users s ON c.store_id = s.id
      WHERE c.id = ? AND c.active = true
    `, [checklist_id])

    if (!checklist) {
      return NextResponse.json({ error: "Checklist não encontrado" }, { status: 404 })
    }

    if (user.user_type === "loja" && checklist.store_id !== user.id) {
      return NextResponse.json({ error: "Você não tem acesso a este checklist" }, { status: 403 })
    }

    // Criar a execução
    const executionId = generateUUID()
    await insert("checklist_executions", {
      id: executionId,
      checklist_id,
      store_id: checklist.store_id,
      executed_by: user.id,
      due_date,
    })

    // Inserir respostas se fornecidas
    if (responses && Array.isArray(responses)) {
      for (const resp of responses) {
        if (resp.item_id) {
          // Verificar se o item requer foto
          const item = await queryOne<any>("SELECT * FROM checklist_items WHERE id = ?", [resp.item_id])
          
          if (item && item.requires_photo && !resp.photo_url) {
            return NextResponse.json({ 
              error: `Foto é obrigatória para o item: ${item.title}` 
            }, { status: 400 })
          }

          await insert("checklist_item_responses", {
            id: generateUUID(),
            execution_id: executionId,
            item_id: resp.item_id,
            completed: resp.completed || false,
            photo_url: resp.photo_url || null,
            notes: resp.notes || null,
          })
        }
      }
    }

    // Buscar execução criada com respostas
    const execution = await queryOne<any>(`
      SELECT e.*, c.name as checklist_name
      FROM checklist_executions e
      JOIN checklists c ON e.checklist_id = c.id
      WHERE e.id = ?
    `, [executionId])

    const responsesList = await query<any>(`
      SELECT r.*, i.title as item_title, i.description as item_description,
        i.requires_photo as item_requires_photo
      FROM checklist_item_responses r
      JOIN checklist_items i ON r.item_id = i.id
      WHERE r.execution_id = ?
    `, [executionId])

    execution.responses = responsesList

    return NextResponse.json({ execution })
  } catch (error) {
    console.error("Create execution error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
