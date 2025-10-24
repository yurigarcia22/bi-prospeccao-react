// invite-user/index.ts
// Convite de usuário com CORS, validação, checagem de permissão e uso do service_role.
// Requer secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json; charset=utf-8",
};

serve(async (req: Request) => {
  // 1) CORS (pré-flight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2) Método
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    // 3) Body
    const { email, role, company_id } = await req.json().catch(() => ({}));
    if (!email || !role || !company_id) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: email, role, company_id" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 4) Clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client com o token do usuário logado (p/ validar permissão)
    const authHeader = req.headers.get("authorization") ?? "";
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Client admin (bypassa RLS, cria user e profile)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // 5) Quem está chamando?
    const {
      data: { user: requester },
      error: sessionErr,
    } = await supabaseUser.auth.getUser();

    if (sessionErr || !requester) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // 6) Carrega o profile do solicitante
    const { data: requesterProfile, error: profileErr } = await supabaseUser
      .from("profiles")
      .select("id, role, company_id")
      .eq("id", requester.id)
      .maybeSingle();

    if (profileErr) {
      return new Response(
        JSON.stringify({
          error: "Falha ao carregar perfil do solicitante",
          details: profileErr.message,
        }),
        { status: 400, headers: corsHeaders }
      );
    }
    if (!requesterProfile) {
      return new Response(
        JSON.stringify({ error: "Perfil do solicitante não encontrado (RLS?)." }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 7) Verifica se é Super Admin
    let isSuperAdmin = false;
    {
      const { data: superCfg } = await supabaseUser
        .from("super_admin_config")
        .select("super_admin_id")
        .eq("super_admin_id", requester.id)
        .maybeSingle();
      isSuperAdmin = !!superCfg;
    }

    // 8) Regras: Super Admin pode tudo; Admin só na própria company
    const isCompanyAdmin = requesterProfile.role === "admin";
    const sameCompany = requesterProfile.company_id === company_id;

    if (!(isSuperAdmin || (isCompanyAdmin && sameCompany))) {
      return new Response(
        JSON.stringify({ error: "Sem permissão para convidar para esta empresa." }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 9) Cria usuário (envia e-mail de convite)
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        app_metadata: { company_id, role },
        user_metadata: { company_id, role },
        // emailRedirectTo: "https://seu-dominio.com/auth/callback" // se quiser customizar
      });

    if (createErr) {
      return new Response(
        JSON.stringify({ error: "Falha ao convidar usuário", details: createErr.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    const newUserId = created.user?.id;
    if (!newUserId) {
      return new Response(JSON.stringify({ error: "Usuário criado, mas id ausente" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // 10) Cria profile (service_role ignora RLS)
    const { error: profileInsertErr } = await supabaseAdmin.from("profiles").insert({
      id: newUserId,
      full_name: null,
      role,
      company_id,
      status: "active",
      email, // se existir coluna email em profiles
    });

    if (profileInsertErr) {
      return new Response(
        JSON.stringify({
          error: "Convite enviado, mas falhou ao criar profile",
          details: profileInsertErr.message,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ ok: true, user_id: newUserId }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("invite-user error", err);
    const message = err instanceof Error ? err.message : `${err}`;
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
