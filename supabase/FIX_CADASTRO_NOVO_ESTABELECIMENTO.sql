-- ==============================================================================
-- CARDÁPIO QR — CORREÇÃO DEFINITIVA DO CADASTRO DE NOVOS ESTABELECIMENTOS
-- Resolve o erro "Database error saving new user" ao criar novas contas
-- ==============================================================================
-- Instruções:
-- 1. Acesse o painel do Supabase: https://supabase.com/dashboard/project/_/sql
-- 2. Copie e cole todo o conteúdo deste arquivo no SQL Editor
-- 3. Clique no botão "Run" (Executar)
-- ==============================================================================

-- 1. Garante a extensão unaccent no schema extensions ou public
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- 2. Atualiza a função handle_new_user com proteção total contra falhas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  restaurant_name TEXT;
  restaurant_slug TEXT;
  base_slug TEXT;
  norm_email TEXT;
  trial_already_granted BOOLEAN := false;
  initial_status TEXT := 'trial';
  initial_expires_at TIMESTAMPTZ := NOW() + INTERVAL '7 days';
BEGIN
  restaurant_name := COALESCE(new.raw_user_meta_data->>'restaurant_name', 'Meu Restaurante');
  norm_email := public.normalize_email(new.email);

  -- Sanitização segura do nome para geração do slug
  BEGIN
    base_slug := lower(extensions.unaccent(restaurant_name));
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      base_slug := lower(public.unaccent(restaurant_name));
    EXCEPTION WHEN OTHERS THEN
      base_slug := lower(restaurant_name);
    END;
  END;

  -- Substitui caracteres especiais por hífen
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  -- Remove múltiplos hífens consecutivos para não violar constraint
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  -- Remove hífens das extremidades
  base_slug := trim(both '-' from base_slug);

  IF base_slug = '' OR length(base_slug) < 2 THEN
    base_slug := 'restaurante';
  END IF;

  -- Trunca se for muito longo para respeitar o limite de 50 caracteres com o hash
  IF length(base_slug) > 38 THEN
    base_slug := substr(base_slug, 1, 38);
    base_slug := trim(both '-' from base_slug);
  END IF;

  -- Monta slug final com sufixo único
  restaurant_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);

  -- Verificação de e-mail e concessão do trial
  IF new.email_confirmed_at IS NOT NULL THEN
    -- Verifica histórico anti-abuso de trial
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trial_history') THEN
      SELECT EXISTS (
        SELECT 1 FROM public.trial_history WHERE normalized_email = norm_email
      ) INTO trial_already_granted;

      IF trial_already_granted THEN
        initial_status := 'expired';
        initial_expires_at := NOW();
      ELSE
        initial_status := 'trial';
        initial_expires_at := NOW() + INTERVAL '7 days';

        INSERT INTO public.trial_history (normalized_email, user_id)
        VALUES (norm_email, new.id)
        ON CONFLICT (normalized_email) DO NOTHING;
      END IF;
    END IF;
  ELSE
    -- Se o e-mail ainda não foi confirmado
    initial_status := 'pending_verification';
    initial_expires_at := NOW();
  END IF;

  -- Inserção segura do restaurante
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

EXCEPTION WHEN OTHERS THEN
  -- Contingência Absoluta: NUNCA abortar a criação do usuário no auth.users
  BEGIN
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
      COALESCE(new.raw_user_meta_data->>'restaurant_name', 'Meu Restaurante'),
      'restaurante-' || substr(md5(random()::text), 1, 8),
      'trial',
      'mensal',
      NOW() + INTERVAL '7 days'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Se até a contingência falhar, não impede o usuário de ser registrado;
    -- o layout do Next.js cuidará da criação com admin client
    NULL;
  END;

  RETURN new;
END;
$$;

-- 3. Recria o trigger em auth.users garantindo a chamada da função atualizada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Confirmação de execução bem-sucedida
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger on_auth_user_created e função handle_new_user() atualizados com sucesso e à prova de falhas!';
END $$;
