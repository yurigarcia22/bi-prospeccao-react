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
import SettingsCompanyPage from './pages/SettingsCompanyPage'; // Adicionado

function App() {
  const { session, userProfile, loading } = useUser();

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="text-xl">Carregando...</div></div>;
  }

  if (session && userProfile?.status === 'convidado') {
    return <CompleteProfilePage />;
  }

  return (
    <Routes>
      {!session ? (
        <Route path="*" element={<AuthPage />} />
      ) : (
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="diario" element={<DiarioPage />} />
          <Route path="propostas" element={<PropostasPage />} />
          <Route path="historico" element={<HistoricoPage />} />
          <Route path="metas" element={<MetasPage />} />
          {userProfile?.role === 'admin' && (
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<SettingsCompanyPage />} /> {/* Atualizado */}
              <Route path="users" element={<SettingsUsersPage />} />
            </Route>
          )}
          <Route path="*" element={<DashboardPage />} />
        </Route>
      )}
    </Routes>
  );
}

export default App;