-- ============================================================
-- CARDÁPIO QR — Migração de Segurança V2 (Idempotente)
-- ============================================================

-- 1. FUNÇÃO ATÔMICA RPC: apply_payment
-- Processa pagamentos aprovados de forma transacional e idempotente
CREATE OR REPLACE FUNCTION public.apply_payment(
  p_payment_id TEXT,
  p_restaurant_id UUID,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_processed BOOLEAN;
  v_restaurant RECORD;
  v_base_date TIMESTAMPTZ;
  v_new_expiry TIMESTAMPTZ;
BEGIN
  -- 1.1 Verificação de Idempotência: Se o pagamento já foi registrado
  SELECT EXISTS(
    SELECT 1 FROM public.processed_payments WHERE id = p_payment_id
  ) INTO v_already_processed;

  IF v_already_processed THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'message', 'Pagamento já processado anteriormente'
    );
  END IF;

  -- 1.2 Localiza e adquire bloqueio exclusivo de linha (FOR UPDATE)
  SELECT id, subscription_expires_at, mercadopago_payment_id
  INTO v_restaurant
  FROM public.restaurants
  WHERE id = p_restaurant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Restaurante não encontrado: %', p_restaurant_id;
  END IF;

  -- 1.3 Registra o pagamento na tabela processed_payments
  INSERT INTO public.processed_payments (
    id,
    restaurant_id,
    status,
    amount
  ) VALUES (
    p_payment_id,
    p_restaurant_id,
    'approved',
    p_amount
  );

  -- 1.4 Calcula nova data de expiração (+30 dias)
  v_base_date := NOW();
  IF v_restaurant.subscription_expires_at IS NOT NULL AND v_restaurant.subscription_expires_at > v_base_date THEN
    v_base_date := v_restaurant.subscription_expires_at;
  END IF;
  v_new_expiry := v_base_date + INTERVAL '30 days';

  -- 1.5 Atualiza o restaurante
  UPDATE public.restaurants
  SET
    subscription_status = 'active',
    subscription_expires_at = v_new_expiry,
    mercadopago_payment_id = p_payment_id
  WHERE id = p_restaurant_id;

  RETURN jsonb_build_object(
    'success', true,
    'already_processed', false,
    'restaurant_id', p_restaurant_id,
    'new_expires_at', v_new_expiry
  );
END;
$$;

-- Restringe execução da função apply_payment apenas ao backend seguro (service_role)
REVOKE EXECUTE ON FUNCTION public.apply_payment(TEXT, UUID, NUMERIC) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_payment(TEXT, UUID, NUMERIC) TO service_role;


-- 2. RESTRIÇÕES E SEGURANÇA NA TABELA restaurants
-- Garante que um usuário só pode ter um único restaurante vinculado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_user_id_key'
  ) THEN
    ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Validação de formato de slug (3 a 50 caracteres, apenas letras minúsculas, números e hífens internos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_slug_format_check'
  ) THEN
    ALTER TABLE public.restaurants
      ADD CONSTRAINT restaurants_slug_format_check
      CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) >= 3 AND length(slug) <= 50);
  END IF;
END $$;

-- Validação de slugs reservados do sistema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_slug_reserved_check'
  ) THEN
    ALTER TABLE public.restaurants
      ADD CONSTRAINT restaurants_slug_reserved_check
      CHECK (slug NOT IN (
        'admin', 'api', 'auth', 'demo', 'superadmin',
        'login', 'register', 'sitemap', 'robots', '_next',
        'app', 'checkout', 'termos', 'privacidade', 'public',
        'static', 'dashboard'
      ));
  END IF;
END $$;

-- 3. PERMISSÕES DE COLUNAS (Column-Level Security)
-- Revoga permissões completas de INSERT e UPDATE para anon e authenticated
REVOKE INSERT, UPDATE ON public.restaurants FROM anon, authenticated;

-- Permite que o usuário autenticado atualize estritamente os campos cadastrais
GRANT UPDATE (name, slug, logo_url, whatsapp, whatsapp_message) ON public.restaurants TO authenticated;

-- Revoga SELECT irrestrito do papel público (anon) e concede apenas colunas não-sensíveis
REVOKE SELECT ON public.restaurants FROM anon;
GRANT SELECT (
  id,
  name,
  slug,
  logo_url,
  whatsapp,
  whatsapp_message,
  subscription_status,
  subscription_expires_at,
  created_at
) ON public.restaurants TO anon;


-- 4. POLICIES CORRIGIDAS DO STORAGE (Bucket: restaurant-assets)
-- O primeiro segmento do path do arquivo deve corresponder ao ID de um restaurante pertencente ao usuário
DROP POLICY IF EXISTS "storage_authenticated_upload" ON storage.objects;
CREATE POLICY "storage_authenticated_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'restaurant-assets'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id::text = (storage.foldername(name))[1]
    AND r.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "storage_owner_update" ON storage.objects;
CREATE POLICY "storage_owner_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'restaurant-assets'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id::text = (storage.foldername(name))[1]
    AND r.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "storage_owner_delete" ON storage.objects;
CREATE POLICY "storage_owner_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'restaurant-assets'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id::text = (storage.foldername(name))[1]
    AND r.user_id = auth.uid()
  )
);
