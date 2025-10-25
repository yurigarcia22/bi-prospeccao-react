# Configuração do Fluxo de Onboarding

Este documento explica como configurar o fluxo de onboarding completo no seu app React com Supabase.

## 📋 O que foi implementado

### 1. Edge Function: `sign-up-with-company`
- **Localização**: `supabase/functions/sign-up-with-company/index.ts`
- **Função**: Cria usuário, empresa e profile usando service_role
- **Configuração**: `verify_jwt = false` (não precisa estar logado)

### 2. Serviço Frontend: `signUpWithCompany`
- **Localização**: `src/services/auth.ts`
- **Função**: Chama a Edge Function e faz login automático

### 3. Estrutura SQL
- **Localização**: `supabase/migrations/001_onboarding_setup.sql`
- **Tabelas**: profiles, companies, funnel_metrics
- **RLS**: Configurado para segurança

## 🔧 Configuração Necessária

### 1. Secrets da Edge Function
No Supabase Dashboard → Edge Functions → Settings → Secrets, adicione:

```
SUPABASE_URL = https://<SEU-PROJETO>.supabase.co
SUPABASE_ANON_KEY = <SUA-ANON-KEY>
SUPABASE_SERVICE_ROLE_KEY = <SUA-SERVICE-ROLE-KEY>
```

**⚠️ IMPORTANTE**: Nunca coloque a SERVICE_ROLE_KEY no frontend!

### 2. Variáveis de Ambiente do Frontend
Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://<SEU-PROJETO>.supabase.co
VITE_SUPABASE_ANON_KEY=<SUA-ANON-KEY>
VITE_SUPABASE_FUNCTIONS_URL=https://<SEU-PROJETO>.supabase.co/functions/v1
```

### 3. Deploy da Edge Function
```bash
# No terminal, na pasta do projeto
supabase functions deploy sign-up-with-company
```

### 4. Aplicar Migração SQL
```bash
# No terminal, na pasta do projeto
supabase db push
```

## 🚀 Como Usar

### Exemplo de Uso no Frontend

```jsx
import { signUpWithCompany } from '../services/auth';

// Em um componente de cadastro
const handleSignUp = async (formData) => {
  try {
    const result = await signUpWithCompany({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      companyName: formData.companyName
    });

    if (result.ok) {
      // Usuário criado e logado automaticamente
      console.log('Sessão criada:', result.session);
      // Redirecionar para dashboard
    }
  } catch (error) {
    console.error('Erro no cadastro:', error.message);
  }
};
```

## 🔍 Testes

### 1. Teste da Edge Function
```bash
curl -X POST https://<SEU-PROJETO>.supabase.co/functions/v1/sign-up-with-company \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "senha123",
    "full_name": "João Silva",
    "company_name": "Empresa Teste"
  }'
```

**Resposta esperada**: `{"ok": true, "company_id": "...", "user_id": "..."}`

### 2. Teste do Login
Após criar o usuário, teste o login normal:
```jsx
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'teste@exemplo.com',
  password: 'senha123'
});
```

### 3. Verificar Profile
```jsx
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .single();

console.log(profile); // Deve mostrar role: "admin" e company_id
```

## 🛡️ Segurança

- ✅ RLS ativado em todas as tabelas
- ✅ Companies não tem INSERT público
- ✅ Edge Function usa service_role
- ✅ Profile criado automaticamente como admin
- ✅ Métricas padrão criadas automaticamente

## 📁 Arquivos Criados/Modificados

- ✅ `supabase/functions/sign-up-with-company/index.ts`
- ✅ `supabase/functions/sign-up-with-company/deno.json`
- ✅ `supabase/config.toml` (atualizado)
- ✅ `src/services/auth.ts`
- ✅ `supabase/migrations/001_onboarding_setup.sql`
- ✅ `src/examples/OnboardingExample.jsx`
- ✅ `env.example`

## 🐛 Troubleshooting

### Erro: "Falha ao criar usuário"
- Verifique se os secrets estão configurados corretamente
- Verifique se a SERVICE_ROLE_KEY está correta

### Erro: "Falha ao criar empresa"
- Verifique se a tabela `companies` existe
- Verifique se não há conflitos de RLS

### Erro: "Falha ao criar profile"
- Verifique se a tabela `profiles` existe
- Verifique se o usuário foi criado corretamente

### Erro de CORS
- A Edge Function já tem headers CORS configurados
- Verifique se a URL da função está correta

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs da Edge Function no Supabase Dashboard
2. Verifique se todas as variáveis de ambiente estão corretas
3. Teste a Edge Function diretamente via curl
4. Verifique se as tabelas e RLS estão configurados corretamente
