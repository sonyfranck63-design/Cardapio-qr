'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { QrCode, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error('E-mail ou senha incorretos')
      return
    }

    toast.success('Bem-vindo de volta!')
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex items-center justify-center px-4 py-12 font-sans selection:bg-orange-100 selection:text-orange-950">
      <div className="w-full max-w-md animate-slide-up">
        {/* Topo / Voltar */}
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition-colors text-xs font-semibold mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao início
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-stone-950">CardápioQR</span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">Acesse o painel de gestão do seu estabelecimento</p>
        </div>

        {/* Card de Formulário */}
        <div className="bg-white border border-stone-200/90 rounded-3xl p-7 sm:p-9 shadow-sm">
          <h1 className="text-xl font-bold text-stone-900 mb-6 tracking-tight">Entrar na conta</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="input-label">E-mail de acesso</label>
              <input
                id="email"
                type="email"
                placeholder="seu@restaurante.com"
                className="input-field"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="input-label">Senha</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field pr-11"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center py-3 text-sm mt-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Acessando conta...
                </>
              ) : (
                'Entrar no painel'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-stone-500 mt-6 pt-5 border-t border-stone-100">
            Ainda não tem conta?{' '}
            <Link href="/auth/register" className="text-orange-700 hover:text-orange-800 font-semibold transition-colors">
              Criar conta e testar 7 dias grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
