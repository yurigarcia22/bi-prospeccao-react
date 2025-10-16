// src/pages/AuthPage.jsx

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { SignInPage, SignInForm, SignUpForm } from '../components/ui/SignInPage';

// Dados de exemplo para os depoimentos que aparecem na tela
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
    setLoading(false);
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const { fullName, companyName, email, password } = Object.fromEntries(formData.entries());

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

    const { data: { user }, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });

    if (authError) {
      alert('Erro ao criar usuário: ' + authError.message);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName,
      email: email,
      company_id: companyData.id,
      role: 'admin',
      status: 'ativo'
    });

    if (profileError) {
      alert('Erro ao criar o perfil do usuário: ' + profileError.message);
    } else {
      alert('Conta criada com sucesso! Por favor, verifique seu e-mail para confirmar a conta.');
      setIsLoginView(true);
    }
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