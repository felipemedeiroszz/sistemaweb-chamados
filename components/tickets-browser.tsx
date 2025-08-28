"use client"
import React from "react"
import TicketsList from "@/components/tickets-list"
import TicketsFilter, { type FilterState } from "@/components/tickets-filter"

// Shim React hooks for TS environments where hook types are not exported
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
  assigned_technician?: {
    name: string
    speciality: string
  }
}

interface TicketsBrowserProps {
  tickets: Ticket[]
  userType: "loja" | "tecnico"
}

export default function TicketsBrowser({ tickets, userType }: TicketsBrowserProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "",
    priority: "",
    serviceType: "",
    dateRange: "",
  })

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase()

    return tickets.filter((t) => {
      // Match by ticket number when numeric or starts with '#'
      if (term) {
        const numeric = term.startsWith("#") ? term.slice(1) : term
        if (/^\d+$/.test(numeric)) {
          if (String(t.ticket_number) !== numeric) return false
        } else {
          const hay = `${t.title} ${t.description}`.toLowerCase()
          if (!hay.includes(term)) return false
        }
      }

      if (filters.status && t.status !== filters.status) return false
      if (filters.priority && t.priority !== filters.priority) return false
      if (filters.serviceType && t.service_type !== filters.serviceType) return false
      // dateRange omitted for brevity; can be added if needed

      return true
    })
  }, [tickets, filters])

  return (
    <div>
      <TicketsFilter
        userType={userType}
        onFilterChange={(f) => setFilters(f)}
      />
      <TicketsList tickets={filtered} userType={userType} />
    </div>
  )
}
