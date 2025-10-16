// src/pages/SettingsCompanyPage.jsx

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../contexts/UserContext';
import Toast from '../components/ui/Toast';
import { UploadCloud, Building } from 'lucide-react';

export default function SettingsCompanyPage() {
  const { company } = useUser();
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (company) {
      setName(company.name);
      // Busca a URL do logo mais recente, se houver, para evitar cache do navegador
      if (company.logo_url) {
        setLogoPreview(company.logo_url + `?t=${new Date().getTime()}`);
      }
    }
  }, [company]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company) return;
    setLoading(true);

    try {
      let logoUrlToUpdate = company.logo_url;

      // 1. Faz o upload do novo logo, se houver
      if (logoFile) {
        const filePath = `public/${company.id}/${Date.now()}-${logoFile.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false // não sobrescreve, sempre cria um novo
          });
        
        if (uploadError) throw uploadError;

        // 2. Pega a URL pública do novo logo
        const { data: publicUrlData } = supabase.storage
          .from('logos')
          .getPublicUrl(filePath);

        logoUrlToUpdate = publicUrlData.publicUrl;
      }

      // 3. Atualiza os dados da empresa no banco de dados
      if (name !== company.name || logoUrlToUpdate !== company.logo_url) {
        const { error: updateError } = await supabase
          .from('companies')
          .update({ name: name, logo_url: logoUrlToUpdate })
          .eq('id', company.id);

        if (updateError) throw updateError;
      }

      setToast({ show: true, message: 'Informações da empresa salvas com sucesso!', type: 'success' });
      
      // Força o recarregamento da página para que o UserContext e o Header busquem os novos dados
      setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      console.error("Erro ao salvar configurações da empresa:", error);
      setToast({ show: true, message: `Erro: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!company) return <div>Carregando informações da empresa...</div>;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            Perfil da Empresa
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Atualize o nome e o logo da sua empresa.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nome da Empresa
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="companyName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm focus:border-brand-accent focus:ring-brand-accent sm:text-sm p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Logo da Empresa
            </label>
            <div className="mt-1 flex items-center gap-4">
              <div className="flex-shrink-0 h-16 w-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain rounded-lg p-1" />
                ) : (
                  <Building className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <label htmlFor="logo-upload" className="relative cursor-pointer rounded-md bg-white dark:bg-slate-700 font-medium text-brand-accent hover:text-brand-accent/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-accent focus-within:ring-offset-2 p-2 border border-slate-300 dark:border-slate-600">
                <span>Fazer upload</span>
                <input id="logo-upload" name="logo-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/svg+xml" />
              </label>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-brand-accent py-2 px-4 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
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