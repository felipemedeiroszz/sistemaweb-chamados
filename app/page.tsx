import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const user = await getSession()

  if (!user) {
    redirect("/login")
  }

  // Redirecionar baseado no tipo de usuário
  if (user.user_type === "loja") {
    redirect("/dashboard/loja")
  } else if (user.user_type === "administrador") {
    redirect("/dashboard/admin")
  } else {
    redirect("/dashboard/tecnico")
  }
}
