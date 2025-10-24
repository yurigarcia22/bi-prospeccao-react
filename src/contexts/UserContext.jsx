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

const SUPER_ADMIN_ID = '3410b050-8f73-43eb-91a4-6b8d3cb316de';

export function UserProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [userProfile, setUserProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [funnelMetrics, setFunnelMetrics] = useState(defaultFunnelMetrics);
  const [loading, setLoading] = useState(true);

  // Efeito para lidar com mudanças na autenticação
  useEffect(() => {
    console.log("CONTEXTO: Verificando sessão inicial...");
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("CONTEXTO: Sessão inicial obtida:", initialSession ? initialSession.user.id : null);
      setSession(initialSession);
      if (!initialSession) {
        console.log("CONTEXTO: Sem sessão inicial, finalizando loading.");
        setUserProfile(null);
        setCompany(null);
        setFunnelMetrics(defaultFunnelMetrics);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, updatedSession) => {
        console.log("CONTEXTO: Mudança no Auth State detectada:", _event, updatedSession ? updatedSession.user.id : null);
        setSession(updatedSession);
        if (!updatedSession) {
          console.log("CONTEXTO: Usuário deslogado, resetando tudo.");
          setUserProfile(null);
          setCompany(null);
          setFunnelMetrics(defaultFunnelMetrics);
          setLoading(false);
        } else if (session?.user?.id !== updatedSession?.user?.id) {
          console.log("CONTEXTO: Novo login detectado, iniciando loading de dados...");
          setLoading(true);
        }
      }
    );

    return () => {
      console.log("CONTEXTO: Cancelando inscrição do Auth State Change.");
      subscription.unsubscribe();
    };
  }, []); // Roda apenas uma vez

  // Efeito para carregar dados do usuário e empresa APÓS a sessão ser definida/alterada
  useEffect(() => {
    // Não executa se não houver sessão ou se o loading já foi finalizado artificialmente (ex: logout)
    if (!session || !loading) {
      if (!session && loading === false && session !== undefined) {
        console.log("CONTEXTO: Sem sessão e loading finalizado, garantindo estado limpo.");
        setUserProfile(null);
        setCompany(null);
        setFunnelMetrics(defaultFunnelMetrics);
      }
      return;
    }

    console.log(`CONTEXTO: Iniciando fetchUserData para user ${session.user.id}. Loading está ${loading}`);
    let isMounted = true; // Flag para evitar updates se o componente desmontar

    const fetchUserData = async () => {
      let companyIdToLoad = null;
      let profileData = null;

      try {
        console.log("CONTEXTO: Buscando perfil...");
        const { data: fetchedProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, role, company_id, status')
          .eq('id', session.user.id)
          .maybeSingle(); // IMPORTANTE: evita 406 quando 0 linhas (RLS)

        if (!isMounted) return;

        if (profileError) {
          console.error("CONTEXTO: Erro ao buscar perfil:", profileError);
          throw profileError;
        }

        if (!fetchedProfile) {
          console.error("CONTEXTO: Perfil não encontrado (verifique RLS em 'profiles').");
          setUserProfile(null);
          setCompany(null);
          setFunnelMetrics(defaultFunnelMetrics);
          setLoading(false);
          return;
        }

        profileData = fetchedProfile;
        setUserProfile(profileData);
        console.log("CONTEXTO: Perfil carregado:", profileData);

        // Determina qual company_id usar
        if (profileData.id === SUPER_ADMIN_ID) {
          console.log("CONTEXTO: Super Admin detectado. Chamando RPC get_my_company_id()...");
          const { data: activeCompanyId, error: rpcError } = await supabase.rpc('get_my_company_id');

          if (!isMounted) return;

          if (rpcError) {
            console.error("CONTEXTO: Erro ao chamar RPC get_my_company_id():", rpcError);
            companyIdToLoad = null;
          } else {
            companyIdToLoad = activeCompanyId;
            console.log("CONTEXTO: RPC retornou active_company_id:", companyIdToLoad);
          }
        } else {
          companyIdToLoad = profileData.company_id;
          console.log("CONTEXTO: Usuário normal. Usando company_id do perfil:", companyIdToLoad);
        }

        // Busca detalhes da empresa e métricas SE tiver um ID
        if (companyIdToLoad) {
          console.log(`CONTEXTO: Buscando dados para company_id ${companyIdToLoad}...`);
          const [companyRes, metricsRes] = await Promise.all([
            supabase
              .from('companies')
              .select('id, name, logo_url, ranking_metric_key')
              .eq('id', companyIdToLoad)
              .maybeSingle(),
            supabase
              .from('funnel_metrics')
              .select('*')
              .eq('company_id', companyIdToLoad)
              .order('display_order', { ascending: true })
          ]);

          if (!isMounted) return;

          if (companyRes?.error) {
            console.error(`CONTEXTO: Erro ao buscar empresa ${companyIdToLoad}:`, companyRes.error);
            setCompany(null);
          } else if (companyRes?.data) {
            setCompany(companyRes.data);
            console.log("CONTEXTO: Empresa carregada:", companyRes.data);
          } else {
            console.warn(`CONTEXTO: Empresa com ID ${companyIdToLoad} não encontrada ou sem permissão (RLS).`);
            setCompany(null);
          }

          if (metricsRes?.error) {
            console.error(`CONTEXTO: Erro ao buscar métricas ${companyIdToLoad}:`, metricsRes.error);
            setFunnelMetrics(defaultFunnelMetrics);
          } else if (metricsRes?.data && metricsRes.data.length > 0) {
            setFunnelMetrics(metricsRes.data);
            console.log("CONTEXTO: Métricas carregadas:", metricsRes.data);
          } else {
            console.log(`CONTEXTO: Nenhuma métrica encontrada para ${companyIdToLoad}, usando padrão.`);
            setFunnelMetrics(defaultFunnelMetrics);
          }
        } else {
          console.log("CONTEXTO: Sem company_id para carregar. Resetando empresa e métricas.");
          setCompany(null);
          setFunnelMetrics(defaultFunnelMetrics);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("CONTEXTO: Erro GERAL no fetchUserData:", error?.message || error);
        setUserProfile(profileData);
        setCompany(null);
        setFunnelMetrics(defaultFunnelMetrics);
      } finally {
        if (isMounted) {
          console.log("CONTEXTO: Finalizando loading.");
          setLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      console.log("CONTEXTO: Desmontando ou dependência mudou antes do fetchUserData terminar.");
      isMounted = false;
    };
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
