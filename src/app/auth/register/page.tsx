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
  restaurantName: z.string().min(2, 'Nome do restaurante deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [emailSent, setEmailSent] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const restaurantNameValue = watch('restaurantName') || ''

  async function onSubmit(data: RegisterForm) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          restaurant_name: data.restaurantName,
        },
      },
    })

    if (authError) {
      let friendlyMessage = 'Erro ao criar conta. Tente novamente.'
      const raw = (authError.message || '').toLowerCase()

      if (raw.includes('already registered') || raw.includes('user already exists')) {
        friendlyMessage = 'Este e-mail já está cadastrado. Faça login na sua conta.'
      } else if (raw.includes('rate limit') || raw.includes('over_email_send_rate_limit')) {
        friendlyMessage = 'Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.'
      } else if (raw.includes('password') && raw.includes('least 6')) {
        friendlyMessage = 'A senha precisa ter pelo menos 6 caracteres.'
      } else if (raw.includes('database error')) {
        friendlyMessage = 'Erro de conexão com o banco de dados. Por favor, tente novamente em instantes.'
      }

      toast.error(friendlyMessage)
      return
    }

    if (!authData.user) {
      toast.error('Erro ao registrar usuário')
      return
    }

    // Se não há sessão ativa, significa que o Supabase exige confirmação por e-mail
    if (!authData.session) {
      setEmailSent(data.email)
      toast.success('Conta criada! Verifique seu e-mail para ativar.')
      return
    }

    toast.success('Conta criada com 7 dias grátis! Seja bem-vindo.')
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex items-center justify-center px-4 py-8 sm:py-12 font-sans selection:bg-orange-100 selection:text-orange-950">
      <div className="w-full max-w-md animate-slide-up">
        {/* Topo / Voltar */}
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition-colors text-xs font-semibold mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao início
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-stone-950">CardápioQR</span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">Crie seu cardápio digital em minutos</p>
        </div>

        <div className="bg-white border border-stone-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
          {emailSent ? (
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 bg-orange-100 text-orange-800 rounded-2xl flex items-center justify-center mx-auto border border-orange-200 shrink-0">
                <Mail className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">Confirme seu e-mail</h2>
              <p className="text-stone-600 text-sm leading-relaxed px-1">
                Enviamos o link de confirmação para <strong className="text-stone-950 break-all">{emailSent}</strong>.
              </p>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-left text-xs text-stone-600 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Abra a caixa de entrada (verifique também a pasta de Spam).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Clique no link para ativar seu cardápio com 7 dias grátis.</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/auth/login"
                  className="btn-primary w-full justify-center py-3 text-sm"
                >
                  Ir para o Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5 gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">Criar minha conta</h1>
                <span className="text-[11px] bg-orange-100 text-orange-800 border border-orange-200/80 px-2.5 py-0.5 rounded-full font-bold shrink-0">
                  7 dias grátis
                </span>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="restaurantName" className="input-label">Nome do restaurante ou bar</label>
                  <input
                    id="restaurantName"
                    type="text"
                    placeholder="Ex: Bistrô da Esquina"
                    className="input-field"
                    {...register('restaurantName')}
                  />
                  {errors.restaurantName ? (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.restaurantName.message}</p>
                  ) : restaurantNameValue.length >= 2 ? (
                    <div className="mt-2 p-2.5 rounded-xl bg-orange-50/60 border border-orange-100 text-xs text-stone-600">
                      <span className="text-[11px] text-stone-500 block mb-0.5">Seu link público será:</span>
                      <span className="text-orange-800 font-mono font-semibold break-all text-xs block">
                        {process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '') || 'cardapioqr.com'}/{slugify(restaurantNameValue)}-[código]
                      </span>
                      <span className="block text-[10px] text-stone-400 mt-1">Você poderá personalizar o link depois nas configurações.</span>
                    </div>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="email" className="input-label">Seu e-mail</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="contato@restaurante.com"
                    className="input-field"
                    autoComplete="email"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="input-label">Senha de acesso</label>
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

                <p className="text-[11px] text-stone-500 text-center px-2">
                  Ao criar sua conta, você concorda com nossos{' '}
                  <Link href="/termos" className="text-stone-700 underline hover:text-stone-950">
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link href="/privacidade" className="text-stone-700 underline hover:text-stone-950">
                    Política de Privacidade
                  </Link>.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full justify-center py-3 text-sm mt-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando seu cardápio...
                    </>
                  ) : (
                    'Começar 7 dias grátis'
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-stone-500 mt-6 pt-5 border-t border-stone-100">
                Já possui uma conta?{' '}
                <Link href="/auth/login" className="text-orange-700 hover:text-orange-800 font-semibold transition-colors">
                  Fazer login
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Rodapé Institucional e Legal */}
        <div className="mt-8 text-center text-xs text-stone-400 space-y-2">
          <div className="flex items-center justify-center gap-4">
            <Link href="/termos" className="hover:text-stone-600 transition-colors underline">
              Termos de Uso
            </Link>
            <span>•</span>
            <Link href="/privacidade" className="hover:text-stone-600 transition-colors underline">
              Política de Privacidade
            </Link>
          </div>
          <p className="text-[11px] text-stone-400">
            CardápioQR Tecnologia • Plataforma segura com criptografia ponta a ponta
          </p>
        </div>
      </div>
    </div>
  )
}
