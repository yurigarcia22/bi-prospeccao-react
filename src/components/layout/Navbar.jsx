// src/components/layout/Navbar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Book, FileText, History, Target } from 'lucide-react';

const navItems = [
  { path: '/', name: 'Dashboard', icon: LayoutDashboard },
  { path: '/diario', name: 'Diário', icon: Book },
  { path: '/propostas', name: 'Propostas', icon: FileText },
  { path: '/historico', name: 'Histórico', icon: History },
  { path: '/metas', name: 'Metas', icon: Target },
];

export default function Navbar() {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.name} to={item.path} end={item.path === '/'} className={({ isActive }) => `relative cursor-pointer text-sm font-semibold px-5 py-2 rounded-full transition-colors duration-300 ${isActive ? 'text-brand-accent' : 'text-slate-600 dark:text-slate-300 hover:text-brand-accent'}`}>
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2">
                    <Icon size={16} strokeWidth={2.5} />
                    <span className="hidden md:inline">{item.name}</span>
                  </div>
                  {isActive && (
                    <motion.div layoutId="lamp" className="absolute inset-0 w-full bg-brand-accent/10 rounded-full -z-10" initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-accent rounded-t-full">
                        <div className="absolute w-12 h-6 bg-brand-accent/20 rounded-full blur-md -top-2 -left-2" />
                        <div className="absolute w-8 h-6 bg-brand-accent/20 rounded-full blur-md -top-1" />
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}