// Teste da função invite-user
async function testInviteFunction() {
  const SUPABASE_URL = 'https://<SEU-PROJETO>.supabase.co';
  const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/invite-user`;
  
  // Substitua pelo token de autenticação do usuário logado
  const AUTH_TOKEN = 'Bearer <SEU-JWT-TOKEN>';
  
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN
      },
      body: JSON.stringify({
        email: 'teste@exemplo.com',
        role: 'user'
      })
    });
    
    const result = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${result}`);
    }
    
    console.log('✅ Função funcionando!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Execute no console do navegador
testInviteFunction();

