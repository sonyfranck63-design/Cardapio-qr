'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex items-center justify-center px-4 text-center font-sans">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-stone-200/90 shadow-sm">
        <div className="w-16 h-16 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-200">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-stone-950 mb-2">Ops! Algo deu errado</h1>
        <p className="text-stone-600 text-sm mb-8 leading-relaxed">
          Encontramos uma instabilidade temporária ao carregar esta página. Tente novamente ou retorne ao início.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="btn-primary justify-center py-2.5 px-5 text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
          <Link
            href="/"
            className="btn-secondary justify-center py-2.5 px-5 text-sm flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  )
}
