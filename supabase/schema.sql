-- Novaes Planejados — schema inicial (leads, visitas, portfólio)
-- Rode este arquivo inteiro no SQL Editor do Supabase (Project > SQL Editor > New query).
-- Idempotente: pode rodar de novo com segurança (IF NOT EXISTS / OR REPLACE).

-- mantem updated_at em dia a cada UPDATE (compartilhada pelas 3 tabelas)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- LEADS — cada pedido de orçamento (vindo do chat da Nina ou
-- cadastrado manualmente no painel) e seu andamento no funil.
-- ============================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  phone text,
  address text,
  property_type text,
  environments text[] not null default '{}',
  -- geladeira/fogao/microondas/coifa/maquina/cama/outros: tudo opcional e
  -- variável conforme o ambiente escolhido no chat, por isso jsonb em vez
  -- de uma coluna fixa por eletrodoméstico.
  appliance_details jsonb not null default '{}'::jsonb,
  design_style text,
  color_preference text,
  wants_technical_visit boolean,
  status text not null default 'lead'
    check (status in ('lead', 'orcamento_enviado', 'aprovado', 'em_producao', 'instalado', 'perdido')),
  source text not null default 'manual' check (source in ('chat', 'manual')),
  budget_value numeric(12,2),
  payment_method text,
  installments integer,
  amount_received numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row
  execute function public.set_updated_at();

alter table public.leads enable row level security;

-- O chat da Nina é público (sem login) e precisa gravar o lead direto no
-- banco. RLS é a proteção de verdade aqui (a anon key é pública por
-- design) — restringimos o insert anônimo a linhas que "parecem" um lead
-- recém-criado (status = 'lead', origem = 'chat', nada de valor já
-- recebido), pra um visitante mal-intencionado não conseguir, via
-- console do navegador, inserir uma linha se passando por negócio já
-- fechado/pago.
drop policy if exists "anon can insert chat leads" on public.leads;
create policy "anon can insert chat leads"
  on public.leads for insert
  to anon
  with check (
    status = 'lead'
    and source = 'chat'
    and amount_received = 0
  );

-- anon NÃO pode select/update/delete (sem policy = RLS bloqueia por padrão).

drop policy if exists "authenticated can select leads" on public.leads;
create policy "authenticated can select leads"
  on public.leads for select
  to authenticated
  using (true);

drop policy if exists "authenticated can insert leads" on public.leads;
create policy "authenticated can insert leads"
  on public.leads for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated can update leads" on public.leads;
create policy "authenticated can update leads"
  on public.leads for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can delete leads" on public.leads;
create policy "authenticated can delete leads"
  on public.leads for delete
  to authenticated
  using (true);

-- ============================================================
-- VISITS — visitas técnicas / instalação agendadas para um lead.
-- Entidade própria (não uma coluna de data no lead) porque um mesmo
-- lead pode ter mais de uma visita (medição, depois instalação).
-- ============================================================
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  type text not null check (type in ('medicao', 'instalacao', 'outra')),
  scheduled_at timestamptz not null,
  status text not null default 'agendada' check (status in ('agendada', 'realizada', 'cancelada')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists visits_lead_id_idx on public.visits(lead_id);

alter table public.visits enable row level security;

-- Só quem está logado no painel mexe em visitas — não há fluxo público.
drop policy if exists "authenticated can select visits" on public.visits;
create policy "authenticated can select visits"
  on public.visits for select
  to authenticated
  using (true);

drop policy if exists "authenticated can insert visits" on public.visits;
create policy "authenticated can insert visits"
  on public.visits for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated can update visits" on public.visits;
create policy "authenticated can update visits"
  on public.visits for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can delete visits" on public.visits;
create policy "authenticated can delete visits"
  on public.visits for delete
  to authenticated
  using (true);

-- ============================================================
-- PORTFOLIO_ITEMS — projetos exibidos na galeria pública do site.
-- image_path guarda o caminho dentro do bucket "portfolio" do Storage,
-- não uma URL absoluta.
-- ============================================================
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  description text,
  category text,
  image_path text,
  display_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists portfolio_items_set_updated_at on public.portfolio_items;
create trigger portfolio_items_set_updated_at
  before update on public.portfolio_items
  for each row
  execute function public.set_updated_at();

alter table public.portfolio_items enable row level security;

-- A landing pública lê os itens publicados direto do banco.
drop policy if exists "anon can select published portfolio items" on public.portfolio_items;
create policy "anon can select published portfolio items"
  on public.portfolio_items for select
  to anon
  using (published = true);

drop policy if exists "authenticated can select portfolio items" on public.portfolio_items;
create policy "authenticated can select portfolio items"
  on public.portfolio_items for select
  to authenticated
  using (true);

drop policy if exists "authenticated can insert portfolio items" on public.portfolio_items;
create policy "authenticated can insert portfolio items"
  on public.portfolio_items for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated can update portfolio items" on public.portfolio_items;
create policy "authenticated can update portfolio items"
  on public.portfolio_items for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can delete portfolio items" on public.portfolio_items;
create policy "authenticated can delete portfolio items"
  on public.portfolio_items for delete
  to authenticated
  using (true);

-- ============================================================
-- STORAGE — bucket público "portfolio" para as fotos reais dos projetos.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists "public can read portfolio bucket" on storage.objects;
create policy "public can read portfolio bucket"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'portfolio');

drop policy if exists "authenticated can upload to portfolio bucket" on storage.objects;
create policy "authenticated can upload to portfolio bucket"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio');

drop policy if exists "authenticated can update portfolio bucket" on storage.objects;
create policy "authenticated can update portfolio bucket"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio')
  with check (bucket_id = 'portfolio');

drop policy if exists "authenticated can delete from portfolio bucket" on storage.objects;
create policy "authenticated can delete from portfolio bucket"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio');
