import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser, createSession } from "@/lib/auth"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Verifica se o usuário existe e está inativo para retornar mensagem específica
    try {
      const supabase = createServerClient()
      const { data: existing } = await supabase
        .from("users")
        .select("id, active")
        .eq("email", email)
        .single()

      if (existing && existing.active === false) {
        return NextResponse.json({ error: "Acesso bloqueado. Entre em contato com o suporte." }, { status: 403 })
      }
    } catch (_) {
      // Ignora erro dessa verificação e segue com autenticação padrão
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 })
    }

    await createSession(user)

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
