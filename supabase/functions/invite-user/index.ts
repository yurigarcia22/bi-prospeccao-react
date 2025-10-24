// Conteúdo para: supabase/functions/invite-user/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role } = await req.json()
    if (!email || !role) throw new Error('Email e função são obrigatórios.')
    
    // ... (código para pegar company_id continua o mesmo)
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: adminProfile, error: profileError } = await supabaseClient
      .from('profiles').select('company_id').single()
    if (profileError) throw new Error('Não foi possível encontrar o perfil do administrador.')
    
    const company_id = adminProfile.company_id;
    if (!company_id) throw new Error('Administrador não está associado a nenhuma empresa.')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // --- MUDANÇA PRINCIPAL AQUI ---
    // Adicionamos a opção 'redirectTo' para dizer ao Supabase para onde enviar o usuário.
    const redirectTo = `${Deno.env.get('SUPABASE_URL')!.replace('/supabase', '')}/complete-profile`;
    
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: `${Deno.env.get('APP_BASE_URL')}/complete-profile` } // Linha Nova - Usa o Segredo + Caminho
    )

    if (inviteError) {
      if (inviteError.message.includes('User already registered')) {
        throw new Error('Este e-mail já pertence a um usuário no sistema.');
      }
      throw inviteError
    }
    
    // Cria o perfil com status 'convidado'
    const { error: insertError } = await supabaseAdmin.from('profiles').insert({
      id: inviteData.user.id,
      email: email,
      role: role,
      company_id: company_id,
      status: 'convidado'
    });

    if (insertError) throw insertError;
    
    return new Response(JSON.stringify({ message: `Convite enviado para ${email}.` }), {
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