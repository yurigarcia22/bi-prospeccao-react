// src/pages/CompleteProfilePage.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { SignInPage } from '../components/ui/SignInPage';

const CompleteProfileForm = ({ onSubmit, loading }) => {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Nome Completo</label>
        <input name="fullName" type="text" required placeholder="Digite seu nome completo" className="w-full mt-1 bg-slate-100 dark:bg-slate-800 text-sm p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent" />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Crie sua Senha</label>
        <input name="password" type="password" required minLength="6" placeholder="Pelo menos 6 caracteres" className="w-full mt-1 bg-slate-100 dark:bg-slate-800 text-sm p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent" />
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-2xl bg-slate-900 dark:bg-brand-accent py-4 font-medium text-white hover:opacity-90 transition-colors disabled:opacity-50">
        {loading ? 'Salvando...' : 'Salvar e Acessar'}
      </button>
    </form>
  )
}

export default function CompleteProfilePage() {
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const { fullName, password } = Object.fromEntries(formData.entries());

    const { data: { user }, error: userError } = await supabase.auth.updateUser({
      password: password,
      data: { full_name: fullName }
    });

    if (userError) {
      alert("Erro ao atualizar perfil: " + userError.message);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        status: 'ativo'
      })
      .eq('id', user.id);
      
    if (profileError) {
      alert("Erro ao finalizar cadastro: " + profileError.message);
      setLoading(false);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <SignInPage
        title={<>Finalize seu Cadastro</>}
        description="Defina seu nome e senha para começar a usar a plataforma."
    >
      <CompleteProfileForm onSubmit={handleUpdateProfile} loading={loading} />
    </SignInPage>
  );
}