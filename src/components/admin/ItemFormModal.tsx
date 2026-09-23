'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { X, Upload, Loader2, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { MenuItem, Category } from '@/types/database'

const itemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.string().min(1, 'Preço é obrigatório').refine(v => !isNaN(Number(v.replace(',', '.'))) && Number(v.replace(',', '.')) >= 0, 'Preço inválido'),
  category_id: z.string().min(1, 'Selecione uma categoria'),
  is_active: z.boolean(),
})

type ItemFormData = z.infer<typeof itemSchema>

interface ItemFormModalProps {
  restaurantId: string
  categories: Category[]
  item?: MenuItem | null
  onClose: () => void
  onSaved: (item: MenuItem) => void
}

export default function ItemFormModal({
  restaurantId, categories, item, onClose, onSaved
}: ItemFormModalProps) {
  const supabase = createClient()
  const [imageUrl, setImageUrl] = useState<string | null>(item?.image_url ?? null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!item

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name ?? '',
      description: item?.description ?? '',
      price: item?.price?.toString().replace('.', ',') ?? '',
      category_id: item?.category_id ?? '',
      is_active: item?.is_active ?? true,
    },
  })

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Formato inválido. Use JPG, PNG, WEBP ou GIF.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB')
      return
    }

    setUploadingImage(true)
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const fileName = `${restaurantId}/items/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('restaurant-assets')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      toast.error('Erro ao enviar imagem')
      setUploadingImage(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-assets')
      .getPublicUrl(fileName)

    setImageUrl(publicUrl)
    setUploadingImage(false)
    toast.success('Imagem enviada!')
  }

  async function onSubmit(data: ItemFormData) {
    const price = parseFloat(data.price.replace(',', '.'))

    const payload = {
      restaurant_id: restaurantId,
      category_id: data.category_id,
      name: data.name,
      description: data.description || null,
      price,
      image_url: imageUrl,
      is_active: data.is_active,
    }

    let result
    if (isEditing) {
      const { data: updated, error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', item!.id)
        .select()
        .single()

      if (error) { toast.error('Erro ao salvar item'); return }
      result = updated
    } else {
      const { data: created, error } = await supabase
        .from('menu_items')
        .insert({ ...payload, order: 0 })
        .select()
        .single()

      if (error) { toast.error('Erro ao criar item'); return }
      result = created
    }

    toast.success(isEditing ? 'Item atualizado!' : 'Item criado!')
    onSaved(result)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-gray-900 border border-gray-800 rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? 'Editar item' : 'Novo item'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="p-5 space-y-4">
            {/* Image upload */}
            <div>
              <label className="input-label">Foto do item</label>
              <div
                className="relative w-full h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:border-brand-500/40 hover:bg-brand-500/5 transition-all overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
                    <span className="text-sm">Enviando...</span>
                  </div>
                ) : imageUrl ? (
                  <>
                    <Image src={imageUrl} alt="Preview" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <ImageIcon className="w-10 h-10" />
                    <span className="text-sm">Clique para adicionar foto</span>
                    <span className="text-xs text-gray-600">JPG, PNG, WebP — Máx. 5MB</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  className="text-xs text-red-400 hover:text-red-300 mt-1.5 flex items-center gap-1 transition-colors"
                >
                  <X className="w-3 h-3" /> Remover foto
                </button>
              )}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="item-name" className="input-label">Nome do item *</label>
              <input id="item-name" type="text" placeholder="Ex: X-Burguer Especial" className="input-field" {...register('name')} />
              {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="item-description" className="input-label">Descrição</label>
              <textarea
                id="item-description"
                rows={2}
                placeholder="Ingredientes, observações..."
                className="input-field resize-none"
                {...register('description')}
              />
            </div>

            {/* Price + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="item-price" className="input-label">Preço (R$) *</label>
                <input
                  id="item-price"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className="input-field"
                  {...register('price')}
                />
                {errors.price && <p className="mt-1.5 text-xs text-red-400">{errors.price.message}</p>}
              </div>

              <div>
                <label htmlFor="item-category" className="input-label">Categoria *</label>
                <select id="item-category" className="input-field" {...register('category_id')}>
                  <option value="">Selecionar...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category_id && <p className="mt-1.5 text-xs text-red-400">{errors.category_id.message}</p>}
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <p className="text-sm font-medium text-gray-200">Item ativo</p>
                <p className="text-xs text-gray-500">Itens inativos não aparecem no cardápio</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" {...register('is_active')} />
                <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-brand-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-800 flex gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
              ) : (
                isEditing ? 'Salvar' : 'Criar item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
