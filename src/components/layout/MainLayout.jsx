// src/components/layout/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Navbar from './Navbar';
import { useUser } from '../../contexts/UserContext.jsx';
import BackgroundController from './BackgroundController.jsx';

export default function MainLayout() {
  const { loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-950">
        <div className="text-xl text-slate-500">Carregando aplicação...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-transparent">
      <BackgroundController />
      <div className="relative z-10">
        <Header />
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-28">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}