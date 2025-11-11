-- =============================================
-- CORREÇÃO DO RLS PARA PROSPECCAO_DIARIA E PROPOSTAS
-- =============================================

-- Criar tabela prospeccao_diaria se não existir
create table if not exists prospeccao_diaria (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  metrics jsonb not null default '{}',
  observacoes text,
  user_id uuid not null references auth.users(id) on delete cascade,
  bdr_nome text,
  company_id uuid references companies(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, data)
);

-- Criar tabela propostas se não existir
create table if not exists propostas (
  id uuid primary key default gen_random_uuid(),
  nome_cliente text not null,
  valor numeric(10,2) not null default 0,
  data_proposta date not null,
  status text not null default 'Pendente',
  prospeccao_diaria_id uuid references prospeccao_diaria(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  bdr_nome text,
  company_id uuid references companies(id) on delete cascade,
  created_at timestamptz default now()
);

-- Criar índices para melhor performance
create index if not exists idx_prospeccao_diaria_user_id on prospeccao_diaria(user_id);
create index if not exists idx_prospeccao_diaria_company_id on prospeccao_diaria(company_id);
create index if not exists idx_prospeccao_diaria_data on prospeccao_diaria(data);
create index if not exists idx_propostas_prospeccao_diaria_id on propostas(prospeccao_diaria_id);
create index if not exists idx_propostas_user_id on propostas(user_id);
create index if not exists idx_propostas_company_id on propostas(company_id);

-- Habilitar RLS na tabela prospeccao_diaria (se já não estiver habilitado)
alter table prospeccao_diaria enable row level security;

-- Política para SELECT: usuários podem ver seus próprios registros e registros da mesma empresa
drop policy if exists prospeccao_diaria_select_own on prospeccao_diaria;
create policy prospeccao_diaria_select_own
on prospeccao_diaria for select to authenticated
using (
  user_id = auth.uid() 
  OR 
  company_id in (
    select company_id 
    from profiles 
    where id = auth.uid()
  )
);

-- Política para INSERT: usuários podem inserir seus próprios registros
drop policy if exists prospeccao_diaria_insert_own on prospeccao_diaria;
create policy prospeccao_diaria_insert_own
on prospeccao_diaria for insert to authenticated
with check (
  user_id = auth.uid()
  AND
  company_id in (
    select company_id 
    from profiles 
    where id = auth.uid()
  )
);

-- Política para UPDATE: usuários podem atualizar seus próprios registros
drop policy if exists prospeccao_diaria_update_own on prospeccao_diaria;
create policy prospeccao_diaria_update_own
on prospeccao_diaria for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Política para DELETE: usuários podem deletar seus próprios registros
drop policy if exists prospeccao_diaria_delete_own on prospeccao_diaria;
create policy prospeccao_diaria_delete_own
on prospeccao_diaria for delete to authenticated
using (user_id = auth.uid());

-- =============================================
-- CORREÇÃO DO RLS PARA PROPOSTAS
-- =============================================

-- Habilitar RLS na tabela propostas (se já não estiver habilitado)
alter table propostas enable row level security;

-- Política para SELECT: usuários podem ver propostas da mesma empresa
drop policy if exists propostas_select_own on propostas;
create policy propostas_select_own
on propostas for select to authenticated
using (
  user_id = auth.uid() 
  OR 
  company_id in (
    select company_id 
    from profiles 
    where id = auth.uid()
  )
);

-- Política para INSERT: usuários podem inserir propostas para sua empresa
drop policy if exists propostas_insert_own on propostas;
create policy propostas_insert_own
on propostas for insert to authenticated
with check (
  user_id = auth.uid()
  AND
  company_id in (
    select company_id 
    from profiles 
    where id = auth.uid()
  )
);

-- Política para UPDATE: usuários podem atualizar suas próprias propostas
drop policy if exists propostas_update_own on propostas;
create policy propostas_update_own
on propostas for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Política para DELETE: usuários podem deletar suas próprias propostas
drop policy if exists propostas_delete_own on propostas;
create policy propostas_delete_own
on propostas for delete to authenticated
using (user_id = auth.uid());

-- =============================================
-- VERIFICAÇÃO DAS POLÍTICAS
-- =============================================

-- Verificar se as políticas foram criadas corretamente
select 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies 
where tablename in ('prospeccao_diaria', 'propostas')
and schemaname = 'public'
order by tablename, cmd;

