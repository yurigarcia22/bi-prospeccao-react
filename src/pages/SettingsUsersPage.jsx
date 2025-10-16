// src/pages/SettingsUsersPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../contexts/UserContext';
import { Edit, Trash2, Clock, UserX } from 'lucide-react';
import InviteUserModal from '../components/admin/InviteUserModal';
import EditUserModal from '../components/admin/EditUserModal';
import ConfirmDeleteModal from '../components/admin/ConfirmDeleteModal';
import Toast from '../components/ui/Toast';

export default function SettingsUsersPage() {
  const { userProfile } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success', show: false });

  // Novos estados para o fluxo de deleção
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Busca apenas usuários que NÃO estão inativos
      const { data, error } = await supabase.from('profiles').select('id, full_name, role, email, status').neq('status', 'inativo').order('full_name', { ascending: true });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      setError("Não foi possível carregar a lista de usuários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSendInvite = async ({ email, role }) => {
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', { body: { email, role } });
      if (error) throw error;
      setInviteModalOpen(false);
      setToast({ message: 'Convite enviado com sucesso!', type: 'success', show: true });
      fetchUsers();
    } catch (error) {
      const errorMessage = error.context?.json?.()?.error || error.message;
      setToast({ message: `Erro: ${errorMessage}`, type: 'error', show: true });
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-user-role', { body: { userIdToUpdate: userId, newRole: newRole } });
      if (error) throw error;
      setUsers(currentUsers => currentUsers.map(user => user.id === userId ? { ...user, role: newRole } : user));
      setEditingUser(null);
      setToast({ message: data.message || 'Função atualizada!', type: 'success', show: true });
    } catch (error) {
      const errorMessage = error.context?.json?.()?.error || error.message;
      setToast({ message: `Erro: ${errorMessage}`, type: 'error', show: true });
      setEditingUser(null);
    }
  };
  
  const handleInviteUser = () => setInviteModalOpen(true);
  const handleEditUser = (user) => setEditingUser(user);

  // ATUALIZAÇÃO: Abre o modal de confirmação
  const handleDeleteUser = (user) => {
    setUserToDelete(user);
  };
  
  // NOVA FUNÇÃO: Confirma e chama a Edge Function
  const confirmDeactivateUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('deactivate-user', { 
        body: { userIdToDeactivate: userToDelete.id } 
      });
      if (error) throw error;
      
      setUsers(currentUsers => currentUsers.filter(u => u.id !== userToDelete.id));
      setToast({ show: true, message: 'Usuário desativado com sucesso!', type: 'success' });

    } catch (error) {
      const errorMessage = error.context?.json?.()?.error || error.message;
      setToast({ message: `Erro: ${errorMessage}`, type: 'error', show: true });
    } finally {
      setUserToDelete(null);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Gerenciamento de Usuários</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Convide, edite e gerencie os membros da sua equipe.</p>
          </div>
          <button onClick={handleInviteUser} className="bg-brand-accent text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity w-full md:w-auto">
            + Convidar Usuário
          </button>
        </div>
        <div className="bg-white dark:bg-slate-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {loading && <p className="p-8 text-center text-slate-500">Carregando usuários...</p>}
          {error && <p className="p-8 text-center text-red-500">{error}</p>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Nome</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Email</th>
                    <th className="px-6 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Função/Status</th>
                    <th className="px-6 py-3 text-right font-medium text-slate-600 dark:text-slate-300">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {users.map(user => (
                    <tr key={user.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${user.status === 'convidado' ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{user.full_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.status === 'convidado' ? (
                          <span className="px-2 py-0.5 inline-flex items-center gap-1.5 text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            <Clock size={12} />
                            Pendente
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-4">
                        {user.status !== 'convidado' && userProfile.id !== user.id && (
                          <>
                            <button onClick={() => handleEditUser(user)} className="text-slate-400 hover:text-brand-accent transition-colors" title="Editar"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteUser(user)} className="text-slate-400 hover:text-red-500 transition-colors" title="Desativar"><UserX size={16} /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <InviteUserModal isOpen={isInviteModalOpen} onClose={() => setInviteModalOpen(false)} onInvite={handleSendInvite} />
      <EditUserModal isOpen={!!editingUser} user={editingUser} onClose={() => setEditingUser(null)} onSave={handleUpdateRole} />
      <ConfirmDeleteModal
        isOpen={!!userToDelete}
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeactivateUser}
        loading={isDeleting}
      />
      {toast.show && <Toast message={toast.message} type={toast.type} onDone={() => setToast({ ...toast, show: false })} />}
    </>
  );
}