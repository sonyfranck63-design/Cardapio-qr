'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { QrCode, Eye, EyeOff, Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
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

  const [emailSent, setEmailSent] = useState<string | null>(null)

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
    // 1. Criar usuário no Supabase Auth com metadados do restaurante
    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/callback`

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          restaurant_name: data.restaurantName,
        },
      },
    })

    if (authError || !authData.user) {
      toast.error(authError?.message || 'Erro ao criar conta')
      return
    }

    // Se não há sessão ativa, significa que o Supabase exige confirmação por e-mail
    if (!authData.session) {
      setEmailSent(data.email)
      toast.success('Conta criada! Verifique seu e-mail para ativar.')
      return
    }

    // Sessão ativa: o trigger do banco cria o restaurante de forma atômica e segura.
    toast.success('Conta criada com 7 dias grátis! Bem-vindo 🎉')
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
          {emailSent ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center mx-auto border border-brand-500/30">
                <Mail className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">Quase lá! Confirme seu e-mail</h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Enviamos um link de confirmação para <strong className="text-white">{emailSent}</strong>.
              </p>
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-left text-xs text-gray-400 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Abra a caixa de entrada do seu e-mail (verifique também a pasta de Spam/Lixo).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Clique no link para ativar seu cardápio com 7 dias grátis.</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/auth/login"
                  className="btn-primary w-full justify-center py-3 text-base"
                >
                  Ir para a tela de Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-white">Criar conta e começar</h1>
                <span className="text-xs bg-brand-500/20 text-brand-400 border border-brand-500/30 px-2.5 py-1 rounded-full font-medium">
                  7 dias grátis
                </span>
              </div>

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
                      Seu link: <span className="text-brand-400">{process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '') || 'seudominio.com'}/{slugify(restaurantNameValue)}</span>
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
                    'Começar teste grátis de 7 dias'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Já tem conta?{' '}
                <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                  Entrar
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
