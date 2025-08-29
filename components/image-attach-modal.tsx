"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImageAttachModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (files: File[]) => void
  maxFiles?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { useEffect, useRef, useState } = React as any

export default function ImageAttachModal({ isOpen, onClose, onConfirm, maxFiles = 5 }: ImageAttachModalProps) {
  const [files, setFiles] = useState([] as File[])
  const [error, setError] = useState("")
  const inputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      setFiles([])
      setError("")
    }
  }, [isOpen])

  const onFileChange = (e: any) => {
    const selected = Array.from((e?.target?.files as FileList) || [])
    const imagesOnly = selected.filter((f: File) => f.type.startsWith("image/"))
    const total = [...files, ...imagesOnly].slice(0, maxFiles)
    if (selected.length !== imagesOnly.length) {
      setError("Apenas imagens são permitidas.")
    } else if ([...files, ...imagesOnly].length > maxFiles) {
      setError(`Máximo de ${maxFiles} imagens.`)
    } else {
      setError("")
    }
    setFiles(total)
    if (inputRef.current) inputRef.current.value = ""
  }

  const removeAt = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[560px]" onInteractOutside={(e: any) => e.preventDefault()} onEscapeKeyDown={(e: any) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Anexar imagens</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
          />
          {files.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {files.map((f: File, idx: number) => (
                <div key={idx} className="relative">
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="h-20 w-20 object-cover rounded border"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-white border rounded-full px-1 text-xs"
                    onClick={() => removeAt(idx)}
                    aria-label="remover"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500">Máximo de {maxFiles} imagens.</p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={() => onConfirm(files)} disabled={files.length === 0}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
