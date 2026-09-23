-- ============================================================
-- CARDÁPIO QR — Schema SQL Completo para Supabase (com Otimizações)
-- ============================================================

-- 1. Tabela de restaurantes
CREATE TABLE IF NOT EXISTS public.restaurants (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL UNIQUE,
  logo_url                TEXT,
  whatsapp                TEXT,
  whatsapp_message        TEXT DEFAULT 'Olá! Gostaria de fazer um pedido.',
  subscription_status     TEXT DEFAULT 'trial' NOT NULL,
  subscription_plan       TEXT DEFAULT 'mensal' NOT NULL,
  subscription_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  mercadopago_payment_id  TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Tabela de categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  "order"         INTEGER DEFAULT 0 NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Tabela de itens do cardápio
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

-- 4. Tabela de processamento atômico de pagamentos (idempotência do webhook)
CREATE TABLE IF NOT EXISTS public.processed_payments (
  id              TEXT PRIMARY KEY,
  restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  status          TEXT NOT NULL,
  amount          NUMERIC(10, 2),
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- ÍNDICES DE PERFORMANCE E ESCALABILIDADE (POSTGRESQL)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON public.restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status ON public.restaurants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_restaurants_created_at_desc ON public.restaurants(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug_status ON public.restaurants(slug, subscription_status);

CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON public.categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_order ON public.categories(restaurant_id, "order" ASC);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_active ON public.menu_items(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_active_order ON public.menu_items(category_id, is_active, "order" ASC);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_active_order ON public.menu_items(restaurant_id, is_active, "order" ASC);

CREATE INDEX IF NOT EXISTS idx_processed_payments_restaurant_id ON public.processed_payments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_processed_payments_created_at ON public.processed_payments(created_at DESC);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_payments ENABLE ROW LEVEL SECURITY;

-- Policies: RESTAURANTS
DROP POLICY IF EXISTS "restaurants_public_read" ON public.restaurants;
CREATE POLICY "restaurants_public_read" ON public.restaurants FOR SELECT USING (true);

DROP POLICY IF EXISTS "restaurants_owner_insert" ON public.restaurants;
CREATE POLICY "restaurants_owner_insert" ON public.restaurants FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "restaurants_owner_update" ON public.restaurants;
CREATE POLICY "restaurants_owner_update" ON public.restaurants FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "restaurants_owner_delete" ON public.restaurants;
CREATE POLICY "restaurants_owner_delete" ON public.restaurants FOR DELETE USING (auth.uid() = user_id);

-- Policies: CATEGORIES
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_owner_insert" ON public.categories;
CREATE POLICY "categories_owner_insert" ON public.categories FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.restaurants WHERE id = restaurant_id));

DROP POLICY IF EXISTS "categories_owner_update" ON public.categories;
CREATE POLICY "categories_owner_update" ON public.categories FOR UPDATE USING (auth.uid() = (SELECT user_id FROM public.restaurants WHERE id = restaurant_id));

DROP POLICY IF EXISTS "categories_owner_delete" ON public.categories;
CREATE POLICY "categories_owner_delete" ON public.categories FOR DELETE USING (auth.uid() = (SELECT user_id FROM public.restaurants WHERE id = restaurant_id));

-- Policies: MENU_ITEMS
DROP POLICY IF EXISTS "menu_items_public_read" ON public.menu_items;
CREATE POLICY "menu_items_public_read" ON public.menu_items FOR SELECT USING (is_active = true OR auth.uid() = (SELECT user_id FROM public.restaurants WHERE id = restaurant_id));

DROP POLICY IF EXISTS "menu_items_owner_insert" ON public.menu_items;
CREATE POLICY "menu_items_owner_insert" ON public.menu_items FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.restaurants WHERE id = restaurant_id));

DROP POLICY IF EXISTS "menu_items_owner_update" ON public.menu_items;
CREATE POLICY "menu_items_owner_update" ON public.menu_items FOR UPDATE USING (auth.uid() = (SELECT user_id FROM public.restaurants WHERE id = restaurant_id));

DROP POLICY IF EXISTS "menu_items_owner_delete" ON public.menu_items;
CREATE POLICY "menu_items_owner_delete" ON public.menu_items FOR DELETE USING (auth.uid() = (SELECT user_id FROM public.restaurants WHERE id = restaurant_id));

-- Policies: PROCESSED_PAYMENTS
DROP POLICY IF EXISTS "processed_payments_owner_read" ON public.processed_payments;
CREATE POLICY "processed_payments_owner_read" ON public.processed_payments FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.restaurants WHERE id = restaurant_id));

-- ============================================================
-- STORAGE: Bucket para imagens
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-assets',
  'restaurant-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'restaurant-assets');

DROP POLICY IF EXISTS "storage_authenticated_upload" ON storage.objects;
CREATE POLICY "storage_authenticated_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'restaurant-assets' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "storage_owner_update" ON storage.objects;
CREATE POLICY "storage_owner_update" ON storage.objects FOR UPDATE USING (bucket_id = 'restaurant-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_owner_delete" ON storage.objects;
CREATE POLICY "storage_owner_delete" ON storage.objects FOR DELETE USING (bucket_id = 'restaurant-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- TRIGGER: Criação Automática do Restaurante
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  restaurant_name TEXT;
  restaurant_slug TEXT;
  base_slug TEXT;
BEGIN
  restaurant_name := COALESCE(new.raw_user_meta_data->>'restaurant_name', 'Meu Restaurante');
  base_slug := lower(regexp_replace(restaurant_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN
    base_slug := 'restaurante';
  END IF;
  
  restaurant_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);

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
