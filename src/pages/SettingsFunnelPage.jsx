// src/pages/SettingsFunnelPage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../contexts/UserContext';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import Toast from '../components/ui/Toast';

const generateKey = (str) => {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

export default function SettingsFunnelPage() {
  const { company, funnelMetrics: initialMetrics } = useUser();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle'); // idle | saving | success | error
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  useEffect(() => {
    // CORREÇÃO: Garante que toda métrica (seja do banco ou padrão) tenha um ID para manipulação.
    const metricsWithIds = initialMetrics.map(m => ({
      ...m,
      // Se a métrica não tiver um 'id' (porque é do funil padrão), cria um ID temporário.
      id: m.id || `temp-default-${m.key}` 
    }));
    setMetrics(metricsWithIds || []);
    setLoading(false);
  }, [initialMetrics]);

  const handleAddMetric = () => {
    const newMetricName = `Nova Métrica ${metrics.length + 1}`;
    const newMetric = {
      id: `temp-${Date.now()}`,
      name: newMetricName,
      key: generateKey(newMetricName),
      company_id: company.id,
      display_order: metrics.length,
    };
    setMetrics([...metrics, newMetric]);
  };
  
  const handleNameChange = (id, newName) => {
    setMetrics(metrics.map(m => 
      m.id === id ? { ...m, name: newName, key: generateKey(newName) } : m
    ));
  };

  const handleDeleteMetric = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta métrica?')) {
      setMetrics(metrics.filter(m => m.id !== id));
    }
  };

  const handleSaveFunnel = async () => {
    setStatus('saving');
    
    try {
      const { data: existingMetricsInDb } = await supabase
        .from('funnel_metrics')
        .select('id')
        .eq('company_id', company.id);

      const existingIdsInDb = existingMetricsInDb ? existingMetricsInDb.map(m => m.id) : [];

      const metricsToUpsert = metrics.map((metric, index) => ({
        // Se o ID for temporário (seja 'temp-' ou 'temp-default-'), não o envia para o Supabase.
        ...(metric.id.toString().startsWith('temp-') ? {} : { id: metric.id }),
        company_id: company.id,
        name: metric.name,
        key: metric.key,
        display_order: index,
      }));

      const currentIds = metrics.filter(m => m.id && !m.id.toString().startsWith('temp-')).map(m => m.id);
      const metricsToDelete = existingIdsInDb.filter(id => !currentIds.includes(id));

      if (metricsToDelete.length > 0) {
        const { error: deleteError } = await supabase.from('funnel_metrics').delete().in('id', metricsToDelete);
        if (deleteError) throw deleteError;
      }

      if (metricsToUpsert.length > 0) {
        const { error: upsertError } = await supabase.from('funnel_metrics').upsert(metricsToUpsert);
        if (upsertError) throw upsertError;
      }

      setStatus('success');
      setToast({ show: true, message: 'Funil salvo! A página será recarregada.', type: 'success' });
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      console.error('Error saving funnel:', error);
      setStatus('error');
      setToast({ show: true, message: `Erro ao salvar: ${error.message}`, type: 'error' });
      // Permite que o usuário tente salvar novamente após um erro
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            Funil de Vendas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalize as etapas e métricas do seu funil de prospecção.
          </p>
        </div>

        <div className="space-y-4 max-w-2xl">
          {loading ? (
            <p>Carregando métricas...</p>
          ) : (
            metrics.map((metric) => (
              <div key={metric.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <GripVertical className="h-5 w-5 text-slate-400 cursor-grab" />
                <input
                  type="text"
                  value={metric.name}
                  onChange={(e) => handleNameChange(metric.id, e.target.value)}
                  className="flex-1 bg-transparent focus:outline-none text-slate-800 dark:text-slate-100 font-medium"
                />
                <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md">
                  {metric.key}
                </span>
                <button
                  onClick={() => handleDeleteMetric(metric.id)}
                  className="text-slate-400 hover:text-red-500"
                  aria-label="Excluir métrica"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}

          <button
            onClick={handleAddMetric}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-brand-accent border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:bg-brand-accent/10 transition-colors"
          >
            <Plus size={16} />
            Adicionar Etapa
          </button>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
            <button
              onClick={handleSaveFunnel}
              disabled={status === 'saving' || status === 'success'}
              className={`inline-flex items-center gap-2 justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70
                ${status === 'success' ? 'bg-emerald-600' : 'bg-brand-accent hover:opacity-90 focus:ring-brand-accent'}
              `}
            >
              <Save size={16} />
              {status === 'saving' ? 'Salvando...' : status === 'success' ? 'Salvo!' : 'Salvar Funil'}
            </button>
          </div>
      </div>

      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type}
          onDone={() => setToast({ ...toast, show: false })}
        />
      )}
    </>
  );
}