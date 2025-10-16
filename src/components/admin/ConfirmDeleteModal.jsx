// src/components/admin/ConfirmDeleteModal.jsx

import { AlertTriangle } from 'lucide-react';

export default function ConfirmDeleteModal({ user, isOpen, onClose, onConfirm, loading }) {
  if (!isOpen || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <div className="mt-0 text-left">
            <h3 className="text-lg font-semibold leading-6 text-slate-900 dark:text-slate-100" id="modal-title">
              Desativar Usuário
            </h3>
            <div className="mt-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Você tem certeza que deseja desativar <strong>{user.full_name}</strong>?
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                O usuário perderá o acesso à plataforma, mas todos os seus dados históricos serão mantidos. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
          <button
            type="button"
            disabled={loading}
            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto disabled:opacity-50"
            onClick={onConfirm}
          >
            {loading ? 'Desativando...' : 'Sim, desativar'}
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 sm:mt-0 sm:w-auto"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}