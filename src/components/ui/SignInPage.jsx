// src/components/ui/SignInPage.jsx

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// REMOVEMOS O 'GlassInputWrapper' E ESTILIZAMOS OS INPUTS DIRETAMENTE

export const SignInPage = ({
    title = <span className="font-light text-slate-900 dark:text-white tracking-tighter">Bem-vindo</span>,
    description = "Acesse sua conta e continue sua jornada conosco",
    children,
    showCreateAccount,
    onShowCreateAccount,
    onShowLogin,
}) => {
    return (
        <div className="min-h-screen flex flex-col md:flex-row w-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <section className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="flex flex-col gap-6">
                        <h1 className="text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
                        <p className="text-slate-600 dark:text-slate-400">{description}</p>
                        
                        {children}

                        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                        {showCreateAccount ? "Já tem uma conta? " : "Novo na plataforma? "}
                        <button onClick={showCreateAccount ? onShowLogin : onShowCreateAccount} className="text-brand-accent hover:underline transition-colors">
                            {showCreateAccount ? "Entrar" : "Criar Conta"}
                        </button>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export const SignInForm = ({ onSignIn, loading }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <form className="space-y-5" onSubmit={onSignIn}>
            <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Endereço de E-mail</label>
                <input name="email" type="email" required placeholder="Digite seu e-mail" className="w-full mt-1 bg-white dark:bg-slate-800 text-sm p-4 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            </div>
            <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Senha</label>
                <div className="relative mt-1">
                    <input name="password" type={showPassword ? 'text' : 'password'} required placeholder="Digite sua senha" className="w-full bg-white dark:bg-slate-800 text-sm p-4 pr-12 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                        {showPassword ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-slate-400" />}
                    </button>
                </div>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-slate-900 dark:bg-brand-accent py-4 font-medium text-white hover:opacity-90 transition-colors disabled:opacity-50">
                {loading ? 'Entrando...' : 'Entrar'}
            </button>
        </form>
    )
}

export const SignUpForm = ({ onSignUp, loading }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <form className="space-y-4" onSubmit={onSignUp}>
             <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Nome Completo</label>
                <input name="fullName" type="text" required placeholder="Digite seu nome completo" className="w-full mt-1 bg-white dark:bg-slate-800 text-sm p-4 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            </div>
            <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Nome da Empresa</label>
                <input name="companyName" type="text" required placeholder="Digite o nome da sua empresa" className="w-full mt-1 bg-white dark:bg-slate-800 text-sm p-4 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            </div>
            <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Endereço de E-mail</label>
                <input name="email" type="email" required placeholder="Digite seu e-mail" className="w-full mt-1 bg-white dark:bg-slate-800 text-sm p-4 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
            </div>
            <div>
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Senha</label>
                <div className="relative mt-1">
                    <input name="password" type={showPassword ? 'text' : 'password'} required minLength="6" placeholder="Crie uma senha (mín. 6 caracteres)" className="w-full bg-white dark:bg-slate-800 text-sm p-4 pr-12 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-accent" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                        {showPassword ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-slate-400" />}
                    </button>
                </div>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-slate-900 dark:bg-brand-accent py-4 font-medium text-white hover:opacity-90 transition-colors disabled:opacity-50">
                {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
        </form>
    )
}