"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import TechnicianTicketsList from "@/components/technician-tickets-list"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { useMemo, useState } = React as any

interface Ticket {
  id: string
  ticket_number: number
  title: string
  description: string
  service_type: string
  priority: string
  status: string
  created_at: string
  store?: { name: string; store_number: number }
  assigned_technician?: { name: string; speciality: string }
}

interface TechnicianTicketsBrowserProps {
  available: Ticket[]
  assigned: Ticket[]
}

export default function TechnicianTicketsBrowser({ available, assigned }: TechnicianTicketsBrowserProps) {
  const [search, setSearch] = useState("")

  const filterFn = (t: Ticket) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    const numeric = term.startsWith("#") ? term.slice(1) : term
    if (/^\d+$/.test(numeric)) {
      return String(t.ticket_number) === numeric
    }
    const hay = `${t.title} ${t.description}`.toLowerCase()
    return hay.includes(term)
  }

  const filteredAvailable = useMemo(() => available.filter(filterFn), [available, search])
  const filteredAssigned = useMemo(() => assigned.filter(filterFn), [assigned, search])

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Input
              placeholder="Buscar por nº do ticket (ex: #123) ou texto..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="pl-3"
            />
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Chamados Disponíveis</h2>
        <TechnicianTicketsList tickets={filteredAvailable} type="available" />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Meus Chamados</h2>
        <TechnicianTicketsList tickets={filteredAssigned} type="assigned" />
      </div>
    </div>
  )
}
