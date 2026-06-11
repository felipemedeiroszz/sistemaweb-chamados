import { NextResponse, type NextRequest } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne, insert, update, deleteRow, generateUUID } from "@/lib/db"
import bcrypt from "bcryptjs"

// GET /api/users - list users (admin only)
export async function GET() {
  try {
    const user = await getSession()
    if (!user || user.user_type !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const users = await query<any>(
      "SELECT id, email, name, user_type, store_number, speciality, phone, active, created_at, updated_at FROM users ORDER BY created_at DESC"
    )

    return NextResponse.json({ users })
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
      phone,
      active = true,
    } = body || {}

    if (!email || !password || !name || !user_type) {
      return NextResponse.json({ error: "Campos obrigatórios: email, password, name, user_type" }, { status: 400 })
    }

    // hash password
    const password_hash = await bcrypt.hash(password, 10)
    const userId = generateUUID()

    const insertPayload: any = {
      id: userId,
      email,
      password_hash,
      name,
      user_type,
      active: !!active,
    }

    if (store_number !== undefined) insertPayload.store_number = store_number
    if (speciality !== undefined) insertPayload.speciality = speciality
    if (phone !== undefined) insertPayload.phone = phone

    await insert("users", insertPayload)

    // Obter o usuário criado
    const user = await queryOne<any>(
      "SELECT id, email, name, user_type, store_number, speciality, phone, active, created_at, updated_at FROM users WHERE id = ?",
      [userId]
    )

    return NextResponse.json({ user })
  } catch (e) {
    console.error("Users POST error:", e)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
