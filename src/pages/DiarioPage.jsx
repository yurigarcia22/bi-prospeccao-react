// src/pages/DiarioPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Copy, Save } from "lucide-react";
import { supabase } from '../supabaseClient';
import { useUser } from '../contexts/UserContext.jsx';
import { ShineBorder } from '../components/ui/ShineBorder.jsx';

// --- Componentes ProgressBar, clampInt, useHotkeySave, NumberField, StickySaveBar (permanecem iguais) ---
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

const getEmptyFormState = (funnelMetrics) => {
    const initialMetrics = {};
    if (funnelMetrics) {
        funnelMetrics.forEach(metric => { initialMetrics[metric.key] = 0; });
    }
    return {
        data: new Date().toISOString().slice(0, 10),
        metrics: initialMetrics,
        observacoes: "",
    };
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

function NumberField({ id, label, value, onChange }) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-sm text-slate-700 dark:text-slate-200">{label}</label>
            <div className="flex items-stretch gap-2">
                <button type="button" onClick={() => onChange(Math.max(0, clampInt(value) - 1))} className="px-3 rounded-xl bg-slate-200/50 dark:bg-white/5 ring-1 ring-slate-300 dark:ring-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-white/10"><Minus className="h-4 w-4" /></button>
                <input id={id} inputMode="numeric" pattern="[0-9]*" className="w-full text-center rounded-xl bg-slate-200/50 dark:bg-white/5 ring-1 ring-slate-300 dark:ring-white/10 px-3 py-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60" value={value} onChange={(e) => onChange(clampInt(e.target.value))} />
                <button type="button" onClick={() => onChange(clampInt(value) + 1)} className="px-3 rounded-xl bg-slate-200/50 dark:bg-white/5 ring-1 ring-slate-300 dark:ring-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-white/10"><Plus className="h-4 w-4" /></button>
            </div>
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
// --- Fim dos Componentes ---

function DiarioForm({ onSave, funnelMetrics }) {
    const [v, setV] = useState(() => getEmptyFormState(funnelMetrics));
    const [proposalsDetails, setProposalsDetails] = useState([]);
    const [dateSelection, setDateSelection] = useState("hoje");
    const [status, setStatus] = useState("idle");

    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);
        const currentDataDate = v.data || today; // Usa a data atual do estado ou hoje
        const draft = localStorage.getItem(`daily-draft:${currentDataDate}`);

        let initialState;
        if (draft) {
            const parsedDraft = JSON.parse(draft);
            const draftMetrics = parsedDraft.metrics || {};
            const initialMetrics = {};
            funnelMetrics.forEach(metric => {
                initialMetrics[metric.key] = draftMetrics[metric.key] || 0; // Preenche com rascunho ou 0
            });
             initialState = { ...getEmptyFormState(funnelMetrics), ...parsedDraft, metrics: initialMetrics, data: currentDataDate };
        } else {
            initialState = { ...getEmptyFormState(funnelMetrics), data: currentDataDate };
        }
        setV(initialState);

    }, [v.data, funnelMetrics]); // Depende da data e das métricas

    useEffect(() => { localStorage.setItem(`daily-draft:${v.data}`, JSON.stringify(v)); }, [v]);
    useHotkeySave(async () => { await handleSave(); });

    useEffect(() => {
        if (dateSelection === 'hoje') {
            updateDate(new Date().toISOString().slice(0, 10));
        } else if (dateSelection === 'ontem') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            updateDate(yesterday.toISOString().slice(0, 10));
        }
        // Não faz nada se for 'personalizado' para manter a data escolhida
    }, [dateSelection]);

    // LÓGICA CENTRAL: Encontra a métrica de propostas E CALCULA A CONTAGEM
    const proposalsMetric = funnelMetrics.find(m => m.key === 'propostas');
    const proposalsCount = proposalsMetric && v.metrics ? (v.metrics[proposalsMetric.key] || 0) : 0;

    useEffect(() => {
        // Atualiza os detalhes da proposta com base na contagem
        setProposalsDetails(currentDetails => {
            const newDetails = [...currentDetails];
            while (newDetails.length < proposalsCount) {
                newDetails.push({ nome_cliente: '', valor: '' });
            }
            return newDetails.slice(0, proposalsCount); // Garante que não haja extras
        });
    }, [proposalsCount]); // Depende SÓ da contagem


    const handleProposalDetailChange = (index, field, value) => {
        const newDetails = [...proposalsDetails];
        if(newDetails[index]) { // Verifica se o índice existe
             newDetails[index][field] = value;
             setProposalsDetails(newDetails);
        }
    };

    function updateMetric(key, val) {
        setV(prev => ({
            ...prev,
            metrics: {
                ...(prev.metrics || {}), // Garante que metrics exista
                [key]: val,
            }
        }));
    }

    function updateDate(newDate) {
        // Limpa o rascunho antigo antes de mudar a data
        localStorage.removeItem(`daily-draft:${v.data}`);
        setV(prev => ({ ...prev, data: newDate }));
        // O useEffect [v.data, funnelMetrics] vai recarregar o estado para a nova data
    }

    function updateObs(newObs) {
        setV(prev => ({ ...prev, observacoes: newObs }));
    }

    function duplicateFromYesterday() {
        const d = new Date(v.data);
        d.setDate(d.getDate() - 1);
        const yesterdayDate = d.toISOString().slice(0, 10);
        const key = `daily-draft:${yesterdayDate}`;
        const y = localStorage.getItem(key);
        if (y) {
            const parsed = JSON.parse(y);
            // Mantém a data atual, mas pega as métricas e obs de ontem
            const currentMetricsWithYesterdayValues = { ...getEmptyFormState(funnelMetrics).metrics };
            for(const metricKey in parsed.metrics) {
                if(currentMetricsWithYesterdayValues.hasOwnProperty(metricKey)){
                    currentMetricsWithYesterdayValues[metricKey] = parsed.metrics[metricKey];
                }
            }
            setV(prev => ({
                ...prev,
                 metrics: currentMetricsWithYesterdayValues,
                 observacoes: parsed.observacoes || ""
             }));
            // Não muda a data selecionada
            alert("Dados de ontem carregados como rascunho!");
        } else {
            alert("Nenhum rascunho de ontem encontrado.");
        }
    }

    function resetAll() {
        setV((prev) => ({ ...getEmptyFormState(funnelMetrics), data: prev.data }));
        setProposalsDetails([]);
    }

    async function handleSave() {
        if (proposalsCount > 0) {
            for (const p of proposalsDetails) {
                if (!p.nome_cliente || !p.valor) {
                    alert("Por favor, preencha o nome e o valor para todas as propostas.");
                    return;
                }
            }
        }
        setStatus("saving");
        try {
            await onSave(v, proposalsDetails);
            setStatus("success");
            setTimeout(() => setStatus("idle"), 2000);
            resetAll(); // Reseta após o sucesso
        } catch (err) {
            console.error(err);
            setStatus("error");
            // Não reseta em caso de erro para o usuário não perder dados
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
                        <input id="data" type="date" value={v.data} onChange={(e) => updateDate(e.target.value)} className="w-full rounded-xl bg-slate-200/50 dark:bg-white/5 ring-1 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/60 ring-slate-300 dark:ring-white/10" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-6">
                {funnelMetrics.map(metric => (
                    <NumberField
                        key={metric.key}
                        id={metric.key}
                        label={metric.name}
                        value={v.metrics?.[metric.key] || 0}
                        onChange={(n) => updateMetric(metric.key, n)}
                    />
                ))}
            </div>

            {/* A LÓGICA DE RENDERIZAÇÃO CONDICIONAL */}
            <AnimatePresence>
                {proposalsMetric && proposalsCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4 overflow-hidden" // Adicionado overflow-hidden
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

            <div className="mt-4 space-y-1.5">
                <label htmlFor="obs" className="text-sm text-slate-700 dark:text-slate-200">Observações</label>
                <textarea id="obs" rows={3} value={v.observacoes || ''} onChange={(e) => updateObs(e.target.value.slice(0, 500))} placeholder="Alguma nota importante sobre o dia..." className="w-full rounded-xl bg-slate-200/50 dark:bg-white/5 ring-1 ring-slate-300 dark:ring-white/10 px-3 py-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60" />
                <div className="text-xs text-slate-500 dark:text-slate-400 text-right">{v.observacoes?.length || 0}/500</div>
            </div>

            <StickySaveBar status={status} onSave={handleSave} onReset={resetAll} onDuplicate={duplicateFromYesterday} />
            <ShineBorder />
        </div>
    );
}


export default function DiarioPage() {
    const { userProfile, company, session, funnelMetrics, loading } = useUser();
    const [goals, setGoals] = useState({});
    const [progress, setProgress] = useState({ weekly: {}, monthly: {} });

    const fetchProgressAndGoals = useCallback(async () => {
        if (!session?.user?.id || !funnelMetrics || funnelMetrics.length === 0) return; // Verifica se funnelMetrics existe

        const today = new Date();
        const ano = today.getFullYear();
        const mes = today.getMonth() + 1;

        const { data: metasData } = await supabase.from('metas').select('metric_goals').eq('user_id', session.user.id).eq('ano', ano).eq('mes', mes).maybeSingle();
        const userGoals = metasData?.metric_goals || {};
        setGoals(userGoals);

        const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
        const fimMes = new Date(ano, mes, 0).toISOString().slice(0, 10);
        const { data: monthlyPerformance } = await supabase.from('prospeccao_diaria').select('metrics, data').eq('user_id', session.user.id).gte('data', inicioMes).lte('data', fimMes);

        if (!monthlyPerformance) {
             setProgress({ weekly: {}, monthly: {} }); // Reseta se não houver dados
             return;
        };

        const monthlyProgress = monthlyPerformance.reduce((acc, row) => {
            if(row.metrics){ // Verifica se metrics existe
                for (const key in row.metrics) {
                    if(acc.hasOwnProperty(key) || funnelMetrics.some(fm => fm.key === key)){ // Soma apenas se for uma métrica válida
                        acc[key] = (acc[key] || 0) + (row.metrics[key] || 0);
                    }
                }
            }
            return acc;
        }, {});

        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const weeklyPerformance = monthlyPerformance.filter(d => new Date(d.data + 'T00:00:00') >= startOfWeek);
        const weeklyProgress = weeklyPerformance.reduce((acc, row) => {
             if(row.metrics){
                for (const key in row.metrics) {
                     if(acc.hasOwnProperty(key) || funnelMetrics.some(fm => fm.key === key)){
                        acc[key] = (acc[key] || 0) + (row.metrics[key] || 0);
                     }
                }
            }
            return acc;
        }, {});

        setProgress({ weekly: weeklyProgress, monthly: monthlyProgress });
    }, [session, funnelMetrics]);

    useEffect(() => {
        fetchProgressAndGoals();
    }, [fetchProgressAndGoals]);

    const handleSaveToSupabase = async (formData, proposalsData) => {
        if (!userProfile || !company || !session) throw new Error("Usuário ou empresa não encontrados.");

        const dailyRecord = {
            data: formData.data,
            metrics: formData.metrics,
            observacoes: formData.observacoes,
            user_id: session.user.id,
            bdr_nome: userProfile.full_name,
            company_id: company.id,
        };

        const { data: insertedDaily, error: dailyError } = await supabase
            .from('prospeccao_diaria')
            .upsert(dailyRecord, { onConflict: 'user_id, data' }) // Usa upsert para evitar duplicatas no mesmo dia
            .select()
            .single();

        if (dailyError) throw dailyError;

        const proposalsMetric = funnelMetrics.find(m => m.key === 'propostas');
        if (proposalsMetric && proposalsData && proposalsData.length > 0) {
            // Primeiro, deleta propostas antigas ligadas a este lançamento diário (caso esteja editando)
            await supabase.from('propostas').delete().eq('prospeccao_diaria_id', insertedDaily.id);

            // Depois, insere as novas
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
        } else if (proposalsMetric) {
             // Se não há proposalsData mas existe a métrica, garante que propostas antigas sejam deletadas
             await supabase.from('propostas').delete().eq('prospeccao_diaria_id', insertedDaily.id);
        }

        await fetchProgressAndGoals();
    };

    const metricsForProgress = funnelMetrics.slice(0, 3);

    if (loading) {
        return <div className="text-center p-8 text-slate-500">Carregando...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="relative bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6">Acompanhamento de Metas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg space-y-6">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 text-center">Progresso Semanal</h3>
                        {metricsForProgress.map(metric => (
                            <ProgressBar key={metric.key} label={metric.name} current={progress.weekly[metric.key] || 0} goal={Math.ceil((goals[metric.key] || 0) / 4.33)} />
                        ))}
                         {metricsForProgress.length === 0 && <p className="text-center text-sm text-slate-500">Configure seu funil para ver o progresso.</p>}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg space-y-6">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 text-center">Progresso Mensal</h3>
                         {metricsForProgress.map(metric => (
                            <ProgressBar key={metric.key} label={metric.name} current={progress.monthly[metric.key] || 0} goal={goals[metric.key] || 0} />
                        ))}
                        {metricsForProgress.length === 0 && <p className="text-center text-sm text-slate-500">Configure seu funil para ver o progresso.</p>}
                    </div>
                </div>
                <ShineBorder />
            </div>

            <DiarioForm onSave={handleSaveToSupabase} funnelMetrics={funnelMetrics} />
        </div>
    );
}