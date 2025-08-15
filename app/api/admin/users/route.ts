import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUserFromRequest } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const supabase = createClient()

    const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 })
    }

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, user_type, store_number, speciality } = body

    // Validações
    if (!name || !email || !password || !user_type) {
      return NextResponse.json({ error: "Campos obrigatórios não preenchidos" }, { status: 400 })
    }

    if (user_type === "loja" && !store_number) {
      return NextResponse.json({ error: "Número da loja é obrigatório" }, { status: 400 })
    }

    if (user_type === "tecnico" && !speciality) {
      return NextResponse.json({ error: "Especialidade é obrigatória" }, { status: 400 })
    }

    const supabase = createClient()

    // Verificar se email já existe
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

    if (existingUser) {
      return NextResponse.json({ error: "Email já está em uso" }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar usuário
    const userData: any = {
      name,
      email,
      password_hash: hashedPassword,
      user_type,
      active: true,
    }

    if (user_type === "loja") {
      userData.store_number = Number.parseInt(store_number)
    }

    if (user_type === "tecnico") {
      userData.speciality = speciality
    }

    const { data: newUser, error } = await supabase.from("users").insert([userData]).select().single()

    if (error) {
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }

    return NextResponse.json(newUser)
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
