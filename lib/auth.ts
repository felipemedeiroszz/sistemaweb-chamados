import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export interface User {
  id: string
  email: string
  name: string
  user_type: "loja" | "tecnico" | "admin"
  store_number?: number
  speciality?: string
  phone?: string
  active?: boolean
  created_at?: Date
  updated_at?: Date
}

// Função separada para autenticação (usa banco de dados)
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const { queryOne } = await import("./db")
  
  const user = await queryOne<any>(
    "SELECT * FROM users WHERE email = ? AND active = true LIMIT 1",
    [email]
  )

  if (!user) {
    console.log("Usuário não encontrado")
    return null
  }

  const storedPassword = user.password_hash
  let isValidPassword = false

  if (storedPassword && storedPassword.startsWith("$2")) {
    try {
      isValidPassword = await bcrypt.compare(password, storedPassword)
    } catch (error) {
      console.log("Erro ao comparar hash bcrypt:", error)
      isValidPassword = false
    }
  } else {
    isValidPassword = password === storedPassword
  }

  console.log("Debug login:", {
    email,
    password: "***",
    storedPasswordType: storedPassword?.startsWith("$2") ? "bcrypt_hash" : "plain_text",
    isValid: isValidPassword,
  })

  if (!isValidPassword) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    user_type: user.user_type,
    store_number: user.store_number,
    speciality: user.speciality,
  }
}

export async function createSession(user: User) {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(JWT_SECRET)

  const cookieStore = cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  })
}

export async function getSession(): Promise<User | null> {
  const cookieStore = cookies()
  const token = cookieStore.get("session")?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload.user as User
  } catch {
    return null
  }
}

export async function destroySession() {
  const cookieStore = cookies()
  cookieStore.delete("session")
}
