import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { queryOne, update } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Senhas são obrigatórias" }, { status: 400 })
    }

    // Verificar senha atual
    const userData = await queryOne<any>(
      "SELECT password_hash FROM users WHERE id = ? LIMIT 1",
      [user.id]
    )

    if (!userData) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password_hash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Atualizar senha no banco
    await update("users", { password_hash: newPasswordHash }, { id: user.id })

    return NextResponse.json({ message: "Senha alterada com sucesso" })
  } catch (error) {
    console.error("Erro ao alterar senha:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
