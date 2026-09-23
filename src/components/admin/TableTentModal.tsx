'use client'

import { useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Printer, Sparkles } from 'lucide-react'

interface TableTentModalProps {
  url: string
  restaurantName: string
  isOpen: boolean
  onClose: () => void
}

export default function TableTentModal({
  url,
  restaurantName,
  isOpen,
  onClose,
}: TableTentModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handlePrint() {
    window.print()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white print:static"
      role="dialog"
      aria-modal="true"
    >
      {/* Botões de ação no topo (ocultos na impressão) */}
      <div className="absolute top-4 right-4 flex items-center gap-3 print:hidden z-20">
        <button
          onClick={handlePrint}
          className="btn-primary py-2 px-4 shadow-lg flex items-center gap-2 text-sm font-semibold"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Salvar PDF
        </button>
        <button
          onClick={onClose}
          aria-label="Fechar prévia"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Container da Placa de Mesa */}
      <div
        ref={modalRef}
        id="printable-table-tent"
        className="w-full max-w-sm bg-white text-gray-900 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center text-center border-4 border-gray-900 print:shadow-none print:border-4 print:border-gray-900 print:max-w-none print:w-[148mm] print:h-[210mm] print:rounded-none print:m-auto print:justify-center"
      >
        {/* Cabeçalho da Placa */}
        <div className="space-y-1 mb-6">
          <p className="text-xs uppercase tracking-widest font-extrabold text-orange-600">Cardápio Digital</p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
            {restaurantName}
          </h2>
        </div>

        {/* QR Code de Alta Fidelidade */}
        <div className="p-5 bg-white border-2 border-gray-900 rounded-2xl shadow-inner my-2 flex items-center justify-center">
          <QRCodeSVG
            value={url}
            size={220}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Instruções aos Clientes */}
        <div className="space-y-2 mt-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Sem baixar aplicativo
          </div>
          <p className="text-lg font-bold text-gray-900">
            Aponte a câmera do seu celular para ver o cardápio
          </p>
          <p className="text-xs text-gray-500 font-mono">
            {url.replace('https://', '').replace('http://', '')}
          </p>
        </div>

        {/* Rodapé sutil */}
        <div className="mt-8 pt-4 border-t border-gray-200 w-full text-[10px] text-gray-400 font-medium">
          Mesa • CardápioQR
        </div>
      </div>
    </div>
  )
}
