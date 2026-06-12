import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne, insert, update, deleteRow, generateUUID } from "@/lib/db"

// Função auxiliar para calcular o dia da semana
function getNextDueDate(dayOfWeek: number, timeStr: string): Date {
  const today = new Date()
  const dueDate = new Date(today)
  
  // Encontrar o próximo dia da semana especificado
  while (dueDate.getDay() !== dayOfWeek) {
    dueDate.setDate(dueDate.getDate() + 1)
  }
  
  // Definir a hora
  if (timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    dueDate.setHours(hours, minutes, 0, 0)
  }
  
  // Se o dia já passou no dia atual, pegue a próxima semana
  if (dueDate < today) {
    dueDate.setDate(dueDate.getDate() + 7)
  }
  
  return dueDate
}

// Função para determinar o status de um checklist
// Retorna o status e também pode criar uma nova execução se necessário
async function processChecklistStatus(checklist: any, latestExecution: any | null, userId: string) {
  // Primeiro, buscar todos os itens do checklist
  const allItems = await query<any>(`
    SELECT * FROM checklist_items WHERE checklist_id = ?
  `, [checklist.id])

  // Se há uma execução, verificar todos os itens estão concluídos
  if (latestExecution) {
    // Garantir que temos as respostas
    if (!latestExecution.responses) {
      const responses = await query<any>(`
        SELECT r.*, i.requires_photo as item_requires_photo
        FROM checklist_item_responses r
        JOIN checklist_items i ON r.item_id = i.id
        WHERE r.execution_id = ?
      `, [latestExecution.id])
      latestExecution.responses = responses
    }

    // Mapear todos os itens com suas respostas
    const allItemsWithResponses = allItems.map(item => {
      const response = latestExecution.responses.find((r: any) => r.item_id === item.id)
      return {
        ...item,
        response
      }
    })

    // Verificar se todos os itens têm respostas, estão concluídos, e tem foto se necessário
    const allItemsCompleted = allItemsWithResponses.every((itemWithResp: any) => {
      if (!itemWithResp.response) return false
      if (!itemWithResp.response.completed) return false
      if (itemWithResp.requires_photo && !itemWithResp.response.photo_url) return false
      return true
    })

    if (allItemsCompleted && latestExecution.executed_at) {
      // Verificar se já passou 24h da conclusão
      const executedAt = new Date(latestExecution.executed_at)
      const now = new Date()
      const hoursSinceExecution = (now.getTime() - executedAt.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceExecution < 24) {
        return { status: 'concluido', executedAt: latestExecution.executed_at, latestExecution }
      }
      
      // Se passou 24h e é recorrente, precisamos verificar se precisa de nova execução
      if (checklist.is_recurring && checklist.recurring_day_of_week !== null) {
        // Calcular próxima data de vencimento
        const nextDueDate = getNextDueDate(checklist.recurring_day_of_week, checklist.recurring_time)
        
        // Verificar se já temos uma execução para esta data
        const latestDueDate = new Date(latestExecution.due_date)
        latestDueDate.setHours(0, 0, 0, 0)
        const nextDueDateOnly = new Date(nextDueDate)
        nextDueDateOnly.setHours(0, 0, 0, 0)
        
        if (latestDueDate.getTime() !== nextDueDateOnly.getTime()) {
          // Precisamos criar nova execução para o novo período
          const newExecutionId = generateUUID()
          await insert('checklist_executions', {
            id: newExecutionId,
            checklist_id: checklist.id,
            store_id: checklist.store_id,
            executed_by: userId,
            due_date: nextDueDate.toISOString().split('T')[0],
          })
          
          // Buscar a nova execução
          const newExecution = await queryOne<any>(`
            SELECT * FROM checklist_executions WHERE id = ?
          `, [newExecutionId])
          
          newExecution.responses = []
          
          return { 
            status: 'pendente', 
            dueDate: nextDueDate.toISOString(), 
            latestExecution: newExecution 
          }
        }
      }
      
      // Se passou 24h e não é recorrente ou já tem execução para período, ocultar
      return { status: 'oculto' }
    }
  }
  
  // Verificar se está atrasado
  let dueDate: Date | null = null
  let needsNewExecution = false
  
  if (checklist.is_recurring && checklist.recurring_day_of_week !== null) {
    dueDate = getNextDueDate(checklist.recurring_day_of_week, checklist.recurring_time)
    
    // Se não tem execução ou a execução é para uma data antiga, criar nova
    if (!latestExecution) {
      needsNewExecution = true
    } else {
      const latestDueDate = new Date(latestExecution.due_date)
      latestDueDate.setHours(0, 0, 0, 0)
      const nextDueDateOnly = new Date(dueDate)
      nextDueDateOnly.setHours(0, 0, 0, 0)
      
      if (latestDueDate.getTime() !== nextDueDateOnly.getTime()) {
        needsNewExecution = true
      }
    }
  } else {
    // Não é recorrente, usar a data de criação como base (prazo de 24h padrão)
    dueDate = new Date(checklist.created_at)
    dueDate.setHours(dueDate.getHours() + 24)
  }
  
  // Criar nova execução se necessário
  if (needsNewExecution && dueDate) {
    const newExecutionId = generateUUID()
    await insert('checklist_executions', {
      id: newExecutionId,
      checklist_id: checklist.id,
      store_id: checklist.store_id,
      executed_by: userId,
      due_date: dueDate.toISOString().split('T')[0],
    })
    
    const newExecution = await queryOne<any>(`
      SELECT * FROM checklist_executions WHERE id = ?
    `, [newExecutionId])
    
    newExecution.responses = []
    latestExecution = newExecution
  }
  
  if (dueDate && dueDate < new Date()) {
    // Está atrasado
    return { status: 'atrasado', dueDate: dueDate.toISOString(), latestExecution }
  }
  
  // Padrão: pendente
  return { status: 'pendente', dueDate: dueDate?.toISOString() || null, latestExecution }
}

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
      
      // Para admin, não processar status especial
      // Para cada checklist, buscar seus itens
      for (const checklist of checklists) {
        const items = await query<any>(`
          SELECT * FROM checklist_items 
          WHERE checklist_id = ? 
          ORDER BY order_index ASC, created_at ASC
        `, [checklist.id])
        checklist.items = items
      }
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
      
      // Buscar todas as execuções para esta loja
      const allExecutions = await query<any>(`
        SELECT * FROM checklist_executions 
        WHERE store_id = ? 
        ORDER BY due_date DESC
      `, [user.id])
      
      // Buscar respostas para as execuções
      const executionIds = allExecutions.map((e: any) => e.id)
      let responses: any[] = []
      if (executionIds.length > 0) {
        const placeholders = executionIds.map(() => '?').join(',')
        responses = await query<any>(`
          SELECT * FROM checklist_item_responses 
          WHERE execution_id IN (${placeholders})
        `, executionIds)
      }
      
      // Processar cada checklist
      const processedChecklists = []
      for (const checklist of checklists) {
        // Encontrar a execução mais recente para este checklist
        const checklistExecutions = allExecutions.filter((e: any) => e.checklist_id === checklist.id)
        
        // Adicionar respostas às execuções
        checklistExecutions.forEach((e: any) => {
          e.responses = responses.filter((r: any) => r.execution_id === e.id)
        })
        
        // Calcular status
        const statusInfo = await processChecklistStatus(
          checklist, 
          checklistExecutions[0] || null, 
          user.id
        )
        
        // Se status é 'oculto', não incluir na lista para loja
        if (statusInfo.status !== 'oculto') {
          // Buscar itens do checklist
          const items = await query<any>(`
            SELECT * FROM checklist_items 
            WHERE checklist_id = ? 
            ORDER BY order_index ASC, created_at ASC
          `, [checklist.id])
          
          processedChecklists.push({
            ...checklist,
            items,
            status: statusInfo.status,
            due_date: statusInfo.dueDate,
            executed_at: statusInfo.executedAt,
            latest_execution: statusInfo.latestExecution || null
          })
        }
      }
      
      return NextResponse.json({ checklists: processedChecklists })
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
