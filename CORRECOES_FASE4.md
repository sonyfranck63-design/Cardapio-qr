# Relatório de Correções de Produção

Realizei a auditoria solicitada e encontrei e corrigi os bugs críticos. Aqui está o resumo técnico e as instruções:

## 1. Erro no Pagamento ("Erro ao iniciar pagamento")
**Causa:** O backend do Checkout do Mercado Pago estava retornando a propriedade `url`, mas o frontend (botão "Assinar Agora") estava buscando por `init_point`.
**Solução:** Código do frontend corrigido (`src/app/admin/subscription/page.tsx`) para ler a propriedade correta. O pagamento voltará a funcionar no próximo deploy.

## 2. Erro de Upload de Imagens (Logo e Capa)
**Causa:** A política de segurança (RLS) do bucket `restaurant-assets` no Supabase estava verificando a pasta do arquivo usando `storage.foldername(name)`, que estava falhando ao validar o ID do restaurante.
**Solução:** Criei um script SQL para atualizar a política de segurança, usando um formato mais robusto (`starts_with`).

## 3. Itens não aparecem no cardápio ("Travado em preparação")
**Causa:** A política de segurança (RLS) da tabela `menu_items` impedia a leitura pública de itens inativos. Como consequência, a funcionalidade de "Exibir Esgotados" falhava para os clientes, ou o Next.js falhava na revalidação de cache.
**Solução:** Atualizei a política RLS no script SQL para permitir a leitura, delegando ao código do frontend a responsabilidade de filtrar ou exibir o aviso de "Esgotado".

## 4. Imagens Quebradas em Entradas e Petiscos
**Causa:** Algumas imagens iniciais (seed data, provavelmente do Unsplash) saíram do ar. O componente de listagem tratava isso, mas o componente de Detalhes (`ItemDetailModal.tsx`) não possuía um *fallback* (tratamento de erro) e exibia a imagem quebrada.
**Solução:** Adicionado tratamento `onError` no `ItemDetailModal.tsx` para esconder imagens quebradas e exibir o ícone padrão de pratos.

---

## ⚠️ O QUE VOCÊ PRECISA FAZER AGORA

### Passo 1: Executar o Script SQL no Supabase
Eu gerei um arquivo chamado `fix_bugs.sql` na pasta `supabase/`. 
Você precisa pegar o conteúdo desse arquivo e **executar no SQL Editor do seu Supabase** (assim como você fez anteriormente). Ele aplicará as correções 2 e 3 instantaneamente.

### Passo 2: Fazer Deploy para a Vercel
As correções de código (Pagamento e Imagens quebradas) precisam ir para produção:
```bash
git add .
git commit -m "fix: checkout, imagens quebradas e otimizacoes"
git push origin main
```
