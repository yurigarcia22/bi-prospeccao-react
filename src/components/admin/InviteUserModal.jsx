// src/components/admin/InviteUserModal.jsx
import { useState } from 'react';
import { X } from 'lucide-react';

export default function InviteUserModal({ isOpen, onClose, onInvite }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await onInvite({ email, role });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Convidar Novo Usuário</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Endereço de e-mail</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@empresa.com" required className="mt-1 block w-full p-2.5 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Função</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center p-4 rounded-lg border cursor-pointer ${role === 'user' ? 'border-brand-accent bg-brand-accent/10' : 'border-slate-300 dark:border-slate-700'}`}>
                <input type="radio" name="role" value="user" checked={role === 'user'} onChange={() => setRole('user')} className="h-4 w-4 text-brand-accent focus:ring-brand-accent" />
                <span className="ml-3 text-sm font-medium text-slate-900 dark:text-slate-100">Usuário</span>
              </label>
              <label className={`flex items-center p-4 rounded-lg border cursor-pointer ${role === 'admin' ? 'border-brand-accent bg-brand-accent/10' : 'border-slate-300 dark:border-slate-700'}`}>
                <input type="radio" name="role" value="admin" checked={role === 'admin'} onChange={() => setRole('admin')} className="h-4 w-4 text-brand-accent focus:ring-brand-accent" />
                <span className="ml-3 text-sm font-medium text-slate-900 dark:text-slate-100">Administrador</span>
              </label>
            </div>
          </div>
          <div className="pt-6 flex justify-end items-center space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-medium">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-brand-accent hover:opacity-90 text-white text-sm font-medium disabled:opacity-50">
              {loading ? 'Enviando...' : 'Convidar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}