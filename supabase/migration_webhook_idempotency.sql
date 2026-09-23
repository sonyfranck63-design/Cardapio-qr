-- ============================================================
-- CARDÁPIO QR — Migração de Idempotência e Concorrência do Webhook
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. Tabela para registro atômico de pagamentos processados
CREATE TABLE IF NOT EXISTS public.processed_payments (
  id              TEXT PRIMARY KEY, -- ID do pagamento no Mercado Pago
  restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  status          TEXT NOT NULL,
  amount          NUMERIC(10, 2),
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Índice para consultas rápidas de histórico por restaurante
CREATE INDEX IF NOT EXISTS idx_processed_payments_restaurant_id 
ON public.processed_payments(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_processed_payments_created_at 
ON public.processed_payments(created_at DESC);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.processed_payments ENABLE ROW LEVEL SECURITY;

-- 4. Apenas o service_role e o próprio dono do restaurante podem ler o histórico
CREATE POLICY "processed_payments_owner_read"
  ON public.processed_payments FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM public.restaurants WHERE id = restaurant_id
    )
  );
