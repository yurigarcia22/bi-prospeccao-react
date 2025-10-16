// src/components/layout/Header.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useUser } from '../../contexts/UserContext.jsx';
import { AnimatedThemeToggler } from '../ui/AnimatedThemeToggler.jsx';
import { ChevronsUpDown, Settings } from 'lucide-react';

export default function Header() {
  const { userProfile, company, loading } = useUser();
  const SUPER_ADMIN_ID = '3410b050-8f73-43eb-91a4-6b8d3cb316de';
  const isSuperAdmin = userProfile?.id === SUPER_ADMIN_ID;
  const isAdmin = userProfile?.role === 'admin';
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  useEffect(() => {
    if (isSuperAdmin) {
      supabase.from('companies').select('id, name').then(({ data }) => {
        if (data) setAllCompanies(data);
      });
    }
  }, [isSuperAdmin]);
  
  useEffect(() => {
    if (isSuperAdmin && company) {
      setSelectedCompanyId(company.id);
    }
  }, [isSuperAdmin, company]);

  const handleCompanyChange = async (e) => {
    const newCompanyId = e.target.value;
    if (!newCompanyId) return;
    const { error } = await supabase.rpc('set_active_company', { company_id_to_set: newCompanyId });
    if (error) {
      alert("Falha ao trocar de empresa: " + error.message);
    } else {
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    if (isSuperAdmin) {
      await supabase.rpc('set_active_company', { company_id_to_set: null });
    }
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3"> {/* Alterado para gap-3 */}
            {/* --- MUDANÇA PRINCIPAL AQUI --- */}
            {/* Renderização condicional do logo da empresa */}
            {company?.logo_url && (
              <img 
                src={company.logo_url} 
                alt={`${company.name} logo`} 
                className="h-12 w-12 object-contain" // object-contain evita que a imagem estique
              />
            )}
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {loading ? 'Carregando...' : (company?.name || (isSuperAdmin ? 'Visão Geral' : 'Dashboard'))}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* ... (Resto do código do Header sem alterações) ... */}
            {isSuperAdmin && allCompanies.length > 0 && (
              <div className="relative">
                <select value={selectedCompanyId} onChange={handleCompanyChange} className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold rounded-md pl-3 pr-8 py-1">
                  <option value="" disabled>Trocar Visão...</option>
                  {allCompanies.map(comp => <option key={comp.id} value={comp.id}>{comp.name}</option>)}
                </select>
                <ChevronsUpDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
            <span className="text-sm text-gray-700 dark:text-slate-300 hidden sm:inline">
              Olá, {userProfile?.full_name || ''}
              {isSuperAdmin && <span className="font-bold text-red-500 ml-2">[Super Admin]</span>}
            </span>
            {isAdmin && (
              <Link to="/settings" title="Configurações" className="text-slate-500 hover:text-brand-accent">
                <Settings size={20} />
              </Link>
            )}
            <AnimatedThemeToggler /> 
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-semibold">
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}