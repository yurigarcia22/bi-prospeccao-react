// src/pages/HistoricoPage.jsx

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../contexts/UserContext.jsx';
import { Pencil, CalendarRange, Download, ChevronUp, ChevronDown, XCircle } from "lucide-react";
import EditDailyEntryModal from '../components/historico/EditDailyEntryModal';

const formatDate = (date) => date ? new Date(date + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
const getDatesFromPeriod = (period, customStart, customEnd) => {
    if (period === 'personalizado') return { startDate: customStart || null, endDate: customEnd || null };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate = new Date(today), endDate = new Date(today);
    switch(period) {
        case 'hoje': break;
        case 'ontem': startDate.setDate(today.getDate() - 1); endDate.setDate(today.getDate() - 1); break;
        case 'ultimos_7_dias': startDate.setDate(today.getDate() - 6); break;
        case 'este_mes': startDate = new Date(today.getFullYear(), today.getMonth(), 1); endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); break;
        case 'mes_passado': startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1); endDate = new Date(today.getFullYear(), today.getMonth(), 0); break;
        default: return { startDate: null, endDate: null };
    }
    return { 
      startDate: startDate.toISOString().slice(0, 10), 
      endDate: endDate.toISOString().slice(0, 10) 
    };
};

function useSort(initial) {
  const [sort, setSort] = useState(initial);
  function toggle(key) { setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" })); }
  return { sort, setSort, toggle };
}

function UsersIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function Toolbar({ bdr, setBdr, bdrsList, period, setPeriod, customDate, setCustomDate, onExport, onClearFilters }) {
    return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-700 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <UsersIcon className="text-slate-500 dark:text-slate-400"/>
                  <select value={bdr} onChange={(e) => setBdr(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40">
                    <option value="todos">BDR: Todos</option>
                    {bdrsList.map(bdrName => <option key={bdrName} value={bdrName}>{bdrName}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40">
                    <option value="ultimos_7_dias">Período: Últimos 7 dias</option>
                    <option value="este_mes">Este Mês</option>
                    <option value="mes_passado">Mês Passado</option>
                    <option value="maximo">Máximo</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>
                <button onClick={onClearFilters} className="rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-2">
                    <XCircle className="h-4 w-4" /> Limpar
                </button>
            </div>
            <button onClick={onExport} className="rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-2">
                <Download className="h-4 w-4" /> Exportar CSV
            </button>
        </div>
        {period === 'personalizado' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 dark:border-slate-700">
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data Início</label>
                    <input type="date" value={customDate.start} onChange={e => setCustomDate({...customDate, start: e.target.value})} className="mt-1 block w-full p-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data Fim</label>
                    <input type="date" value={customDate.end} onChange={e => setCustomDate({...customDate, end: e.target.value})} className="mt-1 block w-full p-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md" />
                </div>
            </div>
        )}
    </div>
  );
}

export default function HistoricoPage() {
  const { company, userProfile, session } = useUser();
  
  const [historyData, setHistoryData] = useState([]);
  const [bdrs, setBdrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBdr, setSelectedBdr] = useState('todos');
  const [selectedPeriod, setSelectedPeriod] = useState('ultimos_7_dias');
  const [customDate, setCustomDate] = useState({ start: '', end: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null);

  const { sort, setSort, toggle: toggleSort } = useSort({ key: 'data', dir: 'desc' });

  const sortedData = useMemo(() => {
    let arr = [...historyData];
    arr.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const va = a[sort.key];
      const vb = b[sort.key];
      if (typeof va === 'number') return dir * (va - vb);
      if (sort.key === 'data') return dir * (new Date(b.data) - new Date(a.data)) * -1;
      return dir * String(va).localeCompare(String(vb));
    });
    return arr;
  }, [historyData, sort]);

  useEffect(() => {
    if (!company?.id) { setLoading(false); return; }
    
    const fetchData = async () => {
        setLoading(true);
        const { startDate, endDate } = getDatesFromPeriod(selectedPeriod, customDate.start, customDate.end);

        let query = supabase.from('prospeccao_diaria').select('*').eq('company_id', company.id);

        if (selectedBdr !== 'todos') query = query.eq('bdr_nome', selectedBdr);
        if (startDate) query = query.gte('data', startDate);
        if (endDate) query = query.lte('data', endDate);
        
        query = query.order('data', { ascending: false }).order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) console.error("Erro ao buscar histórico:", error);
        else setHistoryData(data || []);
        
        setLoading(false);
    };

    const fetchBdrs = async () => {
        const { data: profiles } = await supabase.from('profiles').select('full_name').eq('company_id', company.id);
        if (profiles) setBdrs(profiles.map(p => p.full_name).filter(Boolean));
    };

    fetchData();
    if (bdrs.length === 0) fetchBdrs();
  }, [company, selectedBdr, selectedPeriod, customDate]);

  const handleDelete = async (entryId) => {
      const { error } = await supabase.from('prospeccao_diaria').delete().eq('id', entryId);
      if (error) { 
          alert(`Erro ao excluir: ${error.message}`); 
      } else {
          setHistoryData(current => current.filter(e => e.id !== entryId));
          alert("Lançamento excluído com sucesso.");
          handleCloseModal();
      }
  };

  const handleUpdate = async (entryId, updatedData) => {
    const { data: newlyUpdated, error } = await supabase
      .from('prospeccao_diaria')
      .update(updatedData)
      .eq('id', entryId)
      .select()
      .single();
    
    if (error) {
      alert(`Erro ao salvar: ${error.message}`);
    } else {
      setHistoryData(current => current.map(e => (e.id === entryId ? newlyUpdated : e)));
      alert("Lançamento atualizado com sucesso!");
      handleCloseModal();
    }
  };

  const handleExportCSV = () => { /* ... (código completo do nosso histórico) ... */ };
  const handleClearFilters = () => { /* ... (código completo do nosso histórico) ... */ };
  const handleOpenModal = (entry) => { setEntryToEdit(entry); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEntryToEdit(null); };

  const th = (key, label, className = '') => (
    <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${className}`}>
      <button onClick={() => toggleSort(key)} className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
        {label}
        {sort.key === key && (sort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
      </button>
    </th>
  );

  return (
    <>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Histórico de Lançamentos</h1>
        <Toolbar 
            bdr={selectedBdr} setBdr={setSelectedBdr} bdrsList={bdrs} 
            period={selectedPeriod} setPeriod={setSelectedPeriod} 
            customDate={customDate} setCustomDate={setCustomDate}
            onExport={handleExportCSV} 
            onClearFilters={handleClearFilters}
        />
        
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {th('data', 'Data')}
                  {th('bdr_nome', 'BDR')}
                  {th('ligacoes', 'Ligações', 'justify-center')}
                  {th('conexoes', 'Conexões', 'justify-center')}
                  {th('reunioes_marcadas', 'Reuniões Marcadas', 'justify-center')}
                  {th('propostas', 'Propostas', 'justify-center')}
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr><td colSpan="7" className="text-center p-8 text-slate-500 dark:text-slate-400">Carregando histórico...</td></tr>
                ) : sortedData.length === 0 ? (
                  <tr><td colSpan="7" className="text-center p-8 text-slate-500 dark:text-slate-400">Nenhum lançamento encontrado.</td></tr>
                ) : (
                  sortedData.map(entry => {
                    const canManage = userProfile?.role === 'admin' || session?.user?.id === entry.user_id;
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">{formatDate(entry.data)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{entry.bdr_nome}</td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{entry.ligacoes}</td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{entry.conexoes}</td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{entry.reunioes_marcadas}</td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{entry.propostas}</td>
                        <td className="px-4 py-3 text-center">
                          {canManage && (
                            <div className="flex items-center justify-center">
                              <button onClick={() => handleOpenModal(entry)} className="text-slate-500 hover:text-brand-accent">
                                <Pencil size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <EditDailyEntryModal
        entry={entryToEdit}
        onClose={handleCloseModal}
        onSave={handleUpdate}
        onDelete={handleDelete}
      />
    </>
  );
}