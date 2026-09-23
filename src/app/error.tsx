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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-gray-900/60 border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Ops! Algo deu errado</h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
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
