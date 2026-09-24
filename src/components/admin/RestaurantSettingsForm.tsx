'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  Loader2,
  Upload,
  X,
  Save,
  Phone,
  Link as LinkIcon,
  Trash2,
  AlertTriangle,
  Palette,
  Type,
  ImageIcon,
  MapPin,
  Clock,
  Instagram,
} from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Restaurant } from '@/types/database'
import { slugify } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { revalidateMenuAction } from '@/app/actions/revalidate'
import { RESERVED_SLUGS } from '@/lib/plans'
import { compressImage } from '@/lib/image-compress'
import {
  THEME_FONTS,
  PRESET_THEME_COLORS,
  ThemeFontType,
  getContrastColor,
} from '@/lib/theme'

const restaurantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  slug: z
    .string()
    .min(3, 'Slug deve ter no mínimo 3 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use apenas letras minúsculas e números separados por hífen simples')
    .refine(
      (slug) => !RESERVED_SLUGS.includes(slug.toLowerCase() as any),
      'Este slug é reservado pelo sistema e não pode ser utilizado'
    ),
  whatsapp: z
    .string()
    .optional()
    .refine(v => !v || /^\d{10,15}$/.test(v.replace(/\D/g, '')), 'Número inválido'),
  whatsapp_message: z.string().optional(),
  theme_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida (use formato #HEX de 6 dígitos)')
    .default('#1c1917'),
  theme_font: z.enum(['classico', 'moderno', 'boteco']).default('moderno'),
  tagline: z.string().max(120, 'Máximo de 120 caracteres').optional(),
  address: z.string().max(200, 'Máximo de 200 caracteres').optional(),
  opening_hours: z.string().max(100, 'Máximo de 100 caracteres').optional(),
  instagram: z.string().max(50, 'Máximo de 50 caracteres').optional(),
  show_sold_out: z.boolean().default(false),
})

type RestaurantForm = z.infer<typeof restaurantSchema>

interface RestaurantSettingsFormProps {
  restaurant: Restaurant
}

export default function RestaurantSettingsForm({ restaurant }: RestaurantSettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [logoUrl, setLogoUrl] = useState<string | null>(restaurant.logo_url)
  const [coverUrl, setCoverUrl] = useState<string | null>(restaurant.cover_url)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RestaurantForm>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: restaurant.name,
      slug: restaurant.slug,
      whatsapp: restaurant.whatsapp ?? '',
      whatsapp_message: restaurant.whatsapp_message ?? 'Olá! Gostaria de fazer um pedido.',
      theme_color: restaurant.theme_color ?? '#1c1917',
      theme_font: (restaurant.theme_font as ThemeFontType) || 'moderno',
      tagline: restaurant.tagline ?? '',
      address: restaurant.address ?? '',
      opening_hours: restaurant.opening_hours ?? '',
      instagram: restaurant.instagram ?? '',
      show_sold_out: restaurant.show_sold_out ?? false,
    },
  })

  const nameValue = watch('name')
  const themeColorValue = watch('theme_color')
  const themeFontValue = watch('theme_font')

  function handleAutoSlug() {
    if (nameValue) {
      setValue('slug', slugify(nameValue))
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 })

      const formData = new FormData()
      formData.append('file', compressed)
      formData.append('restaurantId', restaurant.id)
      formData.append('type', 'logo')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.publicUrl) {
        throw new Error(data.error || 'Erro ao fazer upload da logo')
      }

      const urlWithCache = `${data.publicUrl}?t=${Date.now()}`
      setLogoUrl(urlWithCache)

      await supabase.from('restaurants').update({ logo_url: data.publicUrl }).eq('id', restaurant.id)
      await revalidateMenuAction({ slug: restaurant.slug, restaurantId: restaurant.id })
      toast.success('Logo atualizada com sucesso!')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao fazer upload da logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    try {
      const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 600, quality: 0.85 })

      const formData = new FormData()
      formData.append('file', compressed)
      formData.append('restaurantId', restaurant.id)
      formData.append('type', 'cover')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.publicUrl) {
        throw new Error(data.error || 'Erro ao fazer upload da imagem de capa')
      }

      const urlWithCache = `${data.publicUrl}?t=${Date.now()}`
      setCoverUrl(urlWithCache)

      await supabase.from('restaurants').update({ cover_url: data.publicUrl }).eq('id', restaurant.id)
      await revalidateMenuAction({ slug: restaurant.slug, restaurantId: restaurant.id })
      toast.success('Capa atualizada com sucesso!')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao fazer upload da imagem de capa')
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'EXCLUIR') return

    try {
      setIsDeletingAccount(true)
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Erro ao excluir conta')
        setIsDeletingAccount(false)
        return
      }

      toast.success('Sua conta e dados foram excluídos com sucesso.')
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch {
      toast.error('Ocorreu um erro ao tentar excluir a conta')
      setIsDeletingAccount(false)
    }
  }

  async function onSubmit(data: RestaurantForm) {
    const { data: existing } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', restaurant.id)
      .maybeSingle()

    if (existing) {
      toast.error('Esse slug já está em uso por outro restaurante. Escolha outro.')
      return
    }

    const { error } = await supabase
      .from('restaurants')
      .update({
        name: data.name,
        slug: data.slug,
        whatsapp: data.whatsapp || null,
        whatsapp_message: data.whatsapp_message || null,
        theme_color: data.theme_color,
        theme_font: data.theme_font,
        tagline: data.tagline || null,
        address: data.address || null,
        opening_hours: data.opening_hours || null,
        instagram: data.instagram ? data.instagram.replace(/^@/, '') : null,
        show_sold_out: data.show_sold_out,
      })
      .eq('id', restaurant.id)

    if (error) {
      toast.error('Erro ao salvar configurações')
      return
    }

    await revalidateMenuAction({ slug: data.slug, restaurantId: restaurant.id })
    if (data.slug !== restaurant.slug) {
      await revalidateMenuAction({ slug: restaurant.slug })
    }

    toast.success('Configurações salvas!')
    router.refresh()
  }

  const contrastColor = getContrastColor(themeColorValue)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 font-sans text-stone-900">
      {/* 1. Imagens: Logo e Capa */}
      <div className="admin-card p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-orange-700" />
            Identidade Visual (Logo e Capa)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Imagens que aparecerão no cabeçalho do seu cardápio digital.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Logo */}
          <div className="space-y-3">
            <label className="input-label">Logo do restaurante (1:1)</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="Logo"
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  <Upload className="w-6 h-6 text-stone-400" />
                )}
              </div>
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="btn-secondary text-xs px-3.5 py-2"
                >
                  {uploadingLogo ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                  ) : (
                    <><Upload className="w-3.5 h-3.5" /> Escolher logo</>
                  )}
                </button>
                <p className="text-[11px] text-stone-500 mt-1.5">Recomendado: 400x400px</p>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.from('restaurants').update({ logo_url: null }).eq('id', restaurant.id)
                      setLogoUrl(null)
                      toast.success('Logo removida')
                    }}
                    className="text-xs text-red-600 hover:text-red-800 mt-1.5 flex items-center gap-1 font-medium transition-colors"
                  >
                    <X className="w-3 h-3" /> Remover logo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Imagem de Capa */}
          <div className="space-y-3">
            <label className="input-label">Imagem de capa / Banner (Panorâmico)</label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-20 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt="Capa"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-stone-400" />
                )}
              </div>
              <div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="btn-secondary text-xs px-3.5 py-2"
                >
                  {uploadingCover ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                  ) : (
                    <><Upload className="w-3.5 h-3.5" /> Escolher capa</>
                  )}
                </button>
                <p className="text-[11px] text-stone-500 mt-1.5">Recomendado: 1200x500px</p>
                {coverUrl && (
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.from('restaurants').update({ cover_url: null }).eq('id', restaurant.id)
                      setCoverUrl(null)
                      toast.success('Capa removida')
                    }}
                    className="text-xs text-red-600 hover:text-red-800 mt-1.5 flex items-center gap-1 font-medium transition-colors"
                  >
                    <X className="w-3 h-3" /> Remover capa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Estilo Visual: Tipografia e Cores */}
      <div className="admin-card p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Palette className="w-4 h-4 text-orange-700" />
            Tema & Estilo Visual
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Personalize a estética do cardápio para combinar com o estilo do seu bar ou restaurante.
          </p>
        </div>

        {/* Seleção de Tipografia */}
        <div className="space-y-3">
          <label className="input-label flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-stone-500" />
            Família Tipográfica
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(THEME_FONTS) as ThemeFontType[]).map((fontKey) => {
              const option = THEME_FONTS[fontKey]
              const isSelected = themeFontValue === fontKey
              return (
                <button
                  key={fontKey}
                  type="button"
                  onClick={() => setValue('theme_font', fontKey)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-orange-600 bg-orange-50/80 ring-1 ring-orange-600'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-sm font-bold text-stone-900 mb-0.5">{option.name}</div>
                  <div className="text-xs text-stone-500 mb-2">{option.description}</div>
                  <div className={`text-xs text-orange-800 font-medium ${option.fontClass}`}>
                    &ldquo;{option.sampleText}&rdquo;
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Seleção de Cor Tema */}
        <div className="space-y-3">
          <label className="input-label">Cor de Fundo do Cabeçalho</label>
          <div className="flex flex-wrap items-center gap-2.5">
            {PRESET_THEME_COLORS.map(preset => (
              <button
                key={preset.hex}
                type="button"
                onClick={() => setValue('theme_color', preset.hex)}
                className={`w-9 h-9 rounded-xl border-2 transition-transform ${preset.bgClass} ${
                  themeColorValue.toLowerCase() === preset.hex.toLowerCase()
                    ? 'border-stone-900 scale-110 shadow-sm'
                    : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                }`}
                title={preset.name}
              />
            ))}

            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-stone-200">
              <input
                type="color"
                id="theme_color_picker"
                value={themeColorValue}
                onChange={e => setValue('theme_color', e.target.value)}
                className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono font-medium text-stone-600">{themeColorValue}</span>
            </div>
          </div>

          {/* Prévia de contraste */}
          <div
            className="p-3.5 rounded-xl border flex items-center justify-between mt-2 shadow-xs"
            style={{ backgroundColor: themeColorValue, color: contrastColor }}
          >
            <span className="text-xs font-bold">Prévia de Legibilidade do Cabeçalho</span>
            <span className="text-[11px] font-mono opacity-90 font-medium">
              Texto: {contrastColor === '#ffffff' ? 'Branco' : 'Escuro'} (WCAG AA Garantido)
            </span>
          </div>
        </div>

        {/* Toggle de Esgotados */}
        <div className="pt-2 border-t border-stone-200">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('show_sold_out')}
              className="mt-1 w-4 h-4 rounded border-stone-300 text-orange-700 focus:ring-orange-600"
            />
            <div>
              <span className="text-sm font-semibold text-stone-900">
                Exibir itens esgotados no cardápio
              </span>
              <p className="text-xs text-stone-500 mt-0.5">
                Quando ativado, pratos desativados continuam visíveis com o selo &ldquo;Esgotado&rdquo;. Quando desativado, eles somem do cardápio automaticamente.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 3. Informações da Casa */}
      <div className="admin-card p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-stone-900">Informações Principais</h2>
          <p className="text-xs text-stone-500 mt-0.5">Dados cadastrais exibidos ao cliente.</p>
        </div>

        <div>
          <label htmlFor="name" className="input-label">Nome do restaurante</label>
          <input id="name" type="text" className="input-field" {...register('name')} />
          {errors.name && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="tagline" className="input-label">Slogan / Frase Curta</label>
          <input
            id="tagline"
            type="text"
            placeholder="Ex: Culinária artesanal, cortes nobres e cerveja gelada"
            className="input-field"
            {...register('tagline')}
          />
          {errors.tagline && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.tagline.message}</p>}
          <p className="text-xs text-stone-500 mt-1">Exibido logo abaixo do nome do restaurante no cardápio.</p>
        </div>

        <div>
          <label htmlFor="slug" className="input-label flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-stone-500" />
            Slug (URL única do cardápio)
          </label>
          <div className="flex gap-2">
            <input id="slug" type="text" className="input-field" {...register('slug')} />
            <button
              type="button"
              onClick={handleAutoSlug}
              className="btn-secondary text-xs px-3.5 whitespace-nowrap shrink-0"
            >
              Gerar
            </button>
          </div>
          {errors.slug ? (
            <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.slug.message}</p>
          ) : (
            <p className="mt-1.5 text-xs text-stone-500">
              cardapioqr.com/<span className="text-orange-700 font-bold">{watch('slug')}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="opening_hours" className="input-label flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              Horário de Funcionamento
            </label>
            <input
              id="opening_hours"
              type="text"
              placeholder="Ex: Ter a Dom: 18h às 23h30"
              className="input-field"
              {...register('opening_hours')}
            />
            {errors.opening_hours && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.opening_hours.message}</p>}
          </div>

          <div>
            <label htmlFor="instagram" className="input-label flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-stone-500" />
              Perfil do Instagram
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm text-stone-400 font-medium">@</span>
              <input
                id="instagram"
                type="text"
                placeholder="seu_restaurante"
                className="input-field pl-8"
                {...register('instagram')}
              />
            </div>
            {errors.instagram && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.instagram.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="address" className="input-label flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-stone-500" />
            Endereço Completo
          </label>
          <input
            id="address"
            type="text"
            placeholder="Ex: Rua dos Pinheiros, 450 - Pinheiros, São Paulo"
            className="input-field"
            {...register('address')}
          />
          {errors.address && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.address.message}</p>}
          <p className="text-xs text-stone-500 mt-1">Cria automaticamente um link direto que abre no Google Maps.</p>
        </div>
      </div>

      {/* 4. WhatsApp */}
      <div className="admin-card p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-700" />
            Atendimento & Pedidos no WhatsApp
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure para onde o botão fixo do cardápio direciona os clientes.
          </p>
        </div>

        <div>
          <label htmlFor="whatsapp" className="input-label">Número do WhatsApp Comercial</label>
          <input
            id="whatsapp"
            type="tel"
            placeholder="55119XXXXXXXX"
            className="input-field"
            {...register('whatsapp')}
          />
          {errors.whatsapp && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.whatsapp.message}</p>}
          <p className="mt-1.5 text-xs text-stone-500">Formato: 5511999998888 (com código 55 do Brasil + DDD + 9 dígitos)</p>
        </div>

        <div>
          <label htmlFor="whatsapp_message" className="input-label">Mensagem Padrão de Início de Conversa</label>
          <textarea
            id="whatsapp_message"
            rows={2}
            placeholder="Olá! Gostaria de fazer um pedido."
            className="input-field resize-none"
            {...register('whatsapp_message')}
          />
          <p className="mt-1.5 text-xs text-stone-500">Mensagem inicial que o cliente enviará ao clicar no botão do WhatsApp</p>
        </div>
      </div>

      {/* Botão de Salvar */}
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto px-7 py-3 text-sm">
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Salvando configurações...</>
        ) : (
          <><Save className="w-4 h-4" /> Salvar todas as configurações</>
        )}
      </button>

      {/* Zona de Perigo */}
      <div className="border border-red-200 bg-red-50/70 rounded-2xl p-6 space-y-4 mt-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-red-950">Zona de Perigo</h2>
            <p className="text-xs text-red-800">Ações irreversíveis para a sua conta e restaurante</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-red-900 leading-relaxed">
          Ao excluir sua conta, todos os dados do seu restaurante (pratos, categorias, configurações e imagens) serão{' '}
          <strong className="text-red-950 font-bold">permanentemente removidos</strong> do banco de dados. Esta ação não poderá ser desfeita.
        </p>

        {!showDeleteConfirm ? (
          <div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold text-xs rounded-xl transition-all flex items-center gap-2 border border-red-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir minha conta e restaurante
            </button>
          </div>
        ) : (
          <div className="p-4 bg-white border border-red-300 rounded-xl space-y-3">
            <p className="text-xs sm:text-sm text-red-950 font-semibold">
              Tem certeza absoluta? Para confirmar, digite <span className="font-bold underline text-red-700">EXCLUIR</span> no campo abaixo:
            </p>
            <input
              type="text"
              placeholder="Digite EXCLUIR"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="input-field text-sm border-red-300 focus:border-red-600"
            />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              <button
                type="button"
                disabled={deleteConfirmText !== 'EXCLUIR' || isDeletingAccount}
                onClick={handleDeleteAccount}
                className="px-4 py-2.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isDeletingAccount ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Excluindo...</>
                ) : (
                  <><Trash2 className="w-3.5 h-3.5" /> Confirmar Exclusão Definitiva</>
                )}
              </button>
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-all flex items-center justify-center"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
