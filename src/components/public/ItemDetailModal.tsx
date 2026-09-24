'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { MenuItem } from '@/types/database'
import { formatCurrency, buildWhatsAppUrl } from '@/lib/utils'
import { X, UtensilsCrossed } from 'lucide-react'

interface ItemDetailModalProps {
  item: MenuItem | null
  isOpen: boolean
  onClose: () => void
  whatsappNumber?: string | null
}

export default function ItemDetailModal({
  item,
  isOpen,
  onClose,
  whatsappNumber,
}: ItemDetailModalProps) {
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
  const isSoldOut = !item.is_active

  const whatsappOrderUrl = whatsappNumber && !isSoldOut
    ? buildWhatsAppUrl(
        whatsappNumber,
        `Olá! Gostaria de pedir: *${item.name}* (${formatCurrency(item.price)}).`
      )
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet / Modal */}
      <div
        ref={modalRef}
        className="relative w-full sm:max-w-lg bg-stone-50 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col animate-slide-up border border-stone-200"
      >
        {/* Pílula superior no mobile */}
        <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto my-3 sm:hidden" />

        {/* Botão de Fechar */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Fechar detalhes do item"
          className="absolute top-4 right-4 z-20 w-9 h-9 bg-stone-900/60 hover:bg-stone-900/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Imagem em Destaque */}
        {hasImage ? (
          <div className="relative w-full h-64 sm:h-72 bg-stone-200 shrink-0">
            <Image
              src={item.image_url!}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className={`object-cover ${isSoldOut ? 'grayscale opacity-75' : ''}`}
              priority
              unoptimized
            />
            {isSoldOut && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="px-3.5 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow">
                  Esgotado
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-28 bg-stone-100 flex items-center justify-center text-stone-400 shrink-0 border-b border-stone-200">
            <UtensilsCrossed className="w-10 h-10 opacity-40" />
          </div>
        )}

        {/* Conteúdo com scroll */}
        <div className="p-6 overflow-y-auto space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="item-modal-title" className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                {item.name}
              </h2>
              {isSoldOut && !hasImage && (
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                  Esgotado no momento
                </span>
              )}
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-stone-900 whitespace-nowrap tabular-nums">
              {formatCurrency(item.price)}
            </span>
          </div>

          {item.description ? (
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          ) : (
            <p className="text-xs text-stone-400 italic">Sem descrição adicional cadastrada.</p>
          )}
        </div>

        {/* Rodapé com botões de ação */}
        <div className="p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          {whatsappOrderUrl && (
            <a
              href={whatsappOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#075E54] hover:bg-[#128C7E] text-white text-sm font-semibold rounded-xl shadow-md transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Pedir no WhatsApp</span>
            </a>
          )}
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-sm font-medium rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
