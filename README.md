# Novaes Planejados — site + painel

Next.js (App Router) + Supabase + Vercel.

- `/` — landing page (pública), com o fluxo de orçamento conduzido pela
  assistente **Nina** em chat, que agenda o lead no Supabase e abre o
  WhatsApp da equipe.
- `/painel` — painel do dono: leads/pipeline, agenda de visitas,
  financeiro básico e gestão do portfólio exibido no site. Protegido por
  login (Supabase Auth).

## Estrutura

```
app/
  page.tsx                 landing page (Server Component: lê o portfólio publicado)
  layout.tsx                layout raiz + globals.css (tokens/paleta compartilhados)
  actions/leads.ts           Server Action pública: grava o lead do chat da Nina
  painel/
    layout.tsx               importa painel.css
    page.tsx                  server component: checa sessão, busca leads/visitas/portfólio
    actions.ts                Server Actions: CRUD de leads, visitas e portfólio, logout
    login/
      page.tsx
      actions.ts               Server Action de login (Supabase Auth)
components/
  landing/                  seções da landing + o motor de chat da Nina (chat/)
  painel/                    DashboardApp (visão geral, leads, agenda, portfólio) e login
lib/
  supabase/                 clientes Supabase (server.ts, middleware.ts, storage.ts)
  validation.ts              schemas Zod compartilhados (client-side + Server Actions)
  types.ts, site-config.ts
middleware.ts                protege /painel/** e redireciona para /painel/login
supabase/schema.sql          tabelas leads/visits/portfolio_items + RLS + bucket de Storage
public/images/                fotos extraídas do index.html original (protótipo)
index.html, assets/           protótipo original — ficam na raiz só como referência
                              histórica, não fazem parte do projeto Next.js
```

## Rodando localmente

```
npm install
npm run dev
```

Abre em `http://localhost:3000`. A landing funciona sem Supabase
configurado (cai de volta nas fotos do protótipo e o chat da Nina só não
grava o lead no banco — o WhatsApp continua abrindo normalmente). O
`/painel` **exige** o Supabase configurado (ver abaixo) — sem isso ele dá
erro, por design, já que login não existe sem um projeto Supabase por trás.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha com os dados do seu
projeto Supabase (**Project Settings → API**):

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-public-key
```

Só essas duas. A `anon key` é pública por design (protegida pelas políticas
de RLS, não por segredo) — mesmo assim, **nunca** coloque a `service_role
key` aqui nem em nenhum lugar do código: ela ignora RLS e dá acesso total ao
banco. Este projeto não usa `service_role` em lugar nenhum.

## Configurar o Supabase (uma vez)

1. **Criar o projeto**: [supabase.com](https://supabase.com) → New Project
   (pode ficar na região São Paulo/sa-east-1). Guarde a senha do banco.
2. **Rodar o schema**: em **SQL Editor → New query**, cole o conteúdo de
   `supabase/schema.sql` inteiro e rode. Isso cria as tabelas `leads`,
   `visits` e `portfolio_items`, os triggers de `updated_at`, as políticas
   de RLS de cada uma e o bucket de Storage `portfolio` (público, para as
   fotos do portfólio).
3. **Criar sua conta de acesso ao painel**: **Authentication → Users → Add
   user**, um e-mail/senha só seu por enquanto. Não existe cadastro
   público no app — dá pra criar contas para a Marcela e o Carlos Daniel
   do mesmo jeito quando fizer sentido.
4. **Desligar cadastro público**: **Authentication → Providers → Email** →
   desmarque "Allow new users to sign up". Sem isso, a anon key (que é
   pública, vai para o navegador) poderia ser usada para criar contas novas
   direto pelo console do navegador, mesmo sem uma tela de cadastro no site.
5. **Pegar URL e anon key**: **Project Settings → API**, copie para o
   `.env.local` (local) e para as variáveis de ambiente da Vercel (deploy).

## Deploy na Vercel

1. Importe o repositório do GitHub em vercel.com → **Add New → Project**.
2. Em **Environment Variables**, adicione as mesmas duas variáveis do
   `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy. A Vercel entrega em HTTPS por padrão e refaz o deploy a cada
   push na branch principal.

## O que já está coberto de segurança

- **Auth**: Supabase Auth (e-mail/senha), sem cadastro público. Middleware
  (`middleware.ts`) protege qualquer rota `/painel/**`; `app/painel/page.tsx`
  confere a sessão de novo no servidor (nunca confia só no middleware).
  Middleware roda no runtime Node.js (necessário para o `@supabase/ssr`
  completo funcionar no Edge Runtime da Vercel).
- **RLS**: habilitado nas três tabelas (ver `supabase/schema.sql`).
  `leads` é a única com escrita liberada para visitante anônimo — e mesmo
  assim só `insert`, e só de linhas com `status='lead'`, `source='chat'` e
  `amount_received=0` (um visitante não consegue, via console do
  navegador, inserir um registro que pareça um negócio já fechado/pago).
  `visits` e a escrita em `portfolio_items` exigem login; a leitura de
  `portfolio_items` publicados é pública (é o que a landing exibe).
- **Sem segredos no código**: só a anon key (pública por design) via env vars.
- **Validação**: schemas Zod (`lib/validation.ts`) usados tanto nos
  formulários quanto — de forma obrigatória, não confiando no client — nas
  Server Actions antes de qualquer escrita no banco.
- **Chat da Nina**: mensagens da própria Nina usam HTML fixo (para o
  negrito); o texto digitado pelo visitante é sempre renderizado como texto
  puro, nunca interpretado como HTML.
- **Headers de segurança**: CSP, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` —
  configurados em `next.config.ts`, aplicados a todas as rotas. Em
  desenvolvimento o CSP libera `'unsafe-eval'` (exigido pelo Fast Refresh do
  Next.js) — em produção isso não é necessário e fica de fora.

## Pendências conhecidas

- Textos e fotos da landing ainda são os do protótipo original — revisar
  com a Marcela e o Carlos Daniel.
- As fotos do portfólio (`public/images/`) vieram do protótipo — suba as
  fotos reais dos projetos pelo painel (`/painel` → Portfólio → Novo
  projeto → marcar como "Publicado"); a landing passa a usá-las
  automaticamente no lugar das de exemplo.
- Webhook antigo para Google Sheets foi removido — os leads do chat agora
  vão só para o Supabase/painel.
