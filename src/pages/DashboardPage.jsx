// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import KpiCard from '../components/dashboard/KpiCard.jsx';
import ReactECharts from 'echarts-for-react';
import { useUser } from '../contexts/UserContext.jsx';
import { ShineBorder } from '../components/ui/ShineBorder.jsx';
import { Podium } from '../components/dashboard/Podium.jsx';
import { BarChart3 } from 'lucide-react'; // Importar ícone

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const formatDate = (date) => date.toISOString().split('T')[0];
const getDatesFromPeriod = (period, customStart, customEnd) => {
    if (period === 'personalizado') { return { startDate: customStart || null, endDate: customEnd || null }; }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate = new Date(today), endDate = new Date(today);
    switch (period) {
        case 'hoje': break;
        case 'ontem': startDate.setDate(today.getDate() - 1); endDate.setDate(today.getDate() - 1); break;
        case 'ultimos_7_dias': startDate.setDate(today.getDate() - 6); break;
        case 'este_mes': startDate = new Date(today.getFullYear(), today.getMonth(), 1); endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); break;
        case 'mes_passado': startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1); endDate = new Date(today.getFullYear(), today.getMonth(), 0); break;
        default: return { startDate: null, endDate: null };
    }
    return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
};

export default function DashboardPage() {
    // MUDANÇA AQUI: Pegamos userProfile para saber se é admin
    const { company, funnelMetrics, userProfile, loading: userContextLoading } = useUser();
    const companyId = company?.id;
    const isAdmin = userProfile?.role === 'admin';

    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [data, setData] = useState({ kpis: {}, rates: {}, desempenhoGeral: { series: [], categories: [] }, tendencia: { series: [], categories: [] }, ranking: [] });
    const [bdrs, setBdrs] = useState([]);
    const [selectedBdr, setSelectedBdr] = useState('todos');
    const [selectedPeriod, setSelectedPeriod] = useState('ultimos_7_dias');
    
    // MUDANÇA AQUI: Estado para controlar a métrica do ranking
    const [selectedRankingMetric, setSelectedRankingMetric] = useState(company?.ranking_metric_key || 'reunioes_marcadas');

    useEffect(() => {
        // Atualiza o estado se a métrica padrão da empresa mudar
        if (company?.ranking_metric_key) {
            setSelectedRankingMetric(company.ranking_metric_key);
        }
    }, [company?.ranking_metric_key]);

    // MUDANÇA AQUI: Lógica do ranking agora usa o estado 'selectedRankingMetric'
    const mainMetricForTrend = funnelMetrics.find(m => m.key === 'ligacoes') || funnelMetrics[0];
    const mainMetricsForPodium = funnelMetrics.find(m => m.key === selectedRankingMetric) || funnelMetrics[0];
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    const getChartOptions = (isDark) => ({ backgroundColor: 'transparent', tooltip: { trigger: 'axis' }, grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true }, textStyle: { fontFamily: 'Inter, sans-serif', fill: isDark ? '#A1A1AA' : '#333' } });
    const desempenhoGeralOptions = useMemo(() => ({ ...getChartOptions(isDarkMode), xAxis: { type: 'category', data: data.desempenhoGeral.categories, axisLabel: { color: isDarkMode ? '#A1A1AA' : '#555' } }, yAxis: { type: 'value', axisLabel: { color: isDarkMode ? '#A1A1AA' : '#555' } }, legend: { data: data.desempenhoGeral.series.map(s => s.name), textStyle: { color: isDarkMode ? '#A1A1AA' : '#555' } }, series: data.desempenhoGeral.series.map(s => ({ ...s, type: 'bar', barGap: '10%', barCategoryGap: '20%' })) }), [data.desempenhoGeral, isDarkMode]);
    const tendenciaOptions = useMemo(() => ({ ...getChartOptions(isDarkMode), xAxis: { type: 'category', data: data.tendencia.categories, boundaryGap: false, axisLabel: { color: isDarkMode ? '#A1A1AA' : '#555' } }, yAxis: { type: 'value', axisLabel: { color: isDarkMode ? '#A1A1AA' : '#555' } }, series: data.tendencia.series.map(s => ({ ...s, type: 'line', smooth: true, symbol: 'none', lineStyle: { color: '#6464FF' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(100, 100, 255, 0.4)' }, { offset: 1, color: 'rgba(100, 100, 255, 0)' }] } } })) }), [data.tendencia, isDarkMode]);
    
    useEffect(() => {
        if (!companyId) { setBdrs([]); return; }
        supabase.from('profiles').select('full_name').eq('company_id', companyId)
            .then(({ data: profiles }) => {
                if (profiles) setBdrs(profiles.map(p => p.full_name).filter(Boolean));
            });
    }, [companyId]);
    
    // MUDANÇA AQUI: A busca de dados agora depende da métrica do pódio
    useEffect(() => {
        if (!companyId || !mainMetricForTrend || !mainMetricsForPodium) { setDashboardLoading(false); return; }
        const fetchDashboardData = async () => {
            setDashboardLoading(true);
            try {
                // ... (lógica de busca de dados permanece a mesma)
                const { startDate, endDate } = getDatesFromPeriod(selectedPeriod, null, null);
                let dailyQuery = supabase.from('prospeccao_diaria').select('metrics, data, bdr_nome').eq('company_id', companyId);
                let proposalsQuery = supabase.from('propostas').select('status, valor, bdr_nome').eq('company_id', companyId);
                if (selectedBdr !== 'todos') { dailyQuery = dailyQuery.eq('bdr_nome', selectedBdr); proposalsQuery = proposalsQuery.eq('bdr_nome', selectedBdr); }
                if (startDate) { dailyQuery = dailyQuery.gte('data', startDate); proposalsQuery = proposalsQuery.gte('data_proposta', startDate); }
                if (endDate) { dailyQuery = dailyQuery.lte('data', endDate); proposalsQuery = proposalsQuery.lte('data_proposta', endDate); }

                const [{ data: dailyData }, { data: proposalsData }] = await Promise.all([dailyQuery, proposalsQuery]);
                
                const kpis = (dailyData || []).reduce((acc, row) => {
                    for (const key in row.metrics) {
                        acc[key] = (acc[key] || 0) + (row.metrics[key] || 0);
                    }
                    return acc;
                }, {});

                const proposalTotals = (proposalsData || []).reduce((acc, p) => {
                    if (p.status === 'Ganha') { acc.vendas_ganhas++; acc.valor_ganho += Number(p.valor); }
                    if (p.status === 'Perdida') { acc.propostas_perdidas++; }
                    if (p.status === 'Pendente') { acc.propostas_em_aberto++; acc.valor_em_aberto += Number(p.valor); }
                    return acc;
                }, { vendas_ganhas: 0, propostas_perdidas: 0, valor_ganho: 0, propostas_em_aberto: 0, valor_em_aberto: 0 });
                
                // Filtrar métricas de propostas do funil (propostas têm sua própria seção)
                const funnelMetricsWithoutProposals = funnelMetrics.filter(m => m.key !== 'propostas');
                
                const calcRate = (a, b) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : '0.0%');
                const rates = {};
                // Calcular taxas de conversão apenas para métricas do funil (sem propostas)
                for (let i = 0; i < funnelMetricsWithoutProposals.length - 1; i++) {
                    const currentMetric = funnelMetricsWithoutProposals[i];
                    const nextMetric = funnelMetricsWithoutProposals[i+1];
                    rates[currentMetric.key] = {
                        label: `${currentMetric.name.split(' ')[0]} → ${nextMetric.name.split(' ')[0]}`,
                        value: calcRate(kpis[nextMetric.key], kpis[currentMetric.key])
                    };
                }

                const dataByBdr = (dailyData || []).reduce((acc, row) => { 
                    const name = row.bdr_nome || 'N/A'; 
                    if (!acc[name]) acc[name] = {};
                    for(const key in row.metrics) {
                        acc[name][key] = (acc[name][key] || 0) + (row.metrics[key] || 0);
                    }
                    return acc; 
                }, {});
                const bdrNames = Object.keys(dataByBdr);
                // Usar métricas do funil (sem propostas) para o gráfico de desempenho geral
                const mainMetricsForChart = funnelMetricsWithoutProposals.slice(0, 3);
                const desempenhoGeral = { 
                    categories: bdrNames, 
                    series: mainMetricsForChart.map(metric => ({
                        name: metric.name,
                        data: bdrNames.map(name => dataByBdr[name][metric.key] || 0)
                    }))
                };

                const dataByDay = (dailyData || []).reduce((acc, row) => { const day = row.data; if (!acc[day]) acc[day] = 0; acc[day] += (row.metrics[mainMetricForTrend.key] || 0); return acc; }, {});
                const sortedDays = Object.keys(dataByDay).sort((a, b) => new Date(a) - new Date(b));
                const tendencia = { categories: sortedDays, series: [{ name: mainMetricForTrend.name, data: sortedDays.map(day => dataByDay[day]) }] };
                
                const ranking = Object.entries(dataByBdr).map(([name, values]) => ({ name, value: values[mainMetricsForPodium.key] || 0 })).sort((a,b) => b.value - a.value);

                setData({ kpis: { ...kpis, ...proposalTotals }, rates, desempenhoGeral, tendencia, ranking });
            } catch(error) {
                console.error("Erro ao buscar dados do dashboard:", error);
            } finally {
                setDashboardLoading(false);
            }
        };
        fetchDashboardData();
    }, [companyId, selectedBdr, selectedPeriod, funnelMetrics, mainMetricForTrend, mainMetricsForPodium]);

    // MUDANÇA AQUI: Nova função para lidar com a mudança do ranking
    const handleRankingMetricChange = async (event) => {
        const newMetricKey = event.target.value;
        setSelectedRankingMetric(newMetricKey);

        if (isAdmin && companyId) {
            const { error } = await supabase
                .from('companies')
                .update({ ranking_metric_key: newMetricKey })
                .eq('id', companyId);
            
            if (error) {
                alert('Erro ao salvar a métrica do ranking.');
                // Reverte para o valor antigo se der erro
                setSelectedRankingMetric(company.ranking_metric_key);
            }
        }
    };

    if (userContextLoading) {
        return <div className="text-center p-8 text-slate-500">Carregando usuário...</div>
    }

    const podiumData = data.ranking.map((item, index) => ({ id: item.name + index, name: item.name, count: item.value, }));
    const periodLabels = { hoje: "Hoje", ontem: "Ontem", ultimos_7_dias: "Últimos 7 dias", este_mes: "Este Mês", mes_passado: "Mês Passado", maximo: "Período Completo" };
    const selectedPeriodLabel = periodLabels[selectedPeriod] || "Período Personalizado";

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">BDR</label><select value={selectedBdr} onChange={(e) => setSelectedBdr(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md dark:text-white"><option value="todos">Todos</option>{bdrs.map(bdr => <option key={bdr} value={bdr}>{bdr}</option>)}</select></div>
                    <div><label className="text-sm font-medium text-slate-700 dark:text-slate-300">Período</label><select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md dark:text-white"><option value="hoje">Hoje</option><option value="ontem">Ontem</option><option value="ultimos_7_dias">Últimos 7 dias</option><option value="este_mes">Este Mês</option><option value="mes_passado">Mês Passado</option><option value="maximo">Máximo</option><option value="personalizado">Personalizado</option></select></div>
                </div>
            </div>

            {(!companyId && !userContextLoading) || dashboardLoading ? (
                <div className="text-center p-8 text-slate-500">Carregando dados do dashboard...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <KpiCard title="Vendas Ganhas" value={data.kpis.vendas_ganhas} color="success" />
                        <KpiCard title="Valor Ganho" value={formatCurrency(data.kpis.valor_ganho)} color="success" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Métricas do Funil</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {funnelMetrics.filter(metric => metric.key !== 'propostas').map(metric => (
                                <KpiCard key={metric.key} title={metric.name} value={data.kpis[metric.key] || 0} />
                            ))}
                        </div>
                    </div>
                    
                    <div>
                         <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Métricas de Propostas</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                           {funnelMetrics.find(m => m.key === 'propostas') && (
                               <KpiCard title="Propostas" value={data.kpis.propostas || 0} />
                           )}
                           <KpiCard title="Propostas em Aberto" value={data.kpis.propostas_em_aberto || 0} />
                           <KpiCard title="Valor em Aberto" value={formatCurrency(data.kpis.valor_em_aberto)} />
                           <KpiCard title="Propostas Perdidas" value={data.kpis.propostas_perdidas || 0} color="danger" />
                        </div>
                    </div>

                    <div className="relative bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Taxas de Conversão do Funil</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                            {Object.values(data.rates).map(rate => (
                                <KpiCard key={rate.label} title={rate.label} value={rate.value} />
                            ))}
                        </div>
                        <ShineBorder />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="relative bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Desempenho Geral (Top 3 Métricas)</h3>
                            <ReactECharts option={desempenhoGeralOptions} style={{ height: 350 }} />
                            <ShineBorder />
                        </div>
                        <div className="relative bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Tendência de "{mainMetricForTrend?.name || ''}"</h3>
                            <ReactECharts option={tendenciaOptions} style={{ height: 350 }} />
                            <ShineBorder shineColor="#f59e0b" />
                        </div>
                    </div>
                    
                    <Podium
                        title={`Ranking de ${mainMetricsForPodium?.name || 'Performance'}`}
                        periodLabel={selectedPeriodLabel}
                        data={podiumData}
                        loading={dashboardLoading}
                        // MUDANÇA AQUI: Passando o seletor para o Podium
                        rankingSelector={
                            <div className="flex items-center gap-2">
                                <label htmlFor="ranking-metric" className="text-sm font-medium text-slate-500 dark:text-slate-400">Ranking por:</label>
                                <select 
                                    id="ranking-metric"
                                    value={selectedRankingMetric}
                                    onChange={handleRankingMetricChange}
                                    // Se não for admin, o dropdown é desabilitado
                                    disabled={!isAdmin}
                                    className="block w-full md:w-auto pl-3 pr-10 py-1.5 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md dark:text-white disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {funnelMetrics.map(metric => (
                                        <option key={metric.key} value={metric.key}>{metric.name}</option>
                                    ))}
                                </select>
                            </div>
                        }
                    />
                </>
            )}
        </div>
    );
}