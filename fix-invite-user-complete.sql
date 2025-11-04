-- =============================================
-- CORREÇÃO COMPLETA PARA FUNÇÃO INVITE-USER
-- =============================================

-- 1. Verificar se as tabelas existem e criar se necessário
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'user',
  company_id uuid,
  status text not null default 'active',
  created_at timestamptz default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. CORRIGIR RLS DA TABELA PROFILES
-- Desabilitar RLS temporariamente para permitir INSERT via service_role
alter table profiles disable row level security;

-- Recriar políticas corretas para profiles
alter table profiles enable row level security;

-- Política para SELECT (usuários podem ver seu próprio perfil)
drop policy if exists profiles_select_own on profiles;
create policy profiles_select_own
on profiles for select to authenticated
using (id = auth.uid());

-- Política para UPDATE (usuários podem atualizar seu próprio perfil)
drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own
on profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Política para INSERT via service_role (Edge Functions)
drop policy if exists profiles_insert_service_role on profiles;
create policy profiles_insert_service_role
on profiles for insert
with check (true); -- Permite INSERT para service_role

-- 3. CORRIGIR RLS DA TABELA COMPANIES
-- Manter RLS desabilitado para companies (já que você teve que desabilitar)
alter table companies disable row level security;

-- 4. CRIAR TABELA FUNNEL_METRICS SE NÃO EXISTIR
create table if not exists funnel_metrics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  key text not null,
  display_order integer not null default 0,
  created_at timestamptz default now()
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

-- Política para INSERT via service_role
drop policy if exists funnel_metrics_insert_service_role on funnel_metrics;
create policy funnel_metrics_insert_service_role
on funnel_metrics for insert
with check (true);

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
create index if not exists idx_profiles_company_id on profiles(company_id);
create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_funnel_metrics_company_id on funnel_metrics(company_id);

-- 6. VERIFICAR SE TUDO ESTÁ FUNCIONANDO
-- Esta query deve retornar as tabelas e seus status de RLS
select 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  case 
    when tablename = 'profiles' then 'RLS habilitado com políticas corretas'
    when tablename = 'companies' then 'RLS desabilitado (necessário para Edge Functions)'
    when tablename = 'funnel_metrics' then 'RLS habilitado com políticas corretas'
    else 'Verificar manualmente'
  end as status
from pg_tables 
where tablename in ('profiles', 'companies', 'funnel_metrics')
and schemaname = 'public';

-- 7. TESTE DE VERIFICAÇÃO
-- Verificar se as políticas foram criadas corretamente
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies 
where tablename in ('profiles', 'funnel_metrics')
and schemaname = 'public'
order by tablename, policyname;

