// Conteúdo para: supabase/functions/update-user-role/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface UpdatePayload {
  userIdToUpdate: string;
  newRole: 'admin' | 'user';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userIdToUpdate, newRole }: UpdatePayload = await req.json()
    if (!userIdToUpdate || !newRole) {
      throw new Error('O ID do usuário e a nova função são obrigatórios.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const { data: updatedUser, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userIdToUpdate,
      { app_metadata: { role: newRole } }
    )
    if (authError) throw authError;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userIdToUpdate);

    if (profileError) throw profileError;

    return new Response(JSON.stringify({ message: 'Função do usuário atualizada com sucesso!' }), {
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