'use client'

import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Copy, Check, Printer, FileCode, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import TableTentModal from './TableTentModal'

interface QRCodeDisplayProps {
  url: string
  restaurantName: string
}

export default function QRCodeDisplay({ url, restaurantName }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [isTableTentOpen, setIsTableTentOpen] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  async function handleCopyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  // Download em SVG Vetorial Puro
  function handleDownloadSVG() {
    const svgElement = qrRef.current?.querySelector('svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    const link = document.createElement('a')
    link.href = svgUrl
    link.download = `qrcode-${restaurantName.replace(/\s+/g, '-').toLowerCase()}.svg`
    link.click()

    URL.revokeObjectURL(svgUrl)
    toast.success('QR Code (SVG) baixado!')
  }

  // Download em PNG de Alta Resolução (1200x1200px para impressão gráfica)
  function handleDownloadPNG() {
    const svgElement = qrRef.current?.querySelector('svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    img.onload = () => {
      // Resolução de 1200x1200px com margem elegante
      const size = 1200
      const padding = 120
      const qrSize = size - padding * 2

      canvas.width = size
      canvas.height = size

      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
        ctx.drawImage(img, padding, padding, qrSize, qrSize)

        const pngUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = pngUrl
        link.download = `qrcode-hd-${restaurantName.replace(/\s+/g, '-').toLowerCase()}.png`
        link.click()
      }

      URL.revokeObjectURL(svgUrl)
      toast.success('QR Code HD (1200px) baixado!')
    }

    img.src = svgUrl
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* QR Code */}
      <div
        ref={qrRef}
        className="p-5 bg-white rounded-2xl shadow-2xl border border-gray-100 flex items-center justify-center"
      >
        <QRCodeSVG
          value={url}
          size={190}
          bgColor="#ffffff"
          fgColor="#0f172a"
          level="H"
          includeMargin={false}
        />
      </div>

      {/* Link do Cardápio */}
      <div className="w-full">
        <p className="text-xs text-stone-500 mb-2 text-center font-medium">Link público do cardápio</p>
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5">
          <span className="flex-1 text-xs text-stone-700 truncate font-mono">{url}</span>
          <button
            onClick={handleCopyLink}
            className="text-stone-400 hover:text-brand-600 transition-colors flex-shrink-0 p-1"
            title="Copiar link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Ações de Download e Plaquinha de Mesa */}
      <div className="w-full space-y-2.5">
        <button
          onClick={() => setIsTableTentOpen(true)}
          className="btn-primary w-full justify-center py-3 text-sm font-semibold flex items-center gap-2 shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Imprimir Placa de Mesa (A5/A6)
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownloadPNG}
            className="px-2.5 sm:px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 border border-stone-200 text-xs font-semibold text-stone-700 flex items-center justify-center gap-1.5 transition-colors text-center"
            title="Download PNG em Alta Resolução (1200x1200px)"
          >
            <ImageIcon className="w-3.5 h-3.5 text-orange-700 shrink-0" />
            <span className="truncate">PNG (1200px)</span>
          </button>

          <button
            onClick={handleDownloadSVG}
            className="px-2.5 sm:px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 border border-stone-200 text-xs font-semibold text-stone-700 flex items-center justify-center gap-1.5 transition-colors text-center"
            title="Download Vetorial SVG"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">SVG Vetor</span>
          </button>
        </div>
      </div>

      {/* Modal de Impressão */}
      <TableTentModal
        url={url}
        restaurantName={restaurantName}
        isOpen={isTableTentOpen}
        onClose={() => setIsTableTentOpen(false)}
      />
    </div>
  )
}
