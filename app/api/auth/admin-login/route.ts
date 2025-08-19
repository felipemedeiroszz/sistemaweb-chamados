import { NextResponse } from "next/server"
import { createSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    // Check if the password is correct
    if (password !== "Moinho") {
      return NextResponse.json(
        { error: "Senha de administrador incorreta" },
        { status: 401 }
      )
    }

    // Create admin user object
    const adminUser = {
      id: "admin",
      email: "admin@sistema.com",
      name: "Administrador",
      user_type: "admin" as "admin",
    }

    // Create session for admin
    await createSession(adminUser)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro no login de administrador:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
