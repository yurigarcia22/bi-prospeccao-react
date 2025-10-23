// src/contexts/UserContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const UserContext = createContext();

const defaultFunnelMetrics = [
  { name: 'Ligações', key: 'ligacoes', display_order: 0 },
  { name: 'Conexões', key: 'conexoes', display_order: 1 },
  { name: 'Conexões c/ Decisor', key: 'conexoes_decisor', display_order: 2 },
  { name: 'Reuniões Marcadas', key: 'reunioes_marcadas', display_order: 3 },
  { name: 'Reuniões Realizadas', key: 'reunioes_realizadas', display_order: 4 },
  { name: 'Reuniões Qualificadas', key: 'reunioes_qualificadas', display_order: 5 },
  { name: 'Propostas', key: 'propostas', display_order: 6 },
];

export function UserProvider({ children }) {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [funnelMetrics, setFunnelMetrics] = useState(defaultFunnelMetrics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (!initialSession) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, updatedSession) => { setSession(updatedSession); }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setUserProfile(null);
      setCompany(null);
      setFunnelMetrics(defaultFunnelMetrics);
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchUserData = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, role, company_id, status')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;
        setUserProfile(profileData);

        if (profileData && profileData.company_id) {
          const [companyRes, metricsRes] = await Promise.all([
            supabase
              .from('companies')
              // MUDANÇA AQUI: Buscamos a nova coluna
              .select('id, name, logo_url, ranking_metric_key')
              .eq('id', profileData.company_id)
              .single(),
            supabase
              .from('funnel_metrics')
              .select('*')
              .eq('company_id', profileData.company_id)
              .order('display_order', { ascending: true })
          ]);

          if (companyRes.error) throw companyRes.error;
          setCompany(companyRes.data);

          if (metricsRes.error) throw metricsRes.error;
          
          if (metricsRes.data && metricsRes.data.length > 0) {
            setFunnelMetrics(metricsRes.data);
          } else {
            setFunnelMetrics(defaultFunnelMetrics);
          }

        } else {
          setCompany(null);
          setFunnelMetrics(defaultFunnelMetrics);
        }
      } catch (error) {
        console.error("ERRO NO CONTEXTO: ", error.message);
        setUserProfile(null);
        setCompany(null);
        setFunnelMetrics(defaultFunnelMetrics);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session]);

  const value = { session, userProfile, company, funnelMetrics, loading };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
}