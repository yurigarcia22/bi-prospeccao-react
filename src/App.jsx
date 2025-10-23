// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from './contexts/UserContext.jsx';

import AuthPage from './pages/AuthPage.jsx';
import MainLayout from './components/layout/MainLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DiarioPage from './pages/DiarioPage.jsx';
import PropostasPage from './pages/PropostasPage.jsx';
import HistoricoPage from './pages/HistoricoPage.jsx';
import MetasPage from './pages/MetasPage.jsx';
import SettingsLayout from './pages/SettingsLayout.jsx';
import SettingsUsersPage from './pages/SettingsUsersPage.jsx';
import CompleteProfilePage from './pages/CompleteProfilePage';
import SettingsCompanyPage from './pages/SettingsCompanyPage';
import SettingsFunnelPage from './pages/SettingsFunnelPage';

function App() {
  const { session, userProfile, loading } = useUser();

  // 1. Tela de Carregamento Inicial (Enquanto o Contexto verifica a sessão)
  if (loading && session === undefined) { // Adicionamos uma verificação extra para ter certeza que é o loading inicial
      return <div className="flex items-center justify-center h-screen"><div className="text-xl">Carregando...</div></div>;
  }

  // 2. Se NÃO tem sessão, mostra a página de Autenticação
  if (!session) {
    return <AuthPage />;
  }

  // 3. Se TEM sessão, mas AINDA está carregando o perfil, mostra carregando
  //    (Isso acontece logo após o redirect do Supabase)
  if (session && loading) {
     return <div className="flex items-center justify-center h-screen"><div className="text-xl">Verificando perfil...</div></div>;
  }

  // 4. Se TEM sessão, o carregamento TERMINOU e o status é 'convidado'
  if (session && !loading && userProfile?.status === 'convidado') {
    return <CompleteProfilePage />;
  }

  // 5. Se TEM sessão, carregamento TERMINOU e o status NÃO é 'convidado'
  //    (Usuário normal ou admin já ativo)
  if (session && !loading && userProfile?.status !== 'convidado') {
    return (
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="diario" element={<DiarioPage />} />
          <Route path="propostas" element={<PropostasPage />} />
          <Route path="historico" element={<HistoricoPage />} />
          <Route path="metas" element={<MetasPage />} />
          {userProfile?.role === 'admin' && (
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<SettingsCompanyPage />} />
              <Route path="users" element={<SettingsUsersPage />} />
              <Route path="funnel" element={<SettingsFunnelPage />} />
            </Route>
          )}
          {/* Redireciona qualquer outra rota para o dashboard se estiver logado */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    );
  }

  // 6. Caso de Borda: Se algo inesperado acontecer, volta pro login
  //    (Isso não deve acontecer com a lógica acima, mas é uma segurança)
  return <AuthPage />;

}

export default App;