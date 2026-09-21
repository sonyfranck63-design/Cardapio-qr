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
import { slugify } from '@/lib/utils'

const registerSchema = z.object({
  restaurantName: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const restaurantNameValue = watch('restaurantName', '')

  async function onSubmit(data: RegisterForm) {
    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError || !authData.user) {
      toast.error(authError?.message || 'Erro ao criar conta')
      return
    }

    // 2. Gerar slug único para o restaurante
    let slug = slugify(data.restaurantName)

    // Verificar se slug já existe
    const { data: existing } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    // 3. Criar registro do restaurante
    const { error: restaurantError } = await supabase.from('restaurants').insert({
      user_id: authData.user.id,
      name: data.restaurantName,
      slug,
    })

    if (restaurantError) {
      toast.error('Erro ao criar restaurante. Tente novamente.')
      return
    }

    toast.success('Conta criada! Bem-vindo ao CardápioQR 🎉')
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-brand">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">CardápioQR</span>
          </div>
          <p className="text-gray-400">Crie sua conta e comece em minutos</p>
        </div>

        <div className="glass-card p-8">
          <h1 className="text-xl font-bold text-white mb-6">Criar conta grátis</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="restaurantName" className="input-label">Nome do restaurante / bar</label>
              <input
                id="restaurantName"
                type="text"
                placeholder="Ex: Bar do João"
                className="input-field"
                {...register('restaurantName')}
              />
              {errors.restaurantName ? (
                <p className="mt-1.5 text-xs text-red-400">{errors.restaurantName.message}</p>
              ) : restaurantNameValue.length >= 2 ? (
                <p className="mt-1.5 text-xs text-gray-500">
                  Seu link: <span className="text-brand-400">cardapio.com/{slugify(restaurantNameValue)}</span>
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="email" className="input-label">E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="input-field"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="input-label">Senha</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  className="input-field pr-11"
                  autoComplete="new-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="input-label">Confirmar senha</label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita a senha"
                className="input-field"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta grátis'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{' '}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
