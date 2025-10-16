// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import KpiCard from '../components/dashboard/KpiCard.jsx';
import ReactECharts from 'echarts-for-react';
import { useUser } from '../contexts/UserContext.jsx';
import { ShineBorder } from '../components/ui/ShineBorder.jsx';
import { Podium } from '../components/dashboard/Podium.jsx';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const formatDate = (date) => date.toISOString().split('T')[0];
const getDatesFromPeriod = (period, customStart, customEnd) => {
    if (period === 'personalizado') { return { startDate: customStart || null, endDate: customEnd || null }; }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate = new Date(today), endDate = new Date(today);
    switch(period) {
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
  const { company, loading: userContextLoading } = useUser();
  const companyId = company?.id;

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [data, setData] = useState({ kpis: {}, rates: {}, desempenhoGeral: { series: [], categories: [] }, tendenciaLigacoes: { series: [], categories: [] }, ranking: [] });
  const [bdrs, setBdrs] = useState([]);
  const [selectedBdr, setSelectedBdr] = useState('todos');
  const [selectedPeriod, setSelectedPeriod] = useState('ultimos_7_dias');
  
  const isDarkMode = document.documentElement.classList.contains('dark');
  const getChartOptions = (isDark) => ({ backgroundColor: 'transparent', tooltip: { trigger: 'axis' }, grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true }, textStyle: { fontFamily: 'Inter, sans-serif', fill: isDark ? '#A1A1AA' : '#333' } });
  const desempenhoGeralOptions = useMemo(() => ({ ...getChartOptions(isDarkMode), xAxis: { type: 'category', data: data.desempenhoGeral.categories, axisLabel: { color: isDarkMode ? '#A1A1AA' : '#555' } }, yAxis: { type: 'value', axisLabel: { color: isDarkMode ? '#A1A1AA' : '#555' } }, legend: { data: ['Ligações', 'Conexões', 'Reuniões'], textStyle: { color: isDarkMode ? '#A1A1AA' : '#555' } }, series: data.desempenhoGeral.series.map(s => ({ ...s, type: 'bar', barGap: '10%', barCategoryGap: '20%' })) }), [data.desempenhoGeral, isDarkMode]);
  const tendenciaLigacoesOptions = useMemo(() => ({ ...getChartOptions(isDarkMode), xAxis: { type: 'category', data: data.tendenciaLigacoes.categories, boundaryGap: false, axisLabel: { color: isDarkMode ? '#A1A1AA' : '#555' } }, yAxis: { type: 'value', axisLabel: { color: isDarkMode ? '#A1A1AA' : '#555' } }, series: data.tendenciaLigacoes.series.map(s => ({ ...s, type: 'line', smooth: true, symbol: 'none', lineStyle: { color: '#6464FF' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(100, 100, 255, 0.4)' }, { offset: 1, color: 'rgba(100, 100, 255, 0)' }] } } })) }), [data.tendenciaLigacoes, isDarkMode]);
  
  useEffect(() => {
    if (!companyId) { setBdrs([]); return; }
    supabase.from('profiles').select('full_name').eq('company_id', companyId)
      .then(({ data: profiles }) => {
        if (profiles) setBdrs(profiles.map(p => p.full_name).filter(Boolean));
      });
  }, [companyId]);
  
  useEffect(() => {
    if (!companyId) { setDashboardLoading(false); return; }
    const fetchDashboardData = async () => {
      setDashboardLoading(true);
      try {
        const { startDate, endDate } = getDatesFromPeriod(selectedPeriod, null, null);
        let dailyQuery = supabase.from('prospeccao_diaria').select('*').eq('company_id', companyId);
        let proposalsQuery = supabase.from('propostas').select('*').eq('company_id', companyId);
        if (selectedBdr !== 'todos') { dailyQuery = dailyQuery.eq('bdr_nome', selectedBdr); proposalsQuery = proposalsQuery.eq('bdr_nome', selectedBdr); }
        if (startDate) { dailyQuery = dailyQuery.gte('data', startDate); proposalsQuery = proposalsQuery.gte('data_proposta', startDate); }
        if (endDate) { dailyQuery = dailyQuery.lte('data', endDate); proposalsQuery = proposalsQuery.lte('data_proposta', endDate); }
        const [{ data: dailyData }, { data: proposalsData }] = await Promise.all([dailyQuery, proposalsQuery]);
        const kpis = (dailyData || []).reduce((acc, row) => ({...acc, ligacoes: acc.ligacoes + (row.ligacoes || 0), conexoes: acc.conexoes + (row.conexoes || 0), conexoes_decisor: acc.conexoes_decisor + (row.conexoes_decisor || 0), reunioes_marcadas: acc.reunioes_marcadas + (row.reunioes_marcadas || 0), reunioes_realizadas: acc.reunioes_realizadas + (row.reunioes_realizadas || 0), reunioes_qualificadas: acc.reunioes_qualificadas + (row.reunioes_qualificadas || 0), propostas: acc.propostas + (row.propostas || 0)}), { ligacoes: 0, conexoes: 0, conexoes_decisor: 0, reunioes_marcadas: 0, reunioes_realizadas: 0, reunioes_qualificadas: 0, propostas: 0 });
        const proposalTotals = (proposalsData || []).reduce((acc, p) => { if (p.status === 'Ganha') { acc.vendas_ganhas++; acc.valor_ganho += Number(p.valor); } if (p.status === 'Perdida') { acc.propostas_perdidas++; } return acc; }, { vendas_ganhas: 0, propostas_perdidas: 0, valor_ganho: 0 });
        const calcRate = (a, b) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : '0.0%');
        const rates = { lig_con: calcRate(kpis.conexoes, kpis.ligacoes), mar_rea: calcRate(kpis.reunioes_realizadas, kpis.reunioes_marcadas), rea_qua: calcRate(kpis.reunioes_qualificadas, kpis.reunioes_realizadas), prop_venda: calcRate(proposalTotals.vendas_ganhas, kpis.propostas) };
        const dataByBdr = (dailyData || []).reduce((acc, row) => { const name = row.bdr_nome || 'N/A'; if (!acc[name]) acc[name] = { ligacoes: 0, conexoes: 0, reunioes_marcadas: 0 }; acc[name].ligacoes += row.ligacoes || 0; acc[name].conexoes += row.conexoes || 0; acc[name].reunioes_marcadas += row.reunioes_marcadas || 0; return acc; }, {});
        const bdrNames = Object.keys(dataByBdr);
        const desempenhoGeral = { categories: bdrNames, series: [{ name: 'Ligações', data: bdrNames.map(name => dataByBdr[name].ligacoes) }, { name: 'Conexões', data: bdrNames.map(name => dataByBdr[name].conexoes) }, { name: 'Reuniões', data: bdrNames.map(name => dataByBdr[name].reunioes_marcadas) }] };
        const dataByDay = (dailyData || []).reduce((acc, row) => { const day = row.data; if (!acc[day]) acc[day] = 0; acc[day] += row.ligacoes || 0; return acc; }, {});
        const sortedDays = Object.keys(dataByDay).sort((a, b) => new Date(a) - new Date(b));
        const tendenciaLigacoes = { categories: sortedDays, series: [{ name: 'Ligações', data: sortedDays.map(day => dataByDay[day]) }] };
        const ranking = Object.entries(dataByBdr).map(([name, values]) => ({ name, value: values.reunioes_marcadas })).sort((a,b) => b.value - a.value);
        setData({ kpis: { ...kpis, ...proposalTotals }, rates, desempenhoGeral, tendenciaLigacoes, ranking });
      } catch(error) {
        console.error("Erro ao buscar dados do dashboard:", error);
      } finally {
        setDashboardLoading(false);
      }
    };
    fetchDashboardData();
  }, [companyId, selectedBdr, selectedPeriod]);

  if (userContextLoading) {
      return <div className="text-center p-8 text-slate-500">Carregando usuário...</div>
  }
  
  const podiumData = data.ranking.map((item, index) => ({
      id: item.name + index,
      name: item.name,
      count: item.value,
  }));
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <KpiCard title="Vendas Ganhas" value={data.kpis.vendas_ganhas} color="success" />
              <KpiCard title="Valor Ganho" value={formatCurrency(data.kpis.valor_ganho)} color="success" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <KpiCard title="Ligações" value={data.kpis.ligacoes} />
              <KpiCard title="Conexões" value={data.kpis.conexoes} />
              <KpiCard title="Conexões c/ Decisor" value={data.kpis.conexoes_decisor} />
              <KpiCard title="Reuniões Marcadas" value={data.kpis.reunioes_marcadas} />
              <KpiCard title="Reuniões Realizadas" value={data.kpis.reunioes_realizadas} />
              <KpiCard title="Reuniões Qualificadas" value={data.kpis.reunioes_qualificadas} />
              <KpiCard title="Propostas" value={data.kpis.propostas} />
              <KpiCard title="Propostas Perdidas" value={data.kpis.propostas_perdidas} color="danger" />
            </div>
          </div>
          
          <div className="relative bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Taxas de Conversão</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <KpiCard title="Ligações → Conexões" value={data.rates.lig_con} />
                <KpiCard title="Marcadas → Realizadas" value={data.rates.mar_rea} />
                <KpiCard title="Realizadas → Qualificadas" value={data.rates.rea_qua} />
                <KpiCard title="Propostas → Vendas" value={data.rates.prop_venda} />
            </div>
            <ShineBorder />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="relative bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Desempenho Geral</h3>
              <ReactECharts option={desempenhoGeralOptions} style={{ height: 350 }} />
              <ShineBorder />
            </div>
            <div className="relative bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Tendência de Ligações</h3>
              <ReactECharts option={tendenciaLigacoesOptions} style={{ height: 350 }} />
              <ShineBorder shineColor="#f59e0b" />
            </div>
          </div>
          
          <Podium
            title="Ranking de Reuniões Marcadas"
            periodLabel={selectedPeriodLabel}
            data={podiumData}
            loading={dashboardLoading}
          />
        </>
      )}
    </div>
  );
}