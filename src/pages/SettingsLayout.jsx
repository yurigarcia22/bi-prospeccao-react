// src/pages/SettingsLayout.jsx

import { NavLink, Outlet } from 'react-router-dom';
import { Building, Users, Filter } from 'lucide-react'; // Adicionamos o ícone Filter

const settingsNav = [
  { name: 'Empresa', path: '/settings', icon: Building, end: true },
  { name: 'Usuários', path: '/settings/users', icon: Users, end: false },
  { name: 'Funil', path: '/settings/funnel', icon: Filter, end: false }, // Nova linha aqui
];

export default function SettingsLayout() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row min-h-[70vh]">
      {/* Menu Lateral */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Configurações</h2>
        <nav className="flex flex-row md:flex-col gap-2">
          {settingsNav.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-accent/10 text-brand-accent'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              <item.icon size={16} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Conteúdo Principal da Seção */}
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}