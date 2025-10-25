// sign-up-with-company/index.ts
// Cria usuário + empresa + profile com service_role (antes de existir sessão).
// Requer nos Secrets desta função: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json; charset=utf-8",
};

// (opcional) métricas padrão
const defaultFunnelMetrics = [
  { name: "Ligações", key: "ligacoes", display_order: 0 },
  { name: "Conexões", key: "conexoes", display_order: 1 },
  { name: "Conexões c/ Decisor", key: "conexoes_decisor", display_order: 2 },
  { name: "Reuniões Marcadas", key: "reunioes_marcadas", display_order: 3 },
  { name: "Reuniões Realizadas", key: "reunioes_realizadas", display_order: 4 },
  { name: "Reuniões Qualificadas", key: "reunioes_qualificadas", display_order: 5 },
  { name: "Propostas", key: "propostas", display_order: 6 },
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
    }

    const { email, password, full_name, company_name } = await req.json().catch(() => ({}));
    if (!email || !password || !company_name) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: email, password, company_name" }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client admin (bypassa RLS e usa Admin API)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // 1) Cria o usuário (não cria sessão)
    const { data: userCreated, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // ajuste para true se quiser marcar como confirmado
      user_metadata: { full_name: full_name ?? null },
      app_metadata: {},
    });
    if (userErr || !userCreated?.user?.id) {
      return new Response(JSON.stringify({ error: "Falha ao criar usuário", details: userErr?.message }), { status: 400, headers: corsHeaders });
    }
    const newUserId = userCreated.user.id;

    // 2) Cria a empresa
    const { data: companyRow, error: compErr } = await supabaseAdmin
      .from("companies")
      .insert({ name: company_name })
      .select("id, name")
      .maybeSingle();

    if (compErr || !companyRow?.id) {
      return new Response(JSON.stringify({ error: "Usuário criado, mas falhou ao criar empresa", details: compErr?.message }), { status: 400, headers: corsHeaders });
    }
    const newCompanyId = companyRow.id as string;

    // 3) Cria o profile do usuário (admin da nova empresa)
    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: newUserId,
        full_name: full_name ?? null,
        email,
        role: "admin",
        company_id: newCompanyId,
        status: "active",
      });

    if (profErr) {
      return new Response(JSON.stringify({ error: "Empresa criada, mas falhou ao criar profile", details: profErr.message }), { status: 500, headers: corsHeaders });
    }

    // 4) (Opcional) cria métricas padrão
    if (defaultFunnelMetrics.length) {
      const rows = defaultFunnelMetrics.map((m) => ({ ...m, company_id: newCompanyId }));
      const { error: fmErr } = await supabaseAdmin.from("funnel_metrics").insert(rows);
      if (fmErr) console.warn("sign-up-with-company: falha ao criar métricas padrão", fmErr);
    }

    return new Response(JSON.stringify({ ok: true, company_id: newCompanyId, user_id: newUserId }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("sign-up-with-company error", err);
    const msg = err instanceof Error ? err.message : `${err}`;
    return new Response(JSON.stringify({ error: msg }), { status: 400, headers: corsHeaders });
  }
});
