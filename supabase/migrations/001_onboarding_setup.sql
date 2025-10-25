-- Tabela profiles (ajuste se já existir)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'user',
  company_id uuid,
  status text not null default 'active',
  created_at timestamptz default now()
);

-- Tabela companies (ajuste se já existir)
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Tabela funnel_metrics (ajuste se já existir)
create table if not exists funnel_metrics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  key text not null,
  display_order integer not null default 0,
  created_at timestamptz default now()
);

-- RLS para profiles
alter table profiles enable row level security;

drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own
on profiles for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own
on profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- RLS para companies (apenas admins podem ver empresas da sua companhia)
alter table companies enable row level security;

drop policy if exists companies_select_own on companies;
create policy companies_select_own
on companies for select to authenticated
using (
  id in (
    select company_id 
    from profiles 
    where id = auth.uid() 
    and role = 'admin'
  )
);

-- RLS para funnel_metrics
alter table funnel_metrics enable row level security;

drop policy if exists funnel_metrics_select_own on funnel_metrics;
create policy funnel_metrics_select_own
on funnel_metrics for select to authenticated
using (
  company_id in (
    select company_id 
    from profiles 
    where id = auth.uid()
  )
);
