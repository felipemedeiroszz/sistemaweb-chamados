import { NextResponse, type NextRequest } from "next/server"
import { getSession } from "@/lib/auth"
import { createServerClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

// GET /api/users - list users (admin only)
export async function GET() {
  try {
    const user = await getSession()
    if (!user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, user_type, store_number, speciality, active, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao listar usuários:", error)
      return NextResponse.json({ error: "Erro ao listar usuários" }, { status: 500 })
    }

    return NextResponse.json({ users: data || [] })
  } catch (e) {
    console.error("Users GET error:", e)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST /api/users - create user (admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await getSession()
    if (!admin || admin.user_type !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      email,
      password,
      name,
      user_type,
      store_number,
      speciality,
      active = true,
    } = body || {}

    if (!email || !password || !name || !user_type) {
      return NextResponse.json({ error: "Campos obrigatórios: email, password, name, user_type" }, { status: 400 })
    }

    const supabase = createServerClient()

    // hash password
    const password_hash = await bcrypt.hash(password, 10)

    const insertPayload: any = {
      email,
      password_hash,
      name,
      user_type,
      active: !!active,
    }

    if (store_number !== undefined) insertPayload.store_number = store_number
    if (speciality !== undefined) insertPayload.speciality = speciality

    const { data, error } = await supabase
      .from("users")
      .insert(insertPayload)
      .select("id, email, name, user_type, store_number, speciality, active, created_at, updated_at")
      .single()

    if (error) {
      console.error("Erro ao criar usuário:", error)
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (e) {
    console.error("Users POST error:", e)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
