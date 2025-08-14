import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ["/login", "/api/auth/login"]

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Verificar se o usuário está autenticado
  const user = await getSession()

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Verificar permissões baseadas no tipo de usuário
  if (pathname.startsWith("/dashboard/loja") && user.user_type !== "loja") {
    return NextResponse.redirect(new URL("/dashboard/tecnico", request.url))
  }

  if (pathname.startsWith("/dashboard/tecnico") && user.user_type !== "tecnico") {
    return NextResponse.redirect(new URL("/dashboard/loja", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
