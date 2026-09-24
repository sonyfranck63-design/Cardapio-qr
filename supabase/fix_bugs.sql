-- 1. Corrige o RLS da tabela menu_items para permitir leitura de itens inativos (para "show_sold_out")
DROP POLICY IF EXISTS "menu_items_public_read" ON public.menu_items;
CREATE POLICY "menu_items_public_read" ON public.menu_items FOR SELECT USING (true);

-- 2. Corrige as políticas de Storage para Upload de Imagens
DROP POLICY IF EXISTS "storage_authenticated_upload" ON storage.objects;
CREATE POLICY "storage_authenticated_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'restaurant-assets'
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE starts_with(name, r.id::text || '/')
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
    WHERE starts_with(name, r.id::text || '/')
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
    WHERE starts_with(name, r.id::text || '/')
    AND r.user_id = auth.uid()
  )
);
