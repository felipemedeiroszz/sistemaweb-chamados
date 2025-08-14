import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import LoginForm from "@/components/login-form"

export default async function LoginPage() {
  const user = await getSession()

  if (user) {
    // Redirecionar baseado no tipo de usuário
    if (user.user_type === "loja") {
      redirect("/dashboard/loja")
    } else {
      redirect("/dashboard/tecnico")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sistema de Chamados Paulista</h2>
          <p className="mt-2 text-sm text-gray-600">Faça login para acessar o sistema</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
