// src/pages/PropostasPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from '../supabaseClient';
import { useUser } from '../contexts/UserContext.jsx';
import { CheckCircle2, XCircle, Clock3, ChevronDown, ChevronUp, CalendarRange, Filter, Search, Download, Pencil, Trash2 } from "lucide-react";
import EditProposalModal from "../components/propostas/EditProposalModal.jsx";

// =====================================================================================
// --- CONSTANTES E FUNÇÕES AUXILIARES ---
// =====================================================================================

const STATUS = {
  Ganha: { label: "Ganha", class: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-600/20", dot: "bg-emerald-500", icon: CheckCircle2 },
  Pendente: { label: "Pendente", class: "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-600/20", dot: "bg-amber-500", icon: Clock3 },
  Perdida: { label: "Perdida", class: "bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-1 ring-rose-600/20", dot: "bg-rose-500", icon: XCircle },
};

function currencyBRL(n) { return (n ? Number(n) : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function classNames(...xs) { return xs.filter(Boolean).join(" "); }
function useSort(initial) {
  const [sort, setSort] = useState(initial);
  function toggle(key) { setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" })); }
  return { sort, toggle };
}

// =====================================================================================
// --- SUB-COMPONENTES DE UI ---
// =====================================================================================

function StatusBadge({ value }) {
  const s = STATUS[value] ?? STATUS.Pendente;
  const Icon = s.icon;
  return (
    <span className={classNames("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", s.class)}>
      <span className={classNames("h-1.5 w-1.5 rounded-full", s.dot)} />
      <Icon className="h-3.5 w-3.5" />
      {s.label}
    </span>
  );
}

function HeaderKPIs({ list }) {
  const kpis = useMemo(() => {
    const total = list.length;
    const ganha = list.filter((x) => x.status === "Ganha");
    const pend = list.filter((x) => x.status === "Pendente");
    const perd = list.filter((x) => x.status === "Perdida");
    const sum = (arr, key) => arr.reduce((acc, it) => acc + (Number(it[key]) || 0), 0);
    return [
      { title: "Todas", value: currencyBRL(sum(list, "valor")), sub: `${total} propostas` },
      { title: "Ganhas", value: currencyBRL(sum(ganha, "valor")), sub: `${ganha.length} propostas` },
      { title: "Pendentes", value: currencyBRL(sum(pend, "valor")), sub: `${pend.length} propostas` },
      { title: "Perdidas", value: currencyBRL(sum(perd, "valor")), sub: `${perd.length} propostas` },
    ];
  }, [list]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((k) => (
        <div key={k.title} className="rounded-2xl bg-white dark:bg-slate-800/50 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">{k.title}</div>
          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{k.value}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

function UsersIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function Toolbar({ status, setStatus, period, setPeriod, bdr, setBdr, bdrsList, query, setQuery }) {
    return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-700 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40">
            <option value="todas">Status: Todas</option>
            <option value="Pendente">Pendente</option>
            <option value="Ganha">Ganha</option>
            <option value="Perdida">Perdida</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40">
            <option value="maximo">Período: Máximo</option>
            <option value="ultimos_7_dias">Últimos 7 dias</option>
            <option value="este_mes">Este Mês</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <UsersIcon className="h-4 w-4 text-slate-500 dark:text-slate-400"/>
          <select value={bdr} onChange={(e) => setBdr(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40">
            <option value="todos">BDR: Todos</option>
            {bdrsList.map(bdrName => <option key={bdrName} value={bdrName}>{bdrName}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente..." className="w-full sm:w-64 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
        </div>
        <button className="rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 inline-flex items-center gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>
    </div>
  );
}

function PropostasManager({ items, onUpdateStatus, onDelete, onEdit, userProfile, session, bdrsList, loading }) {
  const [status, setStatus] = useState("todas");
  const [period, setPeriod] = useState("maximo");
  const [bdr, setBdr] = useState("todos");
  const [query, setQuery] = useState("");
  const { sort, toggle } = useSort({ key: "data_proposta", dir: "desc" });

  const filtered = useMemo(() => {
    let arr = [...items];
    if (status !== "todas") arr = arr.filter((x) => x.status === status);
    if (bdr !== "todos") arr = arr.filter((x) => x.bdr_nome === bdr);
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter((x) => x.nome_cliente.toLowerCase().includes(q));
    }
    arr.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const va = a[sort.key];
      const vb = b[sort.key];
      if (sort.key === "valor") return dir * (Number(va) - Number(vb));
      if (sort.key === "data_proposta" || sort.key === "data_fechamento") {
        return dir * (new Date(a[sort.key] || 0) - new Date(b[sort.key] || 0));
      }
      return dir * String(va).localeCompare(String(vb));
    });
    return arr;
  }, [items, status, period, bdr, query, sort]);

  const th = (key, label) => (
    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
      <button onClick={() => toggle(key)} className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
        {label}
        {sort.key === key ? sort.dir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" /> : null}
      </button>
    </th>
  );
  
  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Carregando propostas...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Gerenciamento de Propostas</h1>
      <HeaderKPIs list={filtered} />
      <Toolbar status={status} setStatus={setStatus} period={period} setPeriod={setPeriod} bdr={bdr} setBdr={setBdr} bdrsList={bdrsList} query={query} setQuery={setQuery} />
      <div className="rounded-2xl bg-white dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-sm z-10">
              <tr>
                {th("nome_cliente", "Cliente")}
                {th("valor", "Valor")}
                {th("data_proposta", "Data da Proposta")}
                {th("data_fechamento", "Data de Fechamento")}
                {th("bdr_nome", "BDR")}
                {th("status", "Status")}
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map((r) => {
                const isCreator = session?.user?.id === r.user_id;
                const isAdmin = userProfile?.role === 'admin';
                const canEdit = isCreator || isAdmin;
                const canDelete = isAdmin;
                return (
                  <tr key={r.id} className="hover:bg-violet-50/40 dark:hover:bg-violet-500/10">
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100 min-w-[220px]">{r.nome_cliente}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">{currencyBRL(r.valor)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.data_proposta ? new Date(r.data_proposta + 'T00:00:00').toLocaleDateString('pt-BR') : "-"}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.data_fechamento ? new Date(r.data_fechamento + 'T00:00:00').toLocaleDateString('pt-BR') : "-"}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.bdr_nome}</td>
                    <td className="px-4 py-3"><StatusBadge value={r.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-4 text-sm">
                        {r.status === 'Pendente' && canEdit && (
                          <>
                            <button onClick={() => onUpdateStatus(r.id, "Ganha")} className="px-2 py-1 rounded-md font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20">Ganha</button>
                            <button onClick={() => onUpdateStatus(r.id, "Perdida")} className="px-2 py-1 rounded-md font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20">Perdida</button>
                          </>
                        )}
                        {canEdit && (
                          <button onClick={() => onEdit(r)} aria-label="Editar" className="text-slate-500 hover:text-brand-accent dark:text-slate-400 dark:hover:text-brand-accent">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => onDelete(r.id)} aria-label="Excluir" className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =====================================================================================
// --- COMPONENTE DE PÁGINA QUE ORQUESTRA TUDO ---
// =====================================================================================

export default function PropostasPage() {
  const { company, userProfile, session } = useUser();
  const [allProposals, setAllProposals] = useState([]);
  const [bdrs, setBdrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proposalToEdit, setProposalToEdit] = useState(null);

  useEffect(() => {
    if (!company?.id) { setLoading(false); return; }
    const fetchData = async () => {
        setLoading(true);
        const [proposalsRes, profilesRes] = await Promise.all([
            supabase.from('propostas').select('*').eq('company_id', company.id).order('data_proposta', { ascending: false }),
            supabase.from('profiles').select('full_name').eq('company_id', company.id)
        ]);
        if (proposalsRes.error) console.error("Erro ao buscar propostas:", proposalsRes.error);
        else setAllProposals(proposalsRes.data || []);
        if (profilesRes.error) console.error("Erro ao buscar BDRs:", profilesRes.error);
        else setBdrs(profilesRes.data.map(p => p.full_name).filter(Boolean) || []);
        setLoading(false);
    };
    fetchData();
  }, [company]);

  const handleUpdateStatus = async (proposalId, newStatus) => {
    const { data: updatedProposal, error } = await supabase.from('propostas').update({ status: newStatus, data_fechamento: new Date().toISOString().slice(0, 10) }).eq('id', proposalId).select().single();
    if (error) { alert(`Erro ao atualizar status: ${error.message}`); } 
    else { setAllProposals(current => current.map(p => (p.id === proposalId ? updatedProposal : p))); }
  };

  const handleDelete = async (proposalId) => {
    if (window.confirm('Tem certeza que deseja excluir esta proposta?')) {
      const { error } = await supabase.from('propostas').delete().eq('id', proposalId);
      if (error) { alert(`Erro ao excluir proposta: ${error.message}`); } 
      else { 
          setAllProposals(current => current.filter(p => p.id !== proposalId));
          alert("Proposta excluída com sucesso."); 
          handleCloseModal();
      }
    }
  };
  
  const handleOpenEditModal = (proposal) => {
    setProposalToEdit(proposal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProposalToEdit(null);
  };

  const handleUpdateProposal = async (updatedData) => {
    const { id, nome_cliente, valor, data_proposta } = updatedData;
    const { data: newlyUpdated, error } = await supabase.from('propostas').update({ nome_cliente, valor, data_proposta }).eq('id', id).select().single();
    if (error) { alert(`Erro ao salvar alterações: ${error.message}`); } 
    else {
        setAllProposals(current => current.map(p => (p.id === id ? newlyUpdated : p)));
        alert("Proposta atualizada com sucesso!");
        handleCloseModal();
    }
  };

  return (
    <>
      <PropostasManager 
        items={allProposals} 
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDelete}
        onEdit={handleOpenEditModal}
        userProfile={userProfile}
        session={session}
        bdrsList={bdrs}
        loading={loading}
      />
      <EditProposalModal 
        proposal={proposalToEdit}
        onClose={handleCloseModal}
        onSave={handleUpdateProposal}
        onDelete={() => handleDelete(proposalToEdit.id)}
      />
    </>
  );
}