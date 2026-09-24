import Link from 'next/link'
import { QrCode, ArrowLeft, PlusCircle } from 'lucide-react'

export default function MenuNotFound() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex items-center justify-center p-4 font-sans selection:bg-orange-100 selection:text-orange-950">
      <div className="max-w-md w-full text-center space-y-6 animate-slide-up bg-white border border-stone-200/90 rounded-3xl p-8 sm:p-10 shadow-sm">
        <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto border border-stone-200">
          <QrCode className="w-8 h-8 text-stone-700" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200/60">
            Erro 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-950 tracking-tight mt-3">
            Cardápio não encontrado
          </h1>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            O endereço que você acessou não corresponde a nenhum estabelecimento cadastrado ou o link foi modificado pelo restaurante.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Página Inicial
          </Link>

          <Link
            href="/auth/register"
            className="w-full sm:w-auto btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            Criar meu Cardápio
          </Link>
        </div>
      </div>
    </div>
  )
}
