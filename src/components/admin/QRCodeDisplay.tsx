'use client'

import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface QRCodeDisplayProps {
  url: string
  restaurantName: string
}

export default function QRCodeDisplay({ url, restaurantName }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  async function handleCopyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownloadQR() {
    const svgElement = qrRef.current?.querySelector('svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    img.onload = () => {
      canvas.width = 400
      canvas.height = 400
      ctx!.fillStyle = '#ffffff'
      ctx!.fillRect(0, 0, 400, 400)
      ctx!.drawImage(img, 0, 0, 400, 400)

      const pngUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = pngUrl
      link.download = `qrcode-${restaurantName.replace(/\s+/g, '-').toLowerCase()}.png`
      link.click()

      URL.revokeObjectURL(svgUrl)
      toast.success('QR Code baixado!')
    }

    img.src = svgUrl
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* QR Code */}
      <div
        ref={qrRef}
        className="p-4 bg-white rounded-2xl shadow-2xl"
      >
        <QRCodeSVG
          value={url}
          size={180}
          bgColor="#ffffff"
          fgColor="#0f172a"
          level="H"
          includeMargin={false}
        />
      </div>

      {/* Link */}
      <div className="w-full">
        <p className="text-xs text-gray-500 mb-2 text-center">Link do cardápio</p>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
          <span className="flex-1 text-xs text-gray-300 truncate font-mono">{url}</span>
          <button
            onClick={handleCopyLink}
            className="text-gray-400 hover:text-brand-400 transition-colors flex-shrink-0"
            title="Copiar link"
          >
            {copied ? <Check className="w-4 h-4 text-brand-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Botão download */}
      <button
        onClick={handleDownloadQR}
        className="btn-primary w-full justify-center"
      >
        <Download className="w-4 h-4" />
        Baixar QR Code (PNG)
      </button>
    </div>
  )
}
