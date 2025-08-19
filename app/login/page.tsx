import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import LoginForm from "@/components/login-form"
import Image from "next/image"

export default async function LoginPage() {
  const user = await getSession()

  if (user) {
    // Redirecionar baseado no tipo de usuário
    if (user.user_type === "loja") {
      redirect("/dashboard/loja")
    } else if (user.user_type === "administrador") {
      redirect("/dashboard/admin")
    } else {
      redirect("/dashboard/tecnico")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sistema de Chamados</h2>
          <p className="mt-2 text-sm text-gray-600">Faça login para acessar o sistema</p>
        </div>
        <LoginForm />

        <div className="flex flex-col items-center space-y-4 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-8">
            <Image src="/images/atacadao-3b.png" alt="Atacadão 3B" width={120} height={60} className="object-contain" />
            <Image
              src="/images/paulista-supermercados.png"
              alt="Paulista Supermercados"
              width={120}
              height={60}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
