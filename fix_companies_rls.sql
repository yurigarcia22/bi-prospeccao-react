-- =============================================
-- CORREÇÃO DO RLS PARA COMPANIES
-- =============================================

-- Remover RLS temporariamente da tabela companies para permitir INSERT via service_role
alter table companies disable row level security;

-- OU criar uma política específica para INSERT (recomendado)
-- Descomente as linhas abaixo se quiser manter RLS ativado:

-- alter table companies enable row level security;

-- -- Política para permitir INSERT apenas via service_role (Edge Functions)
-- drop policy if exists companies_insert_service_role on companies;
-- create policy companies_insert_service_role
-- on companies for insert
-- with check (true); -- Permite INSERT para service_role

-- -- Manter a política de SELECT existente
-- drop policy if exists companies_select_own on companies;
-- create policy companies_select_own
-- on companies for select to authenticated
-- using (
--   id in (
--     select company_id 
--     from profiles 
--     where id = auth.uid() 
--     and role = 'admin'
--   )
-- );

