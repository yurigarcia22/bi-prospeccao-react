// src/pages/DiarioPage.jsx

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Copy, Save } from "lucide-react";
import { supabase } from '../supabaseClient';
import { useUser } from '../contexts/UserContext.jsx';
import { ShineBorder } from '../components/ui/ShineBorder.jsx';

// =====================================================================================
// --- COMPONENTES DE UI E LÓGICA ---
// =====================================================================================

function ProgressBar({ label, current, goal }) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-sm">
        <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-brand-accent text-xs">{percentage.toFixed(0)}%</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{current} / {goal}</span>
        </div>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
        <div className="bg-brand-accent h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

const emptyForm = {
  data: new Date().toISOString().slice(0, 10),
  ligacoes: 0, conexoes: 0, conexoes_decisor: 0, reunioes_marcadas: 0,
  reunioes_realizadas: 0, reunioes_qualificadas: 0, propostas: 0,
  observacoes: "",
};

function clampInt(n) { return Math.max(0, Math.floor(+n)) || 0; }

function useHotkeySave(handler) {
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handler();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handler]);
}

function NumberField({ id, label, value, onChange, error }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm text-slate-700 dark:text-slate-200">{label}</label>
      <div className="flex items-stretch gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, clampInt(value) - 1))} className="px-3 rounded-xl bg-slate-200/50 dark:bg-white/5 ring-1 ring-slate-300 dark:ring-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-white/10"><Minus className="h-4 w-4" /></button>
        <input id={id} inputMode="numeric" pattern="[0-9]*" className="w-full text-center rounded-xl bg-slate-200/50 dark:bg-white/5 ring-1 ring-slate-300 dark:ring-white/10 px-3 py-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60" value={value} onChange={(e) => onChange(clampInt(e.target.value))} />
        <button type="button" onClick={() => onChange(clampInt(value) + 1)} className="px-3 rounded-xl bg-slate-200/50 dark:bg-white/5 ring-1 ring-slate-300 dark:ring-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-white/10"><Plus className="h-4 w-4" /></button>
      </div>
      <div className="text-xs h-4">{error ? <span className="text-amber-500 dark:text-amber-300">{error}</span> : null}</div>
    </div>
  );
}

function StickySaveBar({ disabled, status, onSave, onReset, onDuplicate }) {
  return (
    <div className="sticky bottom-0 mt-6 -mx-6 px-6 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button type="button" onClick={onDuplicate} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-slate-200 dark:bg-white/5 ring-1 ring-slate-300 dark:ring-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-300/80 dark:hover:bg-white/10 text-sm"><Copy className="h-4 w-4" /> Duplicar de ontem</button>
          <button type="button" onClick={onReset} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-slate-200 dark:bg-white/5 ring-1 ring-slate-300 dark:ring-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-300/80 dark:hover:bg-white/10 text-sm">Resetar</button>
        </div>
        <button type="button" onClick={onSave} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${disabled ? "bg-slate-400 dark:bg-violet-700/40" : status === "success" ? "bg-emerald-600 hover:bg-emerald-500" : status === "error" ? "bg-rose-600 hover:bg-rose-500" : "bg-brand-accent hover:opacity-90"}`}>
          <Save className="h-4 w-4" />
          {status === "success" ? "Salvo com sucesso!" : status === "error" ? "Erro, tentar novamente" : status === "saving" ? "Salvando..." : "Salvar Lançamento (Ctrl+S)"}
        </button>
      </div>
    </div>
  );
}

function DiarioForm({ onSave }) {
  const [v, setV] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    const draft = localStorage.getItem(`daily-draft:${today}`);
    return draft ? JSON.parse(draft) : { ...emptyForm, data: today };
  });

  const [proposalsDetails, setProposalsDetails] = useState([]);
  const [dateSelection, setDateSelection] = useState("hoje");
  const [status, setStatus] = useState("idle");
  const [errors, setErrors] = useState({});

  useEffect(() => { localStorage.setItem(`daily-draft:${v.data}`, JSON.stringify(v)); }, [v]);
  useHotkeySave(async () => { await handleSave(); });

  function validate(values) {
    const e = {};
    if (values.conexoes > values.ligacoes) e.conexoes = "Deve ser ≤ Ligações";
    if (values.conexoes_decisor > values.conexoes) e.conexoes_decisor = "Deve ser ≤ Conexões";
    if (values.reunioes_realizadas > values.reunioes_marcadas) e.reunioes_realizadas = "Deve ser ≤ Marcadas";
    if (values.reunioes_qualificadas > values.reunioes_realizadas) e.reunioes_qualificadas = "Deve ser ≤ Realizadas";
    if (values.data > new Date().toISOString().slice(0, 10)) e.data = "Não pode lançar no futuro";
    return e;
  }

  useEffect(() => { setErrors(validate(v)); }, [v]);

  useEffect(() => {
    if (dateSelection === 'hoje') {
      update('data', new Date().toISOString().slice(0, 10));
    } else if (dateSelection === 'ontem') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      update('data', yesterday.toISOString().slice(0, 10));
    }
  }, [dateSelection]);

  useEffect(() => {
    const count = v.propostas || 0;
    setProposalsDetails(currentDetails => {
        const newDetails = [...currentDetails];
        while (newDetails.length < count) {
            newDetails.push({ nome_cliente: '', valor: '' });
        }
        return newDetails.slice(0, count);
    });
  }, [v.propostas]);

  const handleProposalDetailChange = (index, field, value) => {
    const newDetails = [...proposalsDetails];
    newDetails[index][field] = value;
    setProposalsDetails(newDetails);
  };

  const invalid = Object.keys(errors).length > 0;
  function update(field, val) { setV((prev) => ({ ...prev, [field]: val })); }
  
  function duplicateFromYesterday() {
    const d = new Date(v.data);
    d.setDate(d.getDate() - 1);
    const key = `daily-draft:${d.toISOString().slice(0, 10)}`;
    const y = localStorage.getItem(key);
    if (y) {
      const parsed = JSON.parse(y);
      setV({ ...parsed, data: v.data });
      setDateSelection('personalizado');
      alert("Dados de ontem carregados como rascunho!");
    } else {
      alert("Nenhum rascunho de ontem encontrado.");
    }
  }

  function resetAll() {
    setV((prev) => ({ ...emptyForm, data: prev.data }));
    setProposalsDetails([]);
  }

  async function handleSave() {
    if (invalid) { alert("Formulário inválido. Verifique os erros."); return; }
    for (const p of proposalsDetails) {
        if (!p.nome_cliente || !p.valor) {
            alert("Por favor, preencha o nome e o valor para todas as propostas.");
            return;
        }
    }
    setStatus("saving");
    try {
      await onSave(v, proposalsDetails);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
      resetAll();
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <div className="relative bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-6">Lançamento Diário</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <label htmlFor="date-selection" className="text-sm text-slate-700 dark:text-slate-200">Data do Lançamento</label>
                <select id="date-selection" value={dateSelection} onChange={(e) => setDateSelection(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2.5 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md dark:text-white">
                    <option value="hoje">Hoje</option>
                    <option value="ontem">Ontem</option>
                    <option value="personalizado">Personalizado</option>
                </select>
            </div>
            {dateSelection === 'personalizado' && (
                <div className="space-y-1.5">
                    <label htmlFor="data" className="text-sm text-slate-700 dark:text-slate-200">Data Personalizada</label>
                    <input id="data" type="date" value={v.data} onChange={(e) => update("data", e.target.value)} className={`w-full rounded-xl bg-slate-200/50 dark:bg-white/5 ring-1 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/60 ${errors.data ? "ring-amber-400/60" : "ring-slate-300 dark:ring-white/10"}`} />
                    <div className="text-xs h-4">{errors.data ? <span className="text-amber-500 dark:text-amber-300">{errors.data}</span> : null}</div>
                </div>
            )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-6">
            <NumberField id="ligacoes" label="Ligações" value={v.ligacoes} onChange={(n) => update("ligacoes", n)} />
            <NumberField id="conexoes" label="Conexões" value={v.conexoes} onChange={(n) => update("conexoes", n)} error={errors.conexoes} />
            <NumberField id="conexoes_decisor" label="Conexões c/ Decisor" value={v.conexoes_decisor} onChange={(n) => update("conexoes_decisor", n)} error={errors.conexoes_decisor} />
            <NumberField id="reunioes_marcadas" label="Reuniões Marcadas" value={v.reunioes_marcadas} onChange={(n) => update("reunioes_marcadas", n)} />
            <NumberField id="reunioes_realizadas" label="Reuniões Realizadas" value={v.reunioes_realizadas} onChange={(n) => update("reunioes_realizadas", n)} error={errors.reunioes_realizadas} />
            <NumberField id="reunioes_qualificadas" label="Reuniões Qualificadas" value={v.reunioes_qualificadas} onChange={(n) => update("reunioes_qualificadas", n)} error={errors.reunioes_qualificadas} />
            <NumberField id="propostas" label="Propostas Criadas" value={v.propostas} onChange={(n) => update("propostas", n)} />
        </div>

        <AnimatePresence>
          {v.propostas > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4"
            >
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Detalhes das Propostas Criadas</h3>
              {proposalsDetails.map((p, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <label htmlFor={`cliente-${index}`} className="text-sm font-medium text-slate-700 dark:text-slate-300">Cliente {index + 1}</label>
                    <input type="text" id={`cliente-${index}`} value={p.nome_cliente} onChange={(e) => handleProposalDetailChange(index, 'nome_cliente', e.target.value)} required placeholder="Nome da Empresa" className="mt-1 block w-full p-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" />
                  </div>
                   <div>
                    <label htmlFor={`valor-${index}`} className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor (R$) {index + 1}</label>
                    <input type="number" id={`valor-${index}`} step="0.01" value={p.valor} onChange={(e) => handleProposalDetailChange(index, 'valor', e.target.value)} required placeholder="1500.00" className="mt-1 block w-full p-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="mt-4 space-y-1.5"><label htmlFor="obs" className="text-sm text-slate-700 dark:text-slate-200">Observações</label><textarea id="obs" rows={3} value={v.observacoes} onChange={(e) => update("observacoes", e.target.value.slice(0, 500))} placeholder="Alguma nota importante sobre o dia..." className="w-full rounded-xl bg-slate-200/50 dark:bg-white/5 ring-1 ring-slate-300 dark:ring-white/10 px-3 py-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60" /><div className="text-xs text-slate-500 dark:text-slate-400 text-right">{v.observacoes.length}/500</div></div>
        
        <StickySaveBar disabled={invalid || status === "saving"} status={status} onSave={handleSave} onReset={resetAll} onDuplicate={duplicateFromYesterday} />
        <ShineBorder />
    </div>
  );
}

// =====================================================================================
// --- COMPONENTE PRINCIPAL DA PÁGINA ---
// =====================================================================================

export default function DiarioPage() {
  const { userProfile, company, session } = useUser();
  const [goals, setGoals] = useState({ ligacoes: 0, reunioes: 0, propostas: 0 });
  const [progress, setProgress] = useState({ 
    weekly: { ligacoes: 0, reunioes: 0, propostas: 0 },
    monthly: { ligacoes: 0, reunioes: 0, propostas: 0 } 
  });

  const fetchProgressAndGoals = async () => {
    if (!session?.user?.id) return;
    const today = new Date();
    const ano = today.getFullYear();
    const mes = today.getMonth() + 1;
    
    const { data: metasData } = await supabase.from('metas').select('meta_ligacoes_mensal, meta_reunioes_mensal, meta_propostas_mensal').eq('user_id', session.user.id).eq('ano', ano).eq('mes', mes).maybeSingle();
    setGoals({ ligacoes: metasData?.meta_ligacoes_mensal || 0, reunioes: metasData?.meta_reunioes_mensal || 0, propostas: metasData?.meta_propostas_mensal || 0 });

    const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const fimMes = new Date(ano, mes, 0).toISOString().slice(0, 10);
    const { data: monthlyPerformance } = await supabase.from('prospeccao_diaria').select('ligacoes, reunioes_marcadas, propostas, data').eq('user_id', session.user.id).gte('data', inicioMes).lte('data', fimMes);
    
    if (!monthlyPerformance) return;

    const monthlyProgress = monthlyPerformance.reduce((acc, row) => ({ ligacoes: acc.ligacoes + (row.ligacoes || 0), reunioes: acc.reunioes + (row.reunioes_marcadas || 0), propostas: acc.propostas + (row.propostas || 0) }), { ligacoes: 0, reunioes: 0, propostas: 0 });
    
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyPerformance = monthlyPerformance.filter(d => new Date(d.data + 'T00:00:00') >= startOfWeek);
    const weeklyProgress = weeklyPerformance.reduce((acc, row) => ({ ligacoes: acc.ligacoes + (row.ligacoes || 0), reunioes: acc.reunioes + (row.reunioes_marcadas || 0), propostas: acc.propostas + (row.propostas || 0) }), { ligacoes: 0, reunioes: 0, propostas: 0 });

    setProgress({ weekly: weeklyProgress, monthly: monthlyProgress });
  };
  
  useEffect(() => {
    fetchProgressAndGoals();
  }, [session]);
  
  const handleSaveToSupabase = async (formData, proposalsData) => {
    if (!userProfile || !company || !session) throw new Error("Usuário ou empresa não encontrados.");
    
    const dailyRecord = {
      data: formData.data, ligacoes: formData.ligacoes, conexoes: formData.conexoes,
      conexoes_decisor: formData.conexoes_decisor, reunioes_marcadas: formData.reunioes_marcadas,
      reunioes_realizadas: formData.reunioes_realizadas, reunioes_qualificadas: formData.reunioes_qualificadas,
      propostas: formData.propostas, observacoes: formData.observacoes,
      user_id: session.user.id, bdr_nome: userProfile.full_name, company_id: company.id,
    };

    const { data: insertedDaily, error: dailyError } = await supabase
      .from('prospeccao_diaria')
      .insert(dailyRecord)
      .select()
      .single();

    if (dailyError) throw dailyError;

    if (proposalsData && proposalsData.length > 0) {
      const proposalsToInsert = proposalsData.map(p => ({
        nome_cliente: p.nome_cliente,
        valor: parseFloat(p.valor) || 0,
        data_proposta: formData.data,
        status: 'Pendente',
        prospeccao_diaria_id: insertedDaily.id,
        user_id: session.user.id,
        bdr_nome: userProfile.full_name,
        company_id: company.id,
      }));

      const { error: proposalsError } = await supabase.from('propostas').insert(proposalsToInsert);
      if (proposalsError) throw proposalsError;
    }
    
    await fetchProgressAndGoals(); 
  };
  
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="relative bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6">Acompanhamento de Metas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg space-y-6">
            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 text-center">Progresso Semanal</h3>
            <ProgressBar label="Ligações" current={progress.weekly.ligacoes} goal={Math.ceil(goals.ligacoes / 4.33)} />
            <ProgressBar label="Reuniões" current={progress.weekly.reunioes} goal={Math.ceil(goals.reunioes / 4.33)} />
            <ProgressBar label="Propostas" current={progress.weekly.propostas} goal={Math.ceil(goals.propostas / 4.33)} />
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg space-y-6">
            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 text-center">Progresso Mensal</h3>
            <ProgressBar label="Ligações" current={progress.monthly.ligacoes} goal={goals.ligacoes} />
            <ProgressBar label="Reuniões" current={progress.monthly.reunioes} goal={goals.reunioes} />
            <ProgressBar label="Propostas" current={progress.monthly.propostas} goal={goals.propostas} />
          </div>
        </div>
        <ShineBorder />
      </div>

      <DiarioForm onSave={handleSaveToSupabase} />
    </div>
  );
}