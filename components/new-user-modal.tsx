"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface NewUserModalProps {
  onClose: () => void
  onUserCreated: () => void
}

export default function NewUserModal({ onClose, onUserCreated }: NewUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    user_type: "",
    store_number: "",
    speciality: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onUserCreated()
      } else {
        const data = await response.json()
        setError(data.error || "Erro ao criar usuário")
      }
    } catch (error) {
      setError("Erro ao criar usuário")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Novo Usuário</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="user_type">Tipo de Usuário</Label>
            <Select
              value={formData.user_type}
              onValueChange={(value) => setFormData({ ...formData, user_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loja">Loja</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.user_type === "loja" && (
            <div>
              <Label htmlFor="store_number">Número da Loja</Label>
              <Select
                value={formData.store_number}
                onValueChange={(value) => setFormData({ ...formData, store_number: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a loja" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      Loja {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.user_type === "tecnico" && (
            <div>
              <Label htmlFor="speciality">Especialidade</Label>
              <Select
                value={formData.speciality}
                onValueChange={(value) => setFormData({ ...formData, speciality: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a especialidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Eletricista">Eletricista</SelectItem>
                  <SelectItem value="Manutenção de computadores">Manutenção de computadores</SelectItem>
                  <SelectItem value="Suporte ao usuario / Sistema">Suporte ao usuário / Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Criando..." : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
