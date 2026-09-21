-- ============================================================
-- CARDÁPIO QR — Schema SQL para Supabase
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. Tabela de restaurantes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.restaurants (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  logo_url        TEXT,
  whatsapp        TEXT,
  whatsapp_message TEXT DEFAULT 'Olá! Gostaria de fazer um pedido.',
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index para busca por slug (usado na página pública)
CREATE INDEX IF NOT EXISTS restaurants_slug_idx ON public.restaurants(slug);
-- Index para busca por user_id (usado no admin)
CREATE INDEX IF NOT EXISTS restaurants_user_id_idx ON public.restaurants(user_id);

-- 2. Tabela de categorias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  "order"         INTEGER DEFAULT 0 NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS categories_restaurant_id_idx ON public.categories(restaurant_id);

-- 3. Tabela de itens do cardápio
-- ============================================================
CREATE TABLE IF NOT EXISTS public.menu_items (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name            TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image_url       TEXT,
  is_active       BOOLEAN DEFAULT TRUE NOT NULL,
  "order"         INTEGER DEFAULT 0 NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS menu_items_restaurant_id_idx ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS menu_items_category_id_idx ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS menu_items_is_active_idx ON public.menu_items(is_active);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Policies: RESTAURANTS
-- ============================================================

-- Qualquer pessoa pode ver restaurantes (para a página pública funcionar)
CREATE POLICY "restaurants_public_read"
  ON public.restaurants FOR SELECT
  USING (true);

-- Apenas o dono pode inserir, editar e excluir
CREATE POLICY "restaurants_owner_insert"
  ON public.restaurants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "restaurants_owner_update"
  ON public.restaurants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "restaurants_owner_delete"
  ON public.restaurants FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Policies: CATEGORIES
-- ============================================================

-- Qualquer pessoa pode ver categorias (para o cardápio público)
CREATE POLICY "categories_public_read"
  ON public.categories FOR SELECT
  USING (true);

-- Dono pode inserir/editar/excluir apenas suas categorias
CREATE POLICY "categories_owner_insert"
  ON public.categories FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.restaurants WHERE id = restaurant_id
    )
  );

CREATE POLICY "categories_owner_update"
  ON public.categories FOR UPDATE
  USING (
    auth.uid() = (
      SELECT user_id FROM public.restaurants WHERE id = restaurant_id
    )
  );

CREATE POLICY "categories_owner_delete"
  ON public.categories FOR DELETE
  USING (
    auth.uid() = (
      SELECT user_id FROM public.restaurants WHERE id = restaurant_id
    )
  );

-- ============================================================
-- Policies: MENU_ITEMS
-- ============================================================

-- Clientes só veem itens ATIVOS (is_active = true)
CREATE POLICY "menu_items_public_read"
  ON public.menu_items FOR SELECT
  USING (is_active = true OR auth.uid() = (
    SELECT user_id FROM public.restaurants WHERE id = restaurant_id
  ));

-- Dono pode inserir/editar/excluir seus itens (inclusive inativos)
CREATE POLICY "menu_items_owner_insert"
  ON public.menu_items FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.restaurants WHERE id = restaurant_id
    )
  );

CREATE POLICY "menu_items_owner_update"
  ON public.menu_items FOR UPDATE
  USING (
    auth.uid() = (
      SELECT user_id FROM public.restaurants WHERE id = restaurant_id
    )
  );

CREATE POLICY "menu_items_owner_delete"
  ON public.menu_items FOR DELETE
  USING (
    auth.uid() = (
      SELECT user_id FROM public.restaurants WHERE id = restaurant_id
    )
  );

-- ============================================================
-- Storage: Bucket para imagens
-- Execute separadamente ou via dashboard do Supabase
-- ============================================================

-- Criar bucket público para imagens
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-assets',
  'restaurant-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy de upload: apenas usuários autenticados podem fazer upload
CREATE POLICY "storage_authenticated_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'restaurant-assets' AND
    auth.role() = 'authenticated'
  );

-- Policy de leitura: qualquer pessoa pode ver as imagens (bucket público)
CREATE POLICY "storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'restaurant-assets');

-- Policy de atualização: dono do arquivo pode atualizar
CREATE POLICY "storage_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'restaurant-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy de exclusão: dono do arquivo pode excluir
CREATE POLICY "storage_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'restaurant-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
