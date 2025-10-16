// src/components/propostas/EditProposalModal.jsx

import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

export default function EditProposalModal({ proposal, onClose, onSave, onDelete }) {
  if (!proposal) {
    return null;
  }

  const [formData, setFormData] = useState(proposal);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setFormData(proposal);
  }, [proposal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir a proposta para "${proposal.nome_cliente}"?`)) {
      setDeleteLoading(true);
      await onDelete(proposal.id);
      setDeleteLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editar Proposta</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nome_cliente" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nome do Cliente</label>
            <input type="text" name="nome_cliente" id="nome_cliente" value={formData.nome_cliente || ''} onChange={handleChange} required className="mt-1 block w-full p-2.5 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent" />
          </div>
          <div>
            <label htmlFor="valor" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Valor (R$)</label>
            <input type="number" name="valor" id="valor" step="0.01" value={formData.valor || ''} onChange={handleChange} required className="mt-1 block w-full p-2.5 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent" />
          </div>
          <div>
            <label htmlFor="data_proposta" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Data da Proposta</label>
            <input type="date" name="data_proposta" id="data_proposta" value={formData.data_proposta || ''} onChange={handleChange} required className="mt-1 block w-full p-2.5 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-accent focus:border-brand-accent" />
          </div>

          <div className="pt-6 flex justify-between items-center">
            <button 
              type="button" 
              onClick={handleDelete}
              disabled={deleteLoading}
              className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 size={16} />
              {deleteLoading ? 'Excluindo...' : 'Excluir'}
            </button>
            <div className="flex space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-medium">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-brand-accent hover:opacity-90 text-white text-sm font-medium disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}