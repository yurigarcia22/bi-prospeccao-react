// src/components/historico/EditDailyEntryModal.jsx

import { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { ShineBorder } from '../ui/ShineBorder.jsx';

function clampInt(n) { return Math.max(0, Math.floor(+n)) || 0; }

function NumberField({ id, label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</label>
      <div className="flex items-stretch gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, clampInt(value) - 1))} className="px-3 rounded-xl bg-slate-200/50 dark:bg-white/5 ring-1 ring-slate-300 dark:ring-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-white/10 transition-colors"><Minus className="h-4 w-4" /></button>
        <input id={id} inputMode="numeric" pattern="[0-9]*" className="w-full text-center rounded-xl bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-300 dark:ring-white/10 px-3 py-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-accent" value={value} onChange={(e) => onChange(clampInt(e.target.value))} />
        <button type="button" onClick={() => onChange(clampInt(value) + 1)} className="px-3 rounded-xl bg-slate-200/50 dark:bg-white/5 ring-1 ring-slate-300 dark:ring-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-white/10 transition-colors"><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export default function EditDailyEntryModal({ entry, onClose, onSave, onDelete }) {
  if (!entry) return null;

  const [formData, setFormData] = useState(entry);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setFormData(entry);
  }, [entry]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { id, created_at, user_id, bdr_nome, company_id, ...updateData } = formData;
    await onSave(id, updateData);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir este lançamento?`)) {
      setDeleteLoading(true);
      await onDelete(entry.id);
      setDeleteLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-3xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editar Lançamento Diário</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="data" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Data do Lançamento</label>
            <input type="date" name="data" id="data" value={formData.data || ''} onChange={(e) => updateField('data', e.target.value)} required className="mt-1 block w-full sm:w-1/2 p-2.5 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent"/>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumberField id="ligacoes" label="Ligações" value={formData.ligacoes} onChange={(val) => updateField('ligacoes', val)} />
            <NumberField id="conexoes" label="Conexões" value={formData.conexoes} onChange={(val) => updateField('conexoes', val)} />
            <NumberField id="conexoes_decisor" label="Conexões Decisor" value={formData.conexoes_decisor} onChange={(val) => updateField('conexoes_decisor', val)} />
            <NumberField id="reunioes_marcadas" label="Reuniões Marcadas" value={formData.reunioes_marcadas} onChange={(val) => updateField('reunioes_marcadas', val)} />
            <NumberField id="reunioes_realizadas" label="Reuniões Realizadas" value={formData.reunioes_realizadas} onChange={(val) => updateField('reunioes_realizadas', val)} />
            <NumberField id="reunioes_qualificadas" label="Reuniões Qualificadas" value={formData.reunioes_qualificadas} onChange={(val) => updateField('reunioes_qualificadas', val)} />
            <NumberField id="propostas" label="Propostas Criadas" value={formData.propostas} onChange={(val) => updateField('propostas', val)} />
          </div>
          
          <div>
            <label htmlFor="observacoes" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Observações</label>
            <textarea name="observacoes" id="observacoes" rows="4" value={formData.observacoes || ''} onChange={(e) => updateField('observacoes', e.target.value)} className="mt-1 block w-full p-2.5 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 rounded-lg" />
          </div>
          
          <div className="pt-4 flex justify-between items-center">
            <button type="button" onClick={handleDelete} disabled={deleteLoading} className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <Trash2 size={16} />
              {deleteLoading ? 'Excluindo...' : 'Excluir'}
            </button>
            <div className="flex space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-medium">Cancelar</button>
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-brand-accent hover:opacity-90 text-white text-sm font-medium disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>

        <ShineBorder />
      </div>
    </div>
  );
}