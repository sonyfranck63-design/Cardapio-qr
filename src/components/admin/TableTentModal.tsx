'use client'

import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { X, Printer, Sparkles, Download } from 'lucide-react'
import toast from 'react-hot-toast'

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Gerenciamento de eventos de teclado (ESC) e classes no body para impressão isolada
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.classList.add('table-tent-modal-open')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.classList.remove('table-tent-modal-open')
      document.body.style.overflow = ''
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('table-tent-modal-open')
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Ajusta o título do documento durante a impressão para sair limpo no cabeçalho do navegador
  useEffect(() => {
    if (!isOpen) return

    const originalTitle = document.title

    function handleBeforePrint() {
      document.title = `Placa de Mesa - ${restaurantName}`
    }

    function handleAfterPrint() {
      document.title = originalTitle
    }

    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
      document.title = originalTitle
    }
  }, [isOpen, restaurantName])

  if (!isOpen || !mounted) return null

  function handlePrint() {
    window.print()
  }

  // Permite baixar a placa completa montada em PNG em alta definição (1200x1700px)
  function handleDownloadCardPNG() {
    const svgElement = modalRef.current?.querySelector('svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 1200
    const height = 1700
    canvas.width = width
    canvas.height = height

    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    // Helper para bordas arredondadas com suporte universal
    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, r)
      } else {
        ctx.rect(x, y, w, h)
      }
    }

    img.onload = () => {
      // Fundo branco
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)

      // Moldura externa da placa
      const margin = 60
      const cardW = width - margin * 2
      const cardH = height - margin * 2
      const radius = 60

      ctx.save()
      ctx.beginPath()
      drawRoundRect(margin, margin, cardW, cardH, radius)
      ctx.lineWidth = 14
      ctx.strokeStyle = '#111827'
      ctx.stroke()
      ctx.clip()

      // Header: CARDÁPIO DIGITAL
      ctx.fillStyle = '#ea580c'
      ctx.font = '900 36px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('CARDÁPIO DIGITAL', width / 2, 210)

      // Nome do Restaurante
      ctx.fillStyle = '#111827'
      let fontSize = 64
      ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`
      while (ctx.measureText(restaurantName).width > cardW - 120 && fontSize > 32) {
        fontSize -= 4
        ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`
      }
      ctx.fillText(restaurantName, width / 2, 300)

      // Moldura do QR Code
      const qrBoxSize = 720
      const qrBoxX = (width - qrBoxSize) / 2
      const qrBoxY = 370
      ctx.beginPath()
      drawRoundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 40)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.lineWidth = 6
      ctx.strokeStyle = '#111827'
      ctx.stroke()

      // Desenhar QR Code dentro da moldura
      const qrPadding = 60
      const qrDrawSize = qrBoxSize - qrPadding * 2
      ctx.drawImage(img, qrBoxX + qrPadding, qrBoxY + qrPadding, qrDrawSize, qrDrawSize)

      // Badge: SEM BAIXAR APLICATIVO
      const badgeW = 460
      const badgeH = 64
      const badgeX = (width - badgeW) / 2
      const badgeY = 1170
      ctx.beginPath()
      drawRoundRect(badgeX, badgeY, badgeW, badgeH, 32)
      ctx.fillStyle = '#fff7ed'
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = '#fed7aa'
      ctx.stroke()

      ctx.fillStyle = '#c2410c'
      ctx.font = 'bold 26px Inter, system-ui, sans-serif'
      ctx.fillText('✦ SEM BAIXAR APLICATIVO', width / 2, badgeY + 42)

      // Instrução principal
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 44px Inter, system-ui, sans-serif'
      ctx.fillText('Aponte a câmera do seu celular', width / 2, 1310)
      ctx.fillText('para ver o cardápio', width / 2, 1370)

      // Link público
      ctx.fillStyle = '#6b7280'
      ctx.font = '500 30px monospace, monospace'
      const displayUrl = url.replace('https://', '').replace('http://', '')
      ctx.fillText(displayUrl, width / 2, 1460)

      // Linha separadora
      ctx.beginPath()
      ctx.moveTo(width / 2 - 200, 1540)
      ctx.lineTo(width / 2 + 200, 1540)
      ctx.lineWidth = 2
      ctx.strokeStyle = '#e5e7eb'
      ctx.stroke()

      // Rodapé
      ctx.fillStyle = '#9ca3af'
      ctx.font = '600 24px Inter, system-ui, sans-serif'
      ctx.fillText('Mesa • CardápioQR', width / 2, 1590)

      ctx.restore()

      // Gera download do arquivo PNG
      const pngUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = pngUrl
      link.download = `placa-mesa-${restaurantName.replace(/\s+/g, '-').toLowerCase()}.png`
      link.click()
      URL.revokeObjectURL(svgUrl)
      toast.success('Imagem da placa baixada em alta resolução!')
    }

    img.src = svgUrl
  }

  const modalContent = (
    <div
      id="table-tent-portal"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:fixed print:inset-0 print:z-[99999] print:bg-white print:p-0 print:m-0 print:overflow-visible print:flex print:items-center print:justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Botões de ação no topo (ocultos na impressão e responsivos em telas pequenas) */}
      <div className="fixed top-0 inset-x-0 p-2.5 sm:p-4 flex items-center justify-end gap-2 sm:gap-3 print:hidden z-20 bg-stone-950/85 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-b border-white/10 sm:border-none">
        <button
          onClick={handlePrint}
          className="btn-primary py-2 px-3 sm:px-4 shadow-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold shrink-0"
        >
          <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Imprimir<span className="hidden sm:inline"> / Salvar PDF</span></span>
        </button>

        <button
          onClick={handleDownloadCardPNG}
          className="px-2.5 sm:px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors shadow-lg shrink-0"
          title="Baixar placa completa em imagem PNG"
        >
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Baixar<span className="hidden sm:inline"> Imagem</span></span>
        </button>

        <button
          onClick={onClose}
          aria-label="Fechar prévia"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors shrink-0"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Container da Placa de Mesa */}
      <div
        ref={modalRef}
        id="printable-table-tent"
        className="w-full max-w-sm bg-white text-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center border-4 border-gray-900 my-auto print:shadow-none print:border-4 print:border-gray-900 print:w-[126mm] print:max-w-[130mm] print:p-6 print:rounded-3xl print:m-auto print:break-inside-avoid print:page-break-inside-avoid"
      >
        {/* Cabeçalho da Placa */}
        <div className="space-y-1 mb-5">
          <p className="text-xs uppercase tracking-widest font-extrabold text-orange-600">
            Cardápio Digital
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
            {restaurantName}
          </h2>
        </div>

        {/* QR Code de Alta Fidelidade */}
        <div className="p-4 sm:p-5 bg-white border-2 border-gray-900 rounded-2xl shadow-inner my-2 flex items-center justify-center">
          <QRCodeSVG
            value={url}
            size={200}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Instruções aos Clientes */}
        <div className="space-y-2 mt-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Sem baixar aplicativo
          </div>
          <p className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
            Aponte a câmera do seu celular para ver o cardápio
          </p>
          <p className="text-xs text-gray-500 font-mono">
            {url.replace('https://', '').replace('http://', '')}
          </p>
        </div>

        {/* Rodapé sutil */}
        <div className="mt-6 pt-3 border-t border-gray-200 w-full text-[10px] text-gray-400 font-medium">
          Mesa • CardápioQR
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
