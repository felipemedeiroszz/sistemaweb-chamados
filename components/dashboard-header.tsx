"use client"

import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { User as UserType } from "@/lib/auth"

interface DashboardHeaderProps {
  user: UserType
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/images/atacadao-3b.png"
                alt="Atacadão 3B"
                width={80}
                height={40}
                className="object-contain"
              />
              <Image
                src="/images/paulista-supermercados.png"
                alt="Paulista Supermercados"
                width={80}
                height={40}
                className="object-contain"
              />
            </div>

            <div className="h-8 w-px bg-gray-300"></div>

            <Link href={user.user_type === "loja" ? "/dashboard/loja" : "/dashboard/tecnico"}>
              <h1 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                Sistema de Chamados
              </h1>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user.name}</span>
              {user.user_type === "loja" && user.store_number && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Loja {user.store_number}
                </span>
              )}
              {user.user_type === "tecnico" && user.speciality && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">{user.speciality}</span>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
