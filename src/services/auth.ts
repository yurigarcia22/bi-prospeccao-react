import { supabase } from '../supabaseClient';

export async function signUpWithCompany({
  email,
  password,
  fullName,
  companyName,
}: {
  email: string;
  password: string;
  fullName?: string | null;
  companyName: string;
}) {
  // Chama a Edge Function (não precisa estar logado)
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/sign-up-with-company`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName ?? null,
      company_name: companyName,
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text);
  const { ok } = JSON.parse(text);
  if (!ok) throw new Error(text);

  // Faz login após criar tudo no backend
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Usuário criado, mas falhou login: ${error.message}`);

  return { ok: true, session: data.session };
}
