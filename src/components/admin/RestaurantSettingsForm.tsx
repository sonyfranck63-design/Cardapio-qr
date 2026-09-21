'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Loader2, Upload, X, Save, Phone, Link as LinkIcon } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Restaurant } from '@/types/database'
import { slugify } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const restaurantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  slug: z
    .string()
    .min(2, 'Slug deve ter ao menos 2 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
  whatsapp: z
    .string()
    .optional()
    .refine(v => !v || /^\d{10,15}$/.test(v.replace(/\D/g, '')), 'Número inválido'),
  whatsapp_message: z.string().optional(),
})

type RestaurantForm = z.infer<typeof restaurantSchema>

interface RestaurantSettingsFormProps {
  restaurant: Restaurant
}

export default function RestaurantSettingsForm({ restaurant }: RestaurantSettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [logoUrl, setLogoUrl] = useState<string | null>(restaurant.logo_url)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    },
  })

  const nameValue = watch('name')

  function handleAutoSlug() {
    if (nameValue) {
      setValue('slug', slugify(nameValue))
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB')
      return
    }

    setUploadingLogo(true)
    const ext = file.name.split('.').pop()
    const fileName = `${restaurant.id}/logo.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('restaurant-assets')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      toast.error('Erro ao fazer upload da logo')
      setUploadingLogo(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-assets')
      .getPublicUrl(fileName)

    // Adiciona timestamp para forçar recarregamento
    const urlWithCache = `${publicUrl}?t=${Date.now()}`
    setLogoUrl(urlWithCache)

    await supabase.from('restaurants').update({ logo_url: publicUrl }).eq('id', restaurant.id)
    toast.success('Logo atualizada!')
    setUploadingLogo(false)
  }

  async function onSubmit(data: RestaurantForm) {
    // Verificar se slug já existe (de outro restaurante)
    const { data: existing } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', data.slug)
      .neq('id', restaurant.id)
      .maybeSingle()

    if (existing) {
      toast.error('Esse slug já está em uso. Escolha outro.')
      return
    }

    const { error } = await supabase
      .from('restaurants')
      .update({
        name: data.name,
        slug: data.slug,
        whatsapp: data.whatsapp || null,
        whatsapp_message: data.whatsapp_message || null,
      })
      .eq('id', restaurant.id)

    if (error) {
      toast.error('Erro ao salvar configurações')
      return
    }

    toast.success('Configurações salvas!')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Logo */}
      <div className="admin-card p-6">
        <h2 className="text-base font-semibold text-white mb-4">Logo do restaurante</h2>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
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
              <Upload className="w-6 h-6 text-gray-500" />
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="btn-secondary text-sm"
            >
              {uploadingLogo ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
              ) : (
                <><Upload className="w-4 h-4" />Enviar logo</>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">PNG, JPG ou WebP. Máximo 2MB.</p>
            {logoUrl && (
              <button
                type="button"
                onClick={async () => {
                  await supabase.from('restaurants').update({ logo_url: null }).eq('id', restaurant.id)
                  setLogoUrl(null)
                  toast.success('Logo removida')
                }}
                className="text-xs text-red-400 hover:text-red-300 mt-1 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" /> Remover logo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Informações */}
      <div className="admin-card p-6 space-y-5">
        <h2 className="text-base font-semibold text-white">Informações</h2>

        <div>
          <label htmlFor="name" className="input-label">Nome do restaurante</label>
          <input id="name" type="text" className="input-field" {...register('name')} />
          {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="slug" className="input-label">
            <span className="flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" />
              Slug (URL única do cardápio)
            </span>
          </label>
          <div className="flex gap-2">
            <input id="slug" type="text" className="input-field" {...register('slug')} />
            <button
              type="button"
              onClick={handleAutoSlug}
              className="btn-secondary text-xs px-3 whitespace-nowrap flex-shrink-0"
            >
              Gerar
            </button>
          </div>
          {errors.slug ? (
            <p className="mt-1.5 text-xs text-red-400">{errors.slug.message}</p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-500">
              cardapioqr.com/<span className="text-brand-400">{watch('slug')}</span>
            </p>
          )}
        </div>
      </div>

      {/* WhatsApp */}
      <div className="admin-card p-6 space-y-5">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Phone className="w-4 h-4 text-green-400" />
          WhatsApp
        </h2>

        <div>
          <label htmlFor="whatsapp" className="input-label">Número do WhatsApp</label>
          <input
            id="whatsapp"
            type="tel"
            placeholder="55119XXXXXXXX (com código do país)"
            className="input-field"
            {...register('whatsapp')}
          />
          {errors.whatsapp && <p className="mt-1.5 text-xs text-red-400">{errors.whatsapp.message}</p>}
          <p className="mt-1.5 text-xs text-gray-500">Formato: 5511999999999 (55 + DDD + número)</p>
        </div>

        <div>
          <label htmlFor="whatsapp_message" className="input-label">Mensagem padrão</label>
          <textarea
            id="whatsapp_message"
            rows={3}
            placeholder="Olá! Gostaria de fazer um pedido."
            className="input-field resize-none"
            {...register('whatsapp_message')}
          />
          <p className="mt-1.5 text-xs text-gray-500">Mensagem que o cliente enviará ao clicar no botão WhatsApp</p>
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
        ) : (
          <><Save className="w-4 h-4" />Salvar configurações</>
        )}
      </button>
    </form>
  )
}
