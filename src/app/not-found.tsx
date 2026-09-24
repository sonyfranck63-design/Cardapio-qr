import Link from 'next/link'
import { QrCode, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex items-center justify-center px-4 text-center font-sans selection:bg-orange-100 selection:text-orange-950">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-stone-200/90 shadow-sm animate-fade-in">
        <div className="w-16 h-16 bg-stone-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <QrCode className="w-8 h-8" />
        </div>
        <h1 className="text-5xl font-black text-stone-950 mb-2 tracking-tight">404</h1>
        <p className="text-lg font-bold text-stone-900 mb-2">Cardápio não encontrado</p>
        <p className="text-stone-600 mb-8 max-w-sm mx-auto text-xs sm:text-sm leading-relaxed">
          O link que você acessou não existe ou o restaurante pode ter alterado seu endereço de cardápio.
        </p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
