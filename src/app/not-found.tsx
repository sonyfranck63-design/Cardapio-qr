import Link from 'next/link'
import { QrCode, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 text-center">
      <div className="animate-fade-in">
        <div className="w-20 h-20 bg-brand-500/15 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <QrCode className="w-10 h-10 text-brand-400" />
        </div>
        <h1 className="text-6xl font-black text-white mb-3">404</h1>
        <p className="text-xl font-semibold text-gray-300 mb-2">Cardápio não encontrado</p>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          O link que você acessou não existe ou o restaurante pode ter mudado sua URL.
        </p>
        <Link href="/" className="btn-primary inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
