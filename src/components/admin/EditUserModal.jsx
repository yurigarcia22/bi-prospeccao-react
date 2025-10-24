// src/components/admin/EditUserModal.jsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function EditUserModal({ user, isOpen, onClose, onSave }) {
  const [newRole, setNewRole] = useState(user?.role);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setNewRole(user.role);
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(user.id, newRole);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold">Editar Usuário</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div><span className="text-sm text-slate-500 dark:text-slate-400">Nome</span><p className="text-slate-900 dark:text-slate-100">{user.full_name}</p></div>
            <div><span className="text-sm text-slate-500 dark:text-slate-400">E-mail</span><p className="text-slate-900 dark:text-slate-100">{user.email}</p></div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Função</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center p-4 rounded-lg border cursor-pointer ${newRole === 'user' ? 'border-brand-accent bg-brand-accent/10' : 'border-slate-300'}`}>
                <input type="radio" name="role" value="user" checked={newRole === 'user'} onChange={() => setNewRole('user')} className="h-4 w-4 text-brand-accent" />
                <span className="ml-3 text-sm font-medium text-slate-900 dark:text-slate-100">Usuário</span>
              </label>
              <label className={`flex items-center p-4 rounded-lg border cursor-pointer ${newRole === 'admin' ? 'border-brand-accent bg-brand-accent/10' : 'border-slate-300'}`}>
                <input type="radio" name="role" value="admin" checked={newRole === 'admin'} onChange={() => setNewRole('admin')} className="h-4 w-4 text-brand-accent" />
                <span className="ml-3 text-sm font-medium text-slate-900 dark:text-slate-100">Administrador</span>
              </label>
            </div>
          </div>
          <div className="pt-6 flex justify-end items-center space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-sm font-medium">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-brand-accent hover:opacity-90 text-white text-sm font-medium disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}