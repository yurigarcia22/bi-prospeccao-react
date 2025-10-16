// supabase/functions/deactivate-user/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userIdToDeactivate } = await req.json()
    if (!userIdToDeactivate) {
      throw new Error('O ID do usuário é obrigatório.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // 1. ATUALIZA O PERFIL para 'inativo'
    // Isso irá esconder o usuário da UI e preservar seus dados.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ status: 'inativo' })
      .eq('id', userIdToDeactivate);

    if (profileError) throw profileError;

    // 2. BLOQUEIA O ACESSO DO USUÁRIO
    // Atualizamos o e-mail para um valor inválido e geramos uma senha aleatória.
    // Isso impede o login sem deletar o registro de autenticação.
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userIdToDeactivate,
      { 
        email: `deleted-${userIdToDeactivate}@example.com`,
        password: crypto.randomUUID(), // Gera uma senha aleatória e segura
        email_confirm: true // Marca como confirmado para evitar e-mails de verificação
      }
    )
    if (authError) throw authError;

    return new Response(JSON.stringify({ message: 'Usuário desativado com sucesso!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})