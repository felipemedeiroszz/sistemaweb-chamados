"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import AdminLoginModal from "@/components/admin-login-modal"
import LoginForm from "@/components/login-form"

export default function LoginPage() {
  // Estado do modal de login de administrador
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)

  // Tratar clique no logo
  const handlePaulistaLogoClick = () => {
    setIsAdminModalOpen(true)
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
              className="object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handlePaulistaLogoClick}
            />
          </div>
        </div>
      </div>
      
      {/* Modal de Login do Administrador */}
      <AdminLoginModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
    </div>
  )
}
