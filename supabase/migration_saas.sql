-- ============================================================
-- CARDÁPIO QR — Migração para SaaS com Assinatura & Trigger
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Adicionar colunas de assinatura na tabela de restaurantes
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' NOT NULL,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'mensal' NOT NULL,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT;

-- 2. Garantir índice para busca por status
CREATE INDEX IF NOT EXISTS restaurants_subscription_status_idx 
ON public.restaurants(subscription_status);

-- 3. Função e Trigger para criar automaticamente o restaurante
-- Isso resolve definitivamente o problema de RLS na criação de conta!
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  restaurant_name TEXT;
  restaurant_slug TEXT;
  base_slug TEXT;
BEGIN
  restaurant_name := COALESCE(new.raw_user_meta_data->>'restaurant_name', 'Meu Restaurante');
  
  -- Gera o slug a partir do nome
  base_slug := lower(regexp_replace(restaurant_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN
    base_slug := 'restaurante';
  END IF;
  
  -- Adiciona sufixo único
  restaurant_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);

  -- Insere o restaurante com 7 dias de teste grátis
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

-- 4. Criar o Trigger no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Atualizar restaurantes existentes que não têm data de expiração definida
UPDATE public.restaurants
SET 
  subscription_status = 'trial',
  subscription_expires_at = NOW() + INTERVAL '7 days'
WHERE subscription_expires_at IS NULL;
