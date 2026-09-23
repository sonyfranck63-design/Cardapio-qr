-- ============================================================
-- CARDÁPIO QR — Migração Fase 2: Suporte a unaccent e geração de slug
-- ============================================================

-- Habilita extensão unaccent para remoção correta de acentuação gráfica
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Atualização da função de criação automática de restaurante ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  restaurant_name TEXT;
  restaurant_slug TEXT;
  base_slug TEXT;
BEGIN
  restaurant_name := COALESCE(new.raw_user_meta_data->>'restaurant_name', 'Meu Restaurante');
  
  -- Remove acentos primeiro via unaccent, converte para minúsculas e substitui caracteres não-alfanuméricos
  base_slug := lower(unaccent(restaurant_name));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  IF base_slug = '' THEN
    base_slug := 'restaurante';
  END IF;
  
  -- Gera slug único com sufixo aleatório curto
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
