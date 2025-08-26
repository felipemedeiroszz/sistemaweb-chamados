"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

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
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const router = useRouter()

  // Helper para carregar o script do Uploadcare sob demanda
  const loadUploadcare = () =>
    new Promise<void>((resolve, reject) => {
      if (typeof window === "undefined") return reject(new Error("janela indisponível"))
      // @ts-ignore
      if ((window as any).uploadcare) return resolve()
      let script = document.querySelector("script[data-uploadcare]") as HTMLScriptElement | null
      if (!script) {
        script = document.createElement("script")
        script.src = "https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js"
        script.async = true
        script.dataset.uploadcare = "true"
        script.onload = () => resolve()
        script.onerror = () => reject(new Error("falha ao carregar uploadcare"))
        document.body.appendChild(script)
      } else {
        script.onload = () => resolve()
      }
    })

  const handleAttachImages = async () => {
    try {
      await loadUploadcare()
      // @ts-ignore - uploadcare global vem do script CDN
      const uc = (window as any).uploadcare
      const dialog = uc.openDialog(null, {
        publicKey: "abf873644e637f115f34",
        multiple: true,
        multipleMax: 5,
        imagesOnly: true,
        preferredTypes: "image/*",
        // Opcional: fontes externas
      })

      const files: any[] = await new Promise((resolve, reject) => {
        dialog
          .done((fileGroup: any) => {
            if (fileGroup && typeof fileGroup.files === "function") {
              // V3 group
              Promise.all(fileGroup.files().map((f: any) => f.done()))
                .then(resolve)
                .catch(reject)
            } else if (fileGroup && typeof fileGroup.done === "function") {
              // Single file
              fileGroup.done().then((f: any) => resolve([f])).catch(reject)
            } else {
              resolve([])
            }
          })
          .fail(reject)
      })

      const urls = files
        .map((f: any) => f && (f.cdnUrl || f.cdnUrlModifiers ? `${f.cdnUrl}${f.cdnUrlModifiers || ""}` : null))
        .filter((u: string | null) => !!u) as string[]

      const limited = urls.slice(0, 5)
      setImageUrls(limited)
    } catch (e) {
      setError("Não foi possível anexar as imagens. Tente novamente.")
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
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
          image_urls: imageUrls,
        }),
      })

      if (response.ok) {
        onClose()
        setTitle("")
        setDescription("")
        setServiceType("")
        setPriority("media")
        setImageUrls([])
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
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
              {imageUrls.length > 0 && (
                <span className="text-sm text-gray-600">{imageUrls.length} selecionada(s)</span>
              )}
            </div>
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {imageUrls.map((url: string) => (
                  <img
                    key={url}
                    src={url}
                    alt="Anexo"
                    className="h-16 w-16 object-cover rounded border"
                  />)
                )}
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
  )
}
