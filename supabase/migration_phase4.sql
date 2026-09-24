-- ============================================================
-- CARDÁPIO QR - MIGRAÇÃO FASE 4: PRONTO PARA PÚBLICO
-- Prevenção de Abuso de Trial e Exigência de Confirmação de E-mail
-- ============================================================

-- 1. Tabela para rastreamento de trials já concedidos por e-mail normalizado
CREATE TABLE IF NOT EXISTS public.trial_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilita RLS (acesso exclusivo por funções SECURITY DEFINER do sistema)
ALTER TABLE public.trial_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trial_history FROM anon, authenticated;

-- 2. Função SQL para normalização de e-mail (remove aliases '+' e pontos no Gmail)
CREATE OR REPLACE FUNCTION public.normalize_email(raw_email text)
RETURNS text AS $$
DECLARE
  clean_email text;
  local_part text;
  domain_part text;
BEGIN
  IF raw_email IS NULL OR trim(raw_email) = '' THEN
    RETURN '';
  END IF;

  clean_email := lower(trim(raw_email));
  local_part := split_part(clean_email, '@', 1);
  domain_part := split_part(clean_email, '@', 2);

  IF domain_part = 'googlemail.com' THEN
    domain_part := 'gmail.com';
  END IF;

  -- Remove sufixos com alias '+'
  local_part := split_part(local_part, '+', 1);

  -- Se for Gmail, ignora pontos no nome de usuário
  IF domain_part = 'gmail.com' THEN
    local_part := replace(local_part, '.', '');
  END IF;

  RETURN local_part || '@' || domain_part;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Atualização do Trigger handle_new_user com verificação de confirmação e anti-abuso
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  restaurant_name TEXT;
  restaurant_slug TEXT;
  base_slug TEXT;
  norm_email TEXT;
  trial_already_granted BOOLEAN;
  initial_status TEXT;
  initial_expires_at TIMESTAMPTZ;
BEGIN
  restaurant_name := COALESCE(new.raw_user_meta_data->>'restaurant_name', 'Meu Restaurante');
  norm_email := public.normalize_email(new.email);

  -- Gera o slug limpo
  base_slug := lower(unaccent(restaurant_name));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  IF base_slug = '' THEN
    base_slug := 'restaurante';
  END IF;

  restaurant_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);

  -- Verifica se o e-mail já foi confirmado no momento da criação
  IF new.email_confirmed_at IS NOT NULL THEN
    -- Verifica se já utilizou o trial anteriormente com este e-mail normalizado
    SELECT EXISTS (
      SELECT 1 FROM public.trial_history WHERE normalized_email = norm_email
    ) INTO trial_already_granted;

    IF trial_already_granted THEN
      initial_status := 'expired';
      initial_expires_at := NOW();
    ELSE
      initial_status := 'trial';
      initial_expires_at := NOW() + INTERVAL '7 days';

      -- Registra para impedir novo trial no mesmo e-mail normalizado
      INSERT INTO public.trial_history (normalized_email, user_id)
      VALUES (norm_email, new.id)
      ON CONFLICT (normalized_email) DO NOTHING;
    END IF;
  ELSE
    -- E-mail ainda pendente de confirmação: cria o restaurante sem liberar os 7 dias antes de confirmar
    initial_status := 'pending_verification';
    initial_expires_at := NOW();
  END IF;

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
    initial_status,
    'mensal',
    initial_expires_at
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função e Trigger para Ativação do Trial após Confirmação de E-mail
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS trigger AS $$
DECLARE
  norm_email TEXT;
  trial_already_granted BOOLEAN;
BEGIN
  -- Dispara apenas quando o status transiciona de não confirmado para confirmado
  IF old.email_confirmed_at IS NULL AND new.email_confirmed_at IS NOT NULL THEN
    norm_email := public.normalize_email(new.email);

    SELECT EXISTS (
      SELECT 1 FROM public.trial_history WHERE normalized_email = norm_email
    ) INTO trial_already_granted;

    IF trial_already_granted THEN
      -- Já usou trial anteriormente com este e-mail (ou alias): expira imediatamente
      UPDATE public.restaurants
      SET
        subscription_status = 'expired',
        subscription_expires_at = NOW()
      WHERE user_id = new.id AND subscription_status = 'pending_verification';
    ELSE
      -- Primeiro trial para este e-mail normalizado: concede 7 dias
      INSERT INTO public.trial_history (normalized_email, user_id)
      VALUES (norm_email, new.id)
      ON CONFLICT (normalized_email) DO NOTHING;

      UPDATE public.restaurants
      SET
        subscription_status = 'trial',
        subscription_expires_at = NOW() + INTERVAL '7 days'
      WHERE user_id = new.id AND subscription_status = 'pending_verification';
    END IF;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_confirmed();
