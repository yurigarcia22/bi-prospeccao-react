// src/contexts/UserContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [company, setCompany] = useState(null);
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
          // --- MUDANÇA PRINCIPAL AQUI ---
          // Agora pedimos também a coluna 'logo_url'
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('id, name, logo_url') // <-- CORREÇÃO APLICADA
            .eq('id', profileData.company_id)
            .single();
          if (companyError) throw companyError;
          setCompany(companyData);
        } else {
          setCompany(null);
        }
      } catch (error) {
        console.error("ERRO NO CONTEXTO: ", error.message);
        setUserProfile(null);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session]);

  const value = { session, userProfile, company, loading };

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