import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth"
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

    const supabase = createServerClient()

    // Verificar senha atual
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password_hash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
    }

    // Hash da nova senha
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Atualizar senha no banco
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: newPasswordHash })
      .eq("id", user.id)

    if (updateError) {
      return NextResponse.json({ error: "Erro ao atualizar senha" }, { status: 500 })
    }

    return NextResponse.json({ message: "Senha alterada com sucesso" })
  } catch (error) {
    console.error("Erro ao alterar senha:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
