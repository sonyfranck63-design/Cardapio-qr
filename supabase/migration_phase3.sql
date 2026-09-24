-- ============================================================
-- CARDÁPIO QR — Migração Fase 3: Temas Visuais e Informações do Restaurante
-- ============================================================

DO $$
BEGIN
  -- 1. Cor tema personalizada (código hex de 6 dígitos)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'theme_color'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN theme_color TEXT DEFAULT '#1c1917';
    ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_theme_color_check CHECK (theme_color ~ '^#[0-9a-fA-F]{6}$');
  END IF;

  -- 2. Família tipográfica do tema ('classico', 'moderno', 'boteco')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'theme_font'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN theme_font TEXT DEFAULT 'moderno';
    ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_theme_font_check CHECK (theme_font IN ('classico', 'moderno', 'boteco'));
  END IF;

  -- 3. Imagem de capa (banner)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN cover_url TEXT;
  END IF;

  -- 4. Tagline / Slogan / Frase curta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'tagline'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN tagline TEXT;
  END IF;

  -- 5. Endereço físico
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'address'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN address TEXT;
  END IF;

  -- 6. Horário de funcionamento (ex: 'Ter a Dom: 18h às 23h')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'opening_hours'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN opening_hours TEXT;
  END IF;

  -- 7. Perfil do Instagram (ex: 'bar_do_chefe')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'instagram'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN instagram TEXT;
  END IF;

  -- 8. Flag para exibir itens inativos como 'Esgotado' em vez de ocultá-los
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'show_sold_out'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN show_sold_out BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

-- 9. Concessão de permissões de colunas aos papéis autenticado e anônimo
REVOKE INSERT, UPDATE ON public.restaurants FROM anon, authenticated;
GRANT UPDATE (
  name,
  slug,
  logo_url,
  whatsapp,
  whatsapp_message,
  theme_color,
  theme_font,
  cover_url,
  tagline,
  address,
  opening_hours,
  instagram,
  show_sold_out
) ON public.restaurants TO authenticated;

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
  created_at,
  theme_color,
  theme_font,
  cover_url,
  tagline,
  address,
  opening_hours,
  instagram,
  show_sold_out
) ON public.restaurants TO anon;
