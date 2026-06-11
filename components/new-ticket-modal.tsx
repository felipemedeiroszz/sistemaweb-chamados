"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, X } from "lucide-react"

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

// Chave da API do ImgBB
const IMGBB_API_KEY = "19fabe85640bb1f4a22d76ec190162f4"
const IMGBB_API_URL = "https://api.imgbb.com/1/upload"

export default function NewTicketModal({ isOpen, onClose }: NewTicketModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [priority, setPriority] = useState("media")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Flag para ativar/desativar upload de imagens
  const IMAGE_UPLOAD_ENABLED = true

  const uploadImageToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("key", IMGBB_API_KEY)

    const response = await fetch(IMGBB_API_URL, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Erro ao enviar imagem para ImgBB")
    }

    const data = await response.json()
    return data.data.url
  }

  const handleAttachImages = () => {
    if (!IMAGE_UPLOAD_ENABLED) {
      setError("Anexo de imagens está temporariamente desativado.")
      return
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError("")

    try {
      const newUrls: string[] = []
      const filesToProcess = Array.from(files).slice(0, 5 - imageUrls.length)

      for (const file of filesToProcess) {
        if (file.type.startsWith("image/")) {
          const url = await uploadImageToImgBB(file)
          newUrls.push(url)
        }
      }

      setImageUrls(prev => [...prev, ...newUrls])
    } catch (e) {
      setError("Não foi possível anexar as imagens. Tente novamente.")
    } finally {
      setUploading(false)
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, index) => index !== indexToRemove))
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

          {/* Input de arquivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Seção de upload de imagens */}
          {IMAGE_UPLOAD_ENABLED && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Anexos de Imagem (máx. 5)</label>
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleAttachImages}
                  disabled={uploading || imageUrls.length >= 5}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Anexar imagens"
                  )}
                </Button>
                <span className="text-sm text-gray-600">
                  {imageUrls.length} de 5 selecionada(s)
                </span>
              </div>
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {imageUrls.map((url: string, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Anexo ${index + 1}`}
                        className="h-16 w-16 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Mensagem informativa quando upload está desativado */}
          {!IMAGE_UPLOAD_ENABLED && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Anexos de Imagem</label>
              <div className="text-sm text-gray-400 italic">
                Funcionalidade temporariamente desativada.
              </div>
            </div>
          )}

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
