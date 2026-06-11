"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import NewTicketModal from "./new-ticket-modal"

export default function NewTicketButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <Plus className="h-4 w-4"/>
        Novo Chamado
      </Button>

      <NewTicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
