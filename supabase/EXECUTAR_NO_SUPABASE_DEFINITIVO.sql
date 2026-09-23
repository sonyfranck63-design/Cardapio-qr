-- ==============================================================================
-- CARDÁPIO QR — SCRIPT SQL MESTRE DEFINITIVO (PERFORMANCE, ÍNDICES E WEBHOOK)
-- Copie todo o conteúdo deste arquivo e cole no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. TABELA DE PROCESSAMENTO ATÔMICO DE PAGAMENTOS (IDEMPOTÊNCIA DO WEBHOOK)
-- Impede race conditions e duplicidade de dias quando o Mercado Pago envia múltiplos webhooks
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.processed_payments (
  id              TEXT PRIMARY KEY, -- ID único da transação no Mercado Pago
  restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  status          TEXT NOT NULL,
  amount          NUMERIC(10, 2),
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.processed_payments ENABLE ROW LEVEL SECURITY;

-- Política RLS: Usuário autenticado pode consultar o histórico do seu restaurante
DROP POLICY IF EXISTS "processed_payments_owner_read" ON public.processed_payments;
CREATE POLICY "processed_payments_owner_read"
  ON public.processed_payments FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM public.restaurants WHERE id = restaurant_id
    )
  );

-- ==============================================================================
-- 2. ÍNDICES CRÍTICOS DE PERFORMANCE PARA ESCALABILIDADE (POSTGRESQL)
-- Evita Sequential Scans (varredura completa) quando a base tiver milhares de registros
-- ==============================================================================

-- A) TABELA RESTAURANTS
CREATE INDEX IF NOT EXISTS idx_restaurants_slug 
  ON public.restaurants(slug);

CREATE INDEX IF NOT EXISTS idx_restaurants_user_id 
  ON public.restaurants(user_id);

CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status 
  ON public.restaurants(subscription_status);

CREATE INDEX IF NOT EXISTS idx_restaurants_created_at_desc 
  ON public.restaurants(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_restaurants_slug_status 
  ON public.restaurants(slug, subscription_status);

-- B) TABELA CATEGORIES
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id 
  ON public.categories(restaurant_id);

-- Índice composto para a consulta do cardápio público: filtra por restaurante e ordena por order
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_order 
  ON public.categories(restaurant_id, "order" ASC);

-- C) TABELA MENU_ITEMS
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id 
  ON public.menu_items(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_menu_items_category_id 
  ON public.menu_items(category_id);

CREATE INDEX IF NOT EXISTS idx_menu_items_is_active 
  ON public.menu_items(is_active);

-- Índice composto para o cardápio público: busca itens ativos de uma categoria ordenados
CREATE INDEX IF NOT EXISTS idx_menu_items_category_active_order 
  ON public.menu_items(category_id, is_active, "order" ASC);

-- Índice composto para o painel admin e consultas gerais do cardápio
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_active_order 
  ON public.menu_items(restaurant_id, is_active, "order" ASC);

-- D) TABELA PROCESSED_PAYMENTS
CREATE INDEX IF NOT EXISTS idx_processed_payments_restaurant_id 
  ON public.processed_payments(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_processed_payments_created_at 
  ON public.processed_payments(created_at DESC);

-- ==============================================================================
-- 3. GARANTIR COLUNAS DE ASSINATURA EM RESTAURANTS
-- ==============================================================================
ALTER TABLE public.restaurants 
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' NOT NULL,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'mensal' NOT NULL,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT;

-- ==============================================================================
-- 4. TRIGGER: CRIAÇÃO AUTOMÁTICA DE RESTAURANTE NO CADASTRO DO USUÁRIO
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  restaurant_name TEXT;
  restaurant_slug TEXT;
  base_slug TEXT;
BEGIN
  restaurant_name := COALESCE(new.raw_user_meta_data->>'restaurant_name', 'Meu Restaurante');
  
  -- Gera slug limpo a partir do nome
  base_slug := lower(regexp_replace(restaurant_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN
    base_slug := 'restaurante';
  END IF;
  
  -- Adiciona hash aleatório para garantir unicidade
  restaurant_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);

  -- Cria restaurante com 7 dias de trial
  INSERT INTO public.restaurants (
    user_id,
    name,
    slug,
    subscription_status,
    subscription_plan,
    subscription_expires_at
  )
  VALUES (
    new.id,
    restaurant_name,
    restaurant_slug,
    'trial',
    'mensal',
    NOW() + INTERVAL '7 days'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. BUCKET DE IMAGENS E POLÍTICAS DE STORAGE (restaurant-assets)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-assets',
  'restaurant-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao storage
DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
CREATE POLICY "storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'restaurant-assets');

DROP POLICY IF EXISTS "storage_authenticated_upload" ON storage.objects;
CREATE POLICY "storage_authenticated_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'restaurant-assets' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "storage_owner_update" ON storage.objects;
CREATE POLICY "storage_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'restaurant-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "storage_owner_delete" ON storage.objects;
CREATE POLICY "storage_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'restaurant-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
