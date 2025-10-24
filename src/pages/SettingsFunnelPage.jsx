// src/pages/SettingsFunnelPage.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../contexts/UserContext';
import { Plus, Trash2, GripVertical, Save, Lock } from 'lucide-react';
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

const FIXED_METRIC_KEY = 'propostas'; // Chave da métrica fixa

export default function SettingsFunnelPage() {
  const { company, funnelMetrics: initialMetrics } = useUser();
  const [metrics, setMetrics] = useState([]);
  const [initialDbIds, setInitialDbIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const metricsWithIds = (initialMetrics || []).map(m => ({
      ...m,
      id: m.id || `temp-default-${m.key}`
    }));
    setMetrics(metricsWithIds);

    const dbIds = new Set((initialMetrics || []).filter(m => m.id && !m.id.toString().startsWith('temp-')).map(m => m.id));
    setInitialDbIds(dbIds);

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
    setMetrics(metrics.map(m => {
      // Impede renomear se a chave for a fixa E o nome for diferente de vazio (para evitar bugs)
      if (m.key === FIXED_METRIC_KEY && generateKey(newName) !== FIXED_METRIC_KEY && newName.trim() !== '') {
         alert('Não é possível alterar a chave da métrica "Propostas". Você pode renomeá-la, mas a chave permanecerá "propostas".');
         // Mantém o nome antigo se a chave mudar, mas permite mudar o nome se a chave continuar 'propostas'
         return m.name === 'Propostas' ? { ...m, name: newName } : m;
      }
      if (m.id === id) {
        return { ...m, name: newName, key: generateKey(newName) };
      }
      return m;
    }));
  };


  const handleDeleteMetric = (id) => {
    const metricToDelete = metrics.find(m => m.id === id);
    if (metricToDelete?.key === FIXED_METRIC_KEY || (metricToDelete?.id.toString().includes('temp-default') && metricToDelete?.key === FIXED_METRIC_KEY)) {
      alert('A métrica "Propostas" não pode ser excluída.');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir esta métrica?')) {
      setMetrics(metrics.filter(m => m.id !== id));
    }
  };

  const handleSaveFunnel = async () => {
    setStatus('saving');

    try {
      // *** PROTEÇÃO EXTRA ***: Garante que 'propostas' esteja na lista ANTES de salvar
      let currentMetrics = [...metrics]; // Cria cópia
      const hasFixedMetric = currentMetrics.some(m => m.key === FIXED_METRIC_KEY || (m.id.toString().includes('temp-default') && m.key === FIXED_METRIC_KEY));

      if (!hasFixedMetric) {
        console.warn("Métrica 'propostas' não encontrada no estado local, adicionando de volta.");
        // Adiciona a métrica 'propostas' de volta, tentando usar um ID existente se possível
        const originalFixedMetric = initialMetrics.find(m => m.key === FIXED_METRIC_KEY);
        currentMetrics.push({
             id: originalFixedMetric?.id || `temp-default-${FIXED_METRIC_KEY}`, // Usa ID original ou temp
             name: 'Propostas',
             key: FIXED_METRIC_KEY,
             company_id: company.id,
             display_order: currentMetrics.length // Adiciona no final
        });
      }
      // Garante que a ordem esteja correta após a possível adição
      currentMetrics = currentMetrics.map((m, index) => ({ ...m, display_order: index }));
      //***********************************

      const { data: existingMetricsInDb } = await supabase
        .from('funnel_metrics')
        .select('id, key')
        .eq('company_id', company.id);

      const existingMetricsMap = new Map((existingMetricsInDb || []).map(m => [m.id, m.key]));
      const existingIdsInDb = Array.from(existingMetricsMap.keys());

      const metricsToUpsert = currentMetrics.map((metric) => { // Usa currentMetrics (com a proteção)
        const isNewOrUnsavedDefault = metric.id && metric.id.toString().startsWith('temp-');
        // Garante que a chave da métrica fixa não seja alterada no banco
        const finalKey = (metric.key === FIXED_METRIC_KEY || (metric.id.toString().includes('temp-default') && metric.key === FIXED_METRIC_KEY))
                         ? FIXED_METRIC_KEY
                         : generateKey(metric.name);

        return {
          ...(isNewOrUnsavedDefault ? {} : { id: metric.id }),
          company_id: company.id,
          name: metric.name,
          key: finalKey,
          display_order: metric.display_order, // Usa a ordem recalculada
        };
      });

      const currentRealIdsOnScreen = new Set(
        currentMetrics // Usa currentMetrics
          .map(m => m.id)
          .filter(id => id && !id.toString().startsWith('temp-'))
      );

      const metricsToDelete = existingIdsInDb.filter(id =>
        !currentRealIdsOnScreen.has(id) && existingMetricsMap.get(id) !== FIXED_METRIC_KEY // Não deleta a fixa
      );

      if (metricsToDelete.length > 0) {
        const { error: deleteError } = await supabase.from('funnel_metrics').delete().in('id', metricsToDelete);
        if (deleteError) throw deleteError;
      }

      if (metricsToUpsert.length > 0) {
        const { error: upsertError } = await supabase.from('funnel_metrics').upsert(metricsToUpsert, {
          onConflict: 'id',
        });
        if (upsertError) throw upsertError;
      }

      setStatus('success');
      setToast({ show: true, message: 'Funil salvo! A página será recarregada.', type: 'success' });
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      console.error('Error saving funnel:', error);
      setStatus('error');
      setToast({ show: true, message: `Erro ao salvar: ${error.message}`, type: 'error' });
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
            Personalize as etapas e métricas do seu funil de prospecção. A métrica "Propostas" é fixa.
          </p>
        </div>

        <div className="space-y-4 max-w-2xl">
          {loading ? (
            <p className="text-slate-500 dark:text-slate-400">Carregando métricas...</p>
          ) : (
            metrics.map((metric) => {
              // Verifica se é a métrica fixa pela chave ou pelo ID temporário padrão
              const isFixed = metric.key === FIXED_METRIC_KEY || metric.id === `temp-default-${FIXED_METRIC_KEY}`;
              return (
                <div key={metric.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isFixed ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                  <GripVertical className="h-5 w-5 text-slate-400 cursor-grab" />
                  <input
                    type="text"
                    value={metric.name}
                    onChange={(e) => handleNameChange(metric.id, e.target.value)}
                    //disabled={isFixed} // Você pode descomentar se quiser impedir a edição do NOME também
                    className={`flex-1 bg-transparent focus:outline-none text-slate-800 dark:text-slate-100 font-medium ${isFixed ? 'text-slate-500 dark:text-slate-400' : ''}`} // Remove cursor-not-allowed por enquanto
                  />
                  <span className={`text-xs px-2 py-1 rounded-md ${isFixed ? 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300' :'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                    {/* Garante que a chave da fixa seja sempre 'propostas' */}
                    {isFixed ? FIXED_METRIC_KEY : metric.key}
                  </span>
                  {isFixed ? (
                    <Lock size={16} className="text-slate-400" title="Esta métrica não pode ser excluída" />
                  ) : (
                    <button
                      onClick={() => handleDeleteMetric(metric.id)}
                      className="text-slate-400 hover:text-red-500"
                      aria-label="Excluir métrica"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })
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