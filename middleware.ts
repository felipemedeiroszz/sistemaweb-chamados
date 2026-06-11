import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

interface User {
  id: string
  email: string
  name: string
  user_type: "loja" | "tecnico" | "admin"
  store_number?: number
  speciality?: string
}

async function getUserFromSession(request: NextRequest): Promise<User | null> {
  const token = request.cookies.get("session")?.value
  
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ["/login", "/api/auth/login", "/api/auth/admin-login", "/api/auth/check-session"]

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Verificar se o usuário está autenticado
  const user = await getUserFromSession(request)

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Verificar permissões baseadas no tipo de usuário
  if (pathname.startsWith("/dashboard/loja") && user.user_type !== "loja") {
    // Redirecionar para a dashboard apropriada baseada no tipo de usuário
    if (user.user_type === "admin") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url))
    } else {
      return NextResponse.redirect(new URL("/dashboard/tecnico", request.url))
    }
  }

  if (pathname.startsWith("/dashboard/tecnico") && user.user_type !== "tecnico") {
    // Redirecionar para a dashboard apropriada baseada no tipo de usuário
    if (user.user_type === "admin") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url))
    } else {
      return NextResponse.redirect(new URL("/dashboard/loja", request.url))
    }
  }
  
  // Proteger rotas de admin
  if (pathname.startsWith("/dashboard/admin") && user.user_type !== "admin") {
    // Redirecionar para a dashboard apropriada baseada no tipo de usuário
    if (user.user_type === "loja") {
      return NextResponse.redirect(new URL("/dashboard/loja", request.url))
    } else {
      return NextResponse.redirect(new URL("/dashboard/tecnico", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  // Não aplicar middleware em rotas de API e assets estáticos
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
