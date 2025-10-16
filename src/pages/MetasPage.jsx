// src/pages/MetasPage.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../contexts/UserContext.jsx';
import { ShineBorder } from '../components/ui/ShineBorder.jsx';
import { Save } from 'lucide-react';

function ProgressBar({ label, current, goal }) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-sm">
        <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
        <div className="flex items-center space-x-2">
          <span className={`font-semibold text-xs ${percentage >= 100 ? 'text-emerald-500' : 'text-brand-accent'}`}>{percentage.toFixed(0)}%</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{current} / {goal}</span>
        </div>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
        <div className={`${percentage >= 100 ? 'bg-emerald-500' : 'bg-brand-accent'} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    </div>
  );
}

export default function MetasPage() {
  const { userProfile, company, session } = useUser();
  const isAdmin = userProfile?.role === 'admin';

  const [bdrs, setBdrs] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(isAdmin ? 'todos' : session?.user?.id);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [goalFormData, setGoalFormData] = useState({ meta_ligacoes_mensal: 0, meta_reunioes_mensal: 0, meta_propostas_mensal: 0 });
  const [formStatus, setFormStatus] = useState('idle');
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin && company?.id) {
      supabase.from('profiles').select('id, full_name').eq('company_id', company.id)
        .then(({ data }) => { if (data) setBdrs(data.filter(p => p.full_name)); });
    }
  }, [isAdmin, company]);

  useEffect(() => {
    if (!company?.id) { setLoading(false); return; }
    if (isAdmin && selectedUserId === 'todos' && bdrs.length === 0) { setLoading(false); return; }

    const fetchData = async () => {
      setLoading(true);
      const userIdsToFetch = isAdmin && selectedUserId === 'todos' ? bdrs.map(bdr => bdr.id) : [selectedUserId];
      if (userIdsToFetch.length === 0 && selectedUserId !== 'todos') {
          setProgressData([]); setLoading(false); return;
      }
      
      const { data: metasData } = await supabase.from('metas').select('*, profiles(id, full_name)').in('user_id', userIdsToFetch).eq('ano', selectedYear).eq('mes', selectedMonth);
      
      if (selectedUserId !== 'todos') {
          const singleGoal = metasData?.find(m => m.user_id === selectedUserId);
          setGoalFormData({
              meta_ligacoes_mensal: singleGoal?.meta_ligacoes_mensal || 0,
              meta_reunioes_mensal: singleGoal?.meta_reunioes_mensal || 0,
              meta_propostas_mensal: singleGoal?.meta_propostas_mensal || 0,
          });
      }
      
      const inicioMes = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const fimMes = new Date(selectedYear, selectedMonth, 0).toISOString().slice(0, 10);
      const { data: performanceData } = await supabase.from('prospeccao_diaria').select('user_id, ligacoes, reunioes_marcadas, propostas').in('user_id', userIdsToFetch).gte('data', inicioMes).lte('data', fimMes);
      
      const allBdrProfiles = isAdmin ? bdrs : [{ id: session.user.id, full_name: userProfile.full_name }];
      const combinedData = (isAdmin && selectedUserId === 'todos' ? allBdrProfiles : allBdrProfiles.filter(p => p.id === selectedUserId)).map(profile => {
          if (!profile) return null;
          const userMeta = metasData?.find(m => m.user_id === profile.id);
          const userPerformance = (performanceData || []).filter(p => p.user_id === profile.id);
          const progress = userPerformance.reduce((acc, row) => ({ ligacoes: acc.ligacoes + (row.ligacoes || 0), reunioes: acc.reunioes + (row.reunioes_marcadas || 0), propostas: acc.propostas + (row.propostas || 0) }), { ligacoes: 0, reunioes: 0, propostas: 0 });
          return {
              userId: profile.id, name: profile.full_name,
              goals: { ligacoes: userMeta?.meta_ligacoes_mensal || 0, reunioes: userMeta?.meta_reunioes_mensal || 0, propostas: userMeta?.meta_propostas_mensal || 0, },
              progress
          };
      }).filter(Boolean);
      
      setProgressData(combinedData);
      setLoading(false);
    };
    
    fetchData();
  }, [selectedUserId, selectedMonth, selectedYear, isAdmin, company, bdrs, session, userProfile]);

  const teamTotals = progressData.reduce((acc, user) => {
      acc.goals.ligacoes += user.goals.ligacoes;
      acc.goals.reunioes += user.goals.reunioes;
      acc.goals.propostas += user.goals.propostas;
      acc.progress.ligacoes += user.progress.ligacoes;
      acc.progress.reunioes += user.progress.reunioes;
      acc.progress.propostas += user.progress.propostas;
      return acc;
  }, {
      goals: { ligacoes: 0, reunioes: 0, propostas: 0 },
      progress: { ligacoes: 0, reunioes: 0, propostas: 0 }
  });

  const handleGoalsChange = (e) => {
    const { name, value } = e.target;
    setGoalFormData(prev => ({ ...prev, [name]: Number(value) || 0 }));
  };

  const handleSaveGoals = async () => {
    if (selectedUserId === 'todos' || !selectedUserId) { alert("Selecione um BDR específico para definir uma meta."); return; }
    setFormStatus('saving');
    const { error } = await supabase.from('metas').upsert({ user_id: selectedUserId, ano: selectedYear, mes: selectedMonth, company_id: company.id, ...goalFormData }, { onConflict: 'user_id, ano, mes' });
    if (error) {
      setFormStatus('error'); alert(`Erro ao salvar metas: ${error.message}`);
    } else {
      setFormStatus('success');
      setTimeout(() => setFormStatus('idle'), 2000);
    }
  };

  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="relative bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6">Metas e Performance</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          {isAdmin && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Visualização</label>
              <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md dark:text-white">
                <option value="todos">Toda a Equipe</option>
                {bdrs.map(bdr => <option key={bdr.id} value={bdr.id}>{bdr.full_name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mês</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md dark:text-white">
              {meses.map((mes, index) => <option key={index} value={index + 1}>{mes}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ano</label>
            <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="mt-1 block w-full p-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" />
          </div>
        </div>
        
        {isAdmin && selectedUserId !== 'todos' && !loading && (
             <div className="space-y-4 p-6 rounded-lg bg-slate-50 dark:bg-slate-800/50 mb-8 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200"><Save size={20}/> Definir Metas para <span className="text-brand-accent">{bdrs.find(b=>b.id === selectedUserId)?.full_name || '...'}</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="text-sm text-slate-600 dark:text-slate-300">Meta de Ligações</label><input type="number" name="meta_ligacoes_mensal" value={goalFormData.meta_ligacoes_mensal} onChange={handleGoalsChange} className="mt-1 block w-full p-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" /></div>
                    <div><label className="text-sm text-slate-600 dark:text-slate-300">Meta de Reuniões</label><input type="number" name="meta_reunioes_mensal" value={goalFormData.meta_reunioes_mensal} onChange={handleGoalsChange} className="mt-1 block w-full p-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" /></div>
                    <div><label className="text-sm text-slate-600 dark:text-slate-300">Meta de Propostas</label><input type="number" name="meta_propostas_mensal" value={goalFormData.meta_propostas_mensal} onChange={handleGoalsChange} className="mt-1 block w-full p-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" /></div>
                </div>
                <button onClick={handleSaveGoals} disabled={formStatus === 'saving'} className={`w-full md:w-auto mt-4 px-6 py-2 font-bold text-white rounded-lg transition-colors disabled:opacity-50 ${formStatus === 'success' ? 'bg-emerald-500' : 'bg-brand-accent hover:opacity-90'}`}>
                    {formStatus === 'saving' ? 'Salvando...' : formStatus === 'success' ? 'Salvo!' : 'Salvar Metas'}
                </button>
            </div>
        )}
        
        {loading ? <div className="text-center p-8 text-slate-500">Carregando dados de performance...</div>
        : (
            <>
            {isAdmin && selectedUserId === 'todos' ? (
              progressData.length > 0 ? (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg space-y-6">
                  <h3 className="text-lg font-semibold text-center text-slate-800 dark:text-slate-200">Progresso Geral da Equipe</h3>
                  <ProgressBar label="Ligações" current={teamTotals.progress.ligacoes} goal={teamTotals.goals.ligacoes} />
                  <ProgressBar label="Reuniões" current={teamTotals.progress.reunioes} goal={teamTotals.goals.reunioes} />
                  <ProgressBar label="Propostas" current={teamTotals.progress.propostas} goal={teamTotals.goals.propostas} />
                </div>
              ) : (
                <div className="text-center p-8 text-slate-500">Nenhum dado da equipe para exibir no período selecionado.</div>
              )
            ) : (
                progressData.length > 0 && progressData[0] ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg space-y-6">
                        <h3 className="text-lg font-semibold text-center text-slate-800 dark:text-slate-200">Progresso de {progressData[0].name}</h3>
                        <ProgressBar label="Ligações" current={progressData[0].progress.ligacoes} goal={progressData[0].goals.ligacoes} />
                        <ProgressBar label="Reuniões" current={progressData[0].progress.reunioes} goal={progressData[0].goals.reunioes} />
                        <ProgressBar label="Propostas" current={progressData[0].progress.propostas} goal={progressData[0].goals.propostas} />
                    </div>
                ) : (
                    <div className="text-center p-8 text-slate-500">Nenhum dado de meta ou progresso para a seleção atual.</div>
                )
            )}
            </>
        )}
        <ShineBorder />
      </div>
    </div>
  );
}