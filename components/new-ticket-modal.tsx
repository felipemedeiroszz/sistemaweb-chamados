"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import ImageAttachModal from "@/components/image-attach-modal"
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { useState } = React as any

interface NewTicketModalProps {
  isOpen: boolean
  onClose: () => void
}

const serviceTypes = [
  "Departamento Pessoal",
  "RH",
  "Comercial",
  "Manutenção Infraestrutura",
  "Manutenção de computadores",
  "Suporte TI",
]

const priorities = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
]

export default function NewTicketModal({ isOpen, onClose }: NewTicketModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [priority, setPriority] = useState("media")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [imageUrls, setImageUrls] = useState([] as string[])
  const [showAttach, setShowAttach] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([] as File[])
  const router = useRouter()

  const handleAttachImages = () => {
    setShowAttach(true)
  }

  const uploadSelectedImages = async (): Promise<string[]> => {
    if (!isSupabaseConfigured) return []
    const bucket = "ticket-images"
    const uploadedUrls: string[] = []
    for (let i = 0; i < Math.min(selectedFiles.length, 5); i++) {
      const f = selectedFiles[i]
      const path = `tickets/${Date.now()}-${i}-${f.name}`
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, f, {
        cacheControl: "3600",
        upsert: false,
        contentType: f.type || "image/jpeg",
      })
      if (upErr) {
        throw upErr
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      if (data?.publicUrl) uploadedUrls.push(data.publicUrl)
    }
    return uploadedUrls
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let urlsToSend: string[] = imageUrls
      if (selectedFiles.length > 0) {
        urlsToSend = await uploadSelectedImages()
      }
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          service_type: serviceType,
          priority,
          image_urls: urlsToSend,
        }),
      })

      if (response.ok) {
        onClose()
        setTitle("")
        setDescription("")
        setServiceType("")
        setPriority("media")
        setImageUrls([])
        setSelectedFiles([])
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || "Erro ao criar chamado")
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open: boolean) => { if (!open) onClose() }}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e: any) => e.preventDefault()}
        onEscapeKeyDown={(e: any) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Novo Chamado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Título
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e: any) => setTitle(e.target.value)}
              placeholder="Descreva brevemente o problema"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="service-type" className="text-sm font-medium">
              Tipo de Serviço
            </label>
            <Select value={serviceType} onValueChange={(v: string) => setServiceType(v)} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de serviço" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="priority" className="text-sm font-medium">
              Prioridade
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descrição
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: any) => setDescription(e.target.value)}
              placeholder="Descreva detalhadamente o problema"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Anexos de Imagem (máx. 5)</label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={handleAttachImages}>
                Anexar imagens
              </Button>
              {(selectedFiles.length > 0 || imageUrls.length > 0) && (
                <span className="text-sm text-gray-600">{selectedFiles.length || imageUrls.length} selecionada(s)</span>
              )}
            </div>
            {(selectedFiles.length > 0 || imageUrls.length > 0) && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {selectedFiles.length > 0
                  ? selectedFiles.map((f: File, idx: number) => (
                      <img
                        key={idx}
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className="h-16 w-16 object-cover rounded border"
                      />
                    ))
                  : imageUrls.map((url: string) => (
                      <img
                        key={url}
                        src={url}
                        alt="Anexo"
                        className="h-16 w-16 object-cover rounded border"
                      />
                    ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Chamado"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    <ImageAttachModal
      isOpen={showAttach}
      onClose={() => setShowAttach(false)}
      onConfirm={(files) => { setSelectedFiles(files); setShowAttach(false) }}
      maxFiles={5}
    />
    </>
  )
}
