import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: "Senha é obrigatória" }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 10)

    return NextResponse.json({
      password: password,
      hash: hash,
      sql: `UPDATE users SET password_hash = '${hash}' WHERE email = 'seu_email_aqui';`,
    })
  } catch (error) {
    console.error("Erro ao gerar hash:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
