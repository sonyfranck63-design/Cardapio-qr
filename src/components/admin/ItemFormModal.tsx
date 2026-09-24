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
import { compressImage } from '@/lib/image-compress'

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
      category_id: item?.category_id ?? (categories[0]?.id || ''),
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
    try {
      const compressed = await compressImage(file, { maxWidth: 1000, maxHeight: 1000, quality: 0.85 })

      const formData = new FormData()
      formData.append('file', compressed)
      formData.append('restaurantId', restaurantId)
      formData.append('type', 'item')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.publicUrl) {
        throw new Error(data.error || 'Erro ao fazer upload da imagem')
      }

      setImageUrl(data.publicUrl)
      toast.success('Imagem enviada com sucesso!')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao fazer upload da imagem')
    } finally {
      setUploadingImage(false)
    }
  }

  async function onSubmit(data: ItemFormData) {
    const numericPrice = parseFloat(data.price.replace(',', '.'))

    if (isEditing && item) {
      const { data: updated, error } = await supabase
        .from('menu_items')
        .update({
          name: data.name,
          description: data.description || null,
          price: numericPrice,
          category_id: data.category_id,
          image_url: imageUrl,
          is_active: data.is_active,
        })
        .eq('id', item.id)
        .select()
        .single()

      if (error) {
        toast.error('Erro ao atualizar item')
        return
      }

      toast.success('Item atualizado com sucesso!')
      onSaved(updated)
      return
    }

    // Para novo item: busca a ordem máxima atual da categoria
    const { data: catItems } = await supabase
      .from('menu_items')
      .select('order')
      .eq('category_id', data.category_id)
      .order('order', { ascending: false })
      .limit(1)

    const nextOrder = catItems && catItems.length > 0 ? catItems[0].order + 1 : 0

    const { data: created, error } = await supabase
      .from('menu_items')
      .insert({
        restaurant_id: restaurantId,
        category_id: data.category_id,
        name: data.name,
        description: data.description || null,
        price: numericPrice,
        image_url: imageUrl,
        is_active: data.is_active,
        order: nextOrder,
      })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao criar item')
      return
    }

    toast.success('Item criado com sucesso!')
    onSaved(created)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans text-stone-900"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-white border border-stone-200 rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 shrink-0">
          <h2 className="text-lg font-bold text-stone-900">
            {isEditing ? 'Editar Prato / Item' : 'Novo Prato ou Bebida'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="p-5 space-y-4">
            {/* Upload de Imagem */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="input-label mb-0">Foto do item (Opcional)</label>
                <span className="text-[11px] text-stone-400">Pratos ou Bebidas</span>
              </div>
              <div
                className="relative w-full h-48 bg-stone-50 border-2 border-dashed border-stone-300 rounded-2xl flex items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50/20 transition-all overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2 text-stone-500">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-700" />
                    <span className="text-xs font-semibold">Otimizando e enviando foto...</span>
                  </div>
                ) : imageUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={imageUrl}
                      alt="Preview do item"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity gap-1 text-white">
                      <Upload className="w-6 h-6" />
                      <span className="text-xs font-semibold">Clique para trocar a foto</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-stone-400 p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mb-1">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-stone-700">Clique para adicionar uma foto</span>
                    <span className="text-[11px] text-stone-400 max-w-xs">
                      Enquadramento inteligente: garrafas, latas e pratos inteiros sem cortes
                    </span>
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
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-stone-500">Foto inteira preservada</span>
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-medium transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Remover foto
                  </button>
                </div>
              )}
            </div>

            {/* Nome */}
            <div>
              <label htmlFor="item-name" className="input-label">Nome do item *</label>
              <input
                id="item-name"
                type="text"
                placeholder="Ex: Burger Artesanal de Costela"
                className="input-field"
                {...register('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name.message}</p>}
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="item-description" className="input-label">Descrição e ingredientes</label>
              <textarea
                id="item-description"
                rows={2}
                placeholder="Ex: Pão brioche, 180g de burger de costela, queijo cheddar derretido e maionese artesanal da casa."
                className="input-field resize-none"
                {...register('description')}
              />
            </div>

            {/* Preço e Categoria */}
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
                {errors.price && <p className="mt-1 text-xs text-red-600 font-medium">{errors.price.message}</p>}
              </div>

              <div>
                <label htmlFor="item-category" className="input-label">Categoria *</label>
                <select
                  id="item-category"
                  className="input-field bg-white"
                  {...register('category_id')}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.category_id.message}</p>
                )}
              </div>
            </div>

            {/* Status Ativo / Inativo */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="w-4 h-4 rounded border-stone-300 text-orange-700 focus:ring-orange-600"
                />
                <span className="text-xs sm:text-sm font-semibold text-stone-800">
                  Item disponível para pedidos no cardápio
                </span>
              </label>
            </div>
          </div>

          {/* Footer do Modal */}
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs px-5 py-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                isEditing ? 'Atualizar Prato' : 'Adicionar Prato'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
