// src/pages/AuthPage.jsx

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { SignInPage, SignInForm, SignUpForm } from '../components/ui/SignInPage';

const sampleTestimonials = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
    name: "Sarah Chen",
    handle: "@sarahdigital",
    text: "Plataforma incrível! A experiência do usuário é perfeita e os recursos são exatamente o que eu precisava."
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "Este serviço transformou a forma como trabalho. Design limpo, recursos poderosos e suporte excelente."
  },
];

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const { email, password } = Object.fromEntries(formData.entries());

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.error_description || error.message);
    }
    // Não precisa mais recarregar a página aqui, o UserContext vai detectar a mudança
    setLoading(false);
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const { fullName, companyName, email, password } = Object.fromEntries(formData.entries());

    // 1. Cria a empresa
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({ name: companyName })
      .select()
      .single();

    if (companyError) {
      alert('Erro ao criar a empresa: ' + companyError.message);
      setLoading(false);
      return;
    }

    // 2. Cria o usuário na autenticação (Isso vai disparar o gatilho no Supabase)
    //    Passamos company_id e role via options.data para o gatilho usar
    const { data: { user }, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName, // Passa o nome para o gatilho
          company_id: companyData.id, // Passa o ID da empresa para o gatilho
          role: 'admin', // Define o primeiro usuário como admin
          status: 'ativo' // Define o status inicial
        }
      }
    });

    if (authError) {
      // Se der erro no signUp, talvez a empresa precise ser removida (lógica mais avançada)
      // Por agora, apenas mostramos o erro.
      alert('Erro ao criar usuário: ' + authError.message);
      setLoading(false);
      return;
    }

    // 3. REMOVEMOS A INSERÇÃO MANUAL NO 'profiles' DAQUI
    //    O gatilho do Supabase é responsável por criar o perfil agora.

    // Apenas informamos o usuário
    alert('Conta criada com sucesso! Por favor, verifique seu e-mail para confirmar a conta.');
    setIsLoginView(true); // Muda para a tela de login
    setLoading(false);
  };

  return (
    <SignInPage
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        testimonials={sampleTestimonials}
        showCreateAccount={!isLoginView}
        onShowCreateAccount={() => setIsLoginView(false)}
        onShowLogin={() => setIsLoginView(true)}
    >
      {isLoginView ? (
        <SignInForm onSignIn={handleLogin} loading={loading} />
      ) : (
        <SignUpForm onSignUp={handleSignUp} loading={loading} />
      )}
    </SignInPage>
  );
}