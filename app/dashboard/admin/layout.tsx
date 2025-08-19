"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "@/components/dashboard-header"

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  // Check if user is admin on client side
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await fetch("/api/auth/check-session")
        const data = await response.json()

        if (!response.ok || !data.user || data.user.user_type !== "admin") {
          router.push("/login")
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        router.push("/login")
      }
    }

    checkAdminAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userType="admin" />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
