// src/components/ui/Toast.jsx

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';

const icons = {
  success: <CheckCircle2 className="text-emerald-500" />,
  error: <XCircle className="text-rose-500" />,
  warning: <AlertTriangle className="text-amber-500" />,
};

const Toast = ({ message, type = 'success', onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 3000); // A notificação some após 3 segundos

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed top-24 right-5 z-[100]"> {/* Aumentado o z-index para garantir visibilidade */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center gap-4 p-4 max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex-shrink-0">{icons[type]}</div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {message}
            </p>
            <button
              onClick={onDone}
              className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Toast;