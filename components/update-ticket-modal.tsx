"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface Ticket {
  id: string
  ticket_number: number
  title: string
  status: string
}

interface UpdateTicketModalProps {
  ticket: Ticket
  isOpen: boolean
  onClose: () => void
}

const statusOptions = [
  { value: "em_andamento", label: "Em Andamento" },
  { value: "aguardando", label: "Aguardando" },
  { value: "resolvido", label: "Resolvido" },
]

export default function UpdateTicketModal({ ticket, isOpen, onClose }: UpdateTicketModalProps) {
  const [status, setStatus] = useState(ticket.status)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [expectedResolutionAt, setExpectedResolutionAt] = useState<string>("")
  const [deadlineModalOpen, setDeadlineModalOpen] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (status === "aguardando" && !expectedResolutionAt) {
        setLoading(false)
        setError("Defina o prazo de resolução para status 'Aguardando'.")
        setDeadlineModalOpen(true)
        return
      }
      const response = await fetch(`/api/tickets/${ticket.id}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          comment,
          expected_resolution_at: expectedResolutionAt ? new Date(expectedResolutionAt).toISOString() : undefined,
        }),
      })

      if (response.ok) {
        onClose()
        setComment("")
        setExpectedResolutionAt("")
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || "Erro ao atualizar chamado")
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Atualizar Chamado #{ticket.ticket_number} - {ticket.title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <Select
              value={status}
              onValueChange={(value: string) => {
                setStatus(value)
                if (value === "aguardando" && !expectedResolutionAt) {
                  setDeadlineModalOpen(true)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {status === "aguardando" && expectedResolutionAt && (
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                Prazo selecionado: {new Date(expectedResolutionAt).toLocaleString()}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setDeadlineModalOpen(true)}>
                Alterar prazo
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Comentário (opcional)
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e: any) => setComment(e.target.value)}
              placeholder="Adicione um comentário sobre a atualização"
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Modal secundário para escolher o prazo (calendário/data-hora) */}
      <Dialog open={deadlineModalOpen} onOpenChange={setDeadlineModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Definir prazo de resolução</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label htmlFor="deadline" className="text-sm font-medium">
              Data e hora
            </label>
            <input
              id="deadline"
              type="datetime-local"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={expectedResolutionAt}
              onChange={(e: any) => setExpectedResolutionAt(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDeadlineModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!expectedResolutionAt) return
                  setDeadlineModalOpen(false)
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
