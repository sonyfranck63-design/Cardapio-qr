'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { MenuItem } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import { X, UtensilsCrossed } from 'lucide-react'

interface ItemDetailModalProps {
  item: MenuItem | null
  isOpen: boolean
  onClose: () => void
}

export default function ItemDetailModal({ item, isOpen, onClose }: ItemDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Acessibilidade: Fechar no Escape e prender foco (Focus Trap)
  useEffect(() => {
    if (!isOpen || !item) return

    const previousActiveElement = document.activeElement as HTMLElement
    closeButtonRef.current?.focus()

    // Bloqueia scroll de fundo
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusableElements[0]
        const last = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last?.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === last) {
            first?.focus()
            e.preventDefault()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
      previousActiveElement?.focus()
    }
  }, [isOpen, item, onClose])

  if (!isOpen || !item) return null

  const hasImage = Boolean(item.image_url)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-modal-title"
    >
      {/* Backdrop com blur suave */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet no mobile / Modal centralizado no desktop */}
      <div
        ref={modalRef}
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col animate-slide-up"
      >
        {/* Pílula superior para drag affordance no mobile */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3 sm:hidden" />

        {/* Botão de Fechar Acessível */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Fechar detalhes do item"
          className="absolute top-4 right-4 z-20 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Imagem em Destaque */}
        {hasImage ? (
          <div className="relative w-full h-64 sm:h-72 bg-gray-100 flex-shrink-0">
            <Image
              src={item.image_url!}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="w-full h-36 bg-gradient-to-br from-orange-50 to-amber-100/60 flex items-center justify-center text-orange-400 flex-shrink-0">
            <UtensilsCrossed className="w-12 h-12 stroke-[1.5]" />
          </div>
        )}

        {/* Conteúdo com scroll se descrição for longa */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h2 id="item-modal-title" className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              {item.name}
            </h2>
            <span className="text-xl sm:text-2xl font-extrabold text-orange-600 whitespace-nowrap tabular-nums">
              {formatCurrency(item.price)}
            </span>
          </div>

          {item.description ? (
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">Sem descrição detalhada disponível.</p>
          )}
        </div>

        {/* Rodapé com botão de fechar */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
