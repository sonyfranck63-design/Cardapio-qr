# Relatório de Auditoria e Correções de Produção — CardápioQR

Todas as 4 reclamações foram auditadas na causa raiz, corrigidas no código, testadas e **já implantadas com sucesso na Vercel**.

---

## 1. Por que as alterações anteriores não haviam surtido efeito?
No commit anterior (`54b6d72`), o arquivo `ItemDetailModal.tsx` adicionou o hook `useState(false)` sem importar o `useState` do React. Isso causou um erro de compilação durante o build na Vercel (`Type error: Cannot find name 'useState'`). 

Como consequência, **a Vercel abortou o deploy em produção** com status `● Error`. O site de produção continuou rodando a versão antiga anterior a qualquer correção.

**Resolução:** O import foi corrigido, o build local `next build` foi validado com 0 erros e o novo deploy (`commit 1668f10`) foi concluído na Vercel com status **● Ready**.

---

## 2. Status dos 4 Problemas Reclamados

### Problema 1: Erro ao Clicar em "Assinar Agora" ("Erro ao iniciar pagamento")
* **Causa Raiz:** Divergência de payload entre backend e frontend (propriedades `url` vs `init_point`).
* **Solução Implementada:** 
  1. No backend (`/api/mercadopago/checkout/route.ts`), a resposta agora entrega tanto `url` quanto `init_point`.
  2. No frontend (`/admin/subscription/page.tsx`), a função `handleCheckout` aceita ambas as propriedades e expõe a mensagem real de erro caso a API de pagamento recuse a cobrança.
* **Status:** ✅ Corrigido e ativo em produção.

---

### Problema 2: Itens Adicionados Não Aparecem ("Cardápio em preparação")
* **Causa Raiz:** O cache estático do Next.js (`unstable_cache`) estava configurado para 3600 segundos (1 hora) e as chamadas de revalidação no painel administrativo eram assíncronas sem `await`, permitindo que o `router.refresh()` interrompesse a revalidação.
* **Solução Implementada:**
  1. O tempo de fallback do cache foi reduzido para **10 segundos** (`src/lib/menu-cache.ts` e `src/app/[slug]/page.tsx`).
  2. As ações de revalidação em `ItemsManager.tsx` e `CategoriesManager.tsx` agora usam `await` estrito.
  3. A rota de revalidação foi executada e confirmou a purga de cache.
* **Status:** ✅ Validado na URL de produção `https://cardapio-qr-pro.vercel.app/matheus-adm-474089`: todos os pratos ("Linguiça com farofa", "Xis tudo", "Fritas Rústicas", etc.) estão visíveis e renderizados.

---

### Problema 3: Erro no Upload de Logo e Imagem de Capa
* **Causa Raiz:** As políticas de segurança (RLS) do Supabase Storage bloqueavam uploads diretos vindos do navegador autenticado com o erro `403 AccessDenied: new row violates row-level security policy` devido a incompatibilidades de path com `storage.foldername`.
* **Solução Definitiva:**
  1. Criada a rota de backend segura **`/api/upload`** (`src/app/api/upload/route.ts`).
  2. Ela valida a sessão do usuário, certifica que ele é proprietário do restaurante e realiza o upload para o bucket `restaurant-assets` via `service_role` no servidor.
  3. Atualizados os formulários `RestaurantSettingsForm.tsx` (logo e capa) e `ItemFormModal.tsx` (fotos de pratos) para utilizar essa rota.
* **Status:** ✅ Testado e 100% funcional. Não depende mais de regras manuais no SQL Editor do Supabase.

---

### Problema 4: Imagens Quebradas em Entradas e Petiscos
* **Causa Raiz:** Duas imagens de exemplo no cardápio de demonstração (`demo/page.tsx`) apontavam para links antigos do Unsplash que foram removidos do ar (retornando erro HTTP 404). O modal de detalhes também não possuía tratamento de falha de carregamento.
* **Solução Implementada:**
  1. Substituídas as fotos de "Batata Rústica" e "Chopp Artesanal" por fotos gastronômicas ativas e validadas (HTTP 200).
  2. Implementado fallback no `ItemDetailModal.tsx` com `onError` que oculta fotos indisponíveis e exibe o ícone estilizado de alta gastronomia, garantindo que o site nunca exiba o ícone de "imagem quebrada" do navegador.
* **Status:** ✅ Validado na URL de produção `https://cardapio-qr-pro.vercel.app/demo`.

---

## 3. Resumo da Verificação em Produção
* **Build local:** `next build` finalizou com sucesso (20 páginas estáticas e rotas dinâmicas).
* **Vercel Deploy:** `https://cardapio-6p87olhjk-matheus-franck.vercel.app` — **● Ready**.
* **Domínio Oficial:** `https://cardapio-qr-pro.vercel.app` atualizado.
