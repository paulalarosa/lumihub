/**
 * Validador de Variáveis de Ambiente em Tempo de Execução.
 * Impede que a aplicação seja exibida quebrada caso falte alguma chave crítica na Vercel/Netlify.
 */
export function validateEnv() {
  const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']

  const missingVars = requiredEnvVars.filter(
    (envVar) => !import.meta.env[envVar],
  )

  if (missingVars.length > 0) {
    const errorMsg = `Problema de Configuração: Faltam as seguintes variáveis necessárias: ${missingVars.join(', ')}`
    console.error(errorMsg)

    // Substitui o DOM por uma mensagem clara para evitar blank screen tracking
    const root = document.getElementById('root')
    if (root) {
      root.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #0c0c0e; color: #ef4444; font-family: ui-sans-serif, system-ui, sans-serif; padding: 20px; text-align: center;">
          <h1 style="font-size: 24px; margin-bottom: 16px; font-weight: 600;">⚠️ Inicialização Interrompida</h1>
          <p style="font-size: 16px; margin-bottom: 8px; color: #9ca3af;">A aplicação não pode ser carregada pois faltam configurações no servidor.</p>
          <p style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">Verifique o painel da provedora (ex: AWS Console) e adicione as seguintes chaves Environment:</p>
          <code style="background: rgba(239, 68, 68, 0.1); padding: 12px 24px; border-radius: 6px; border: 1px solid rgba(239, 68, 68, 0.2); font-size: 14px; font-weight: bold; letter-spacing: 1px;">
            ${missingVars.join('<br/>')}
          </code>
        </div>
      `
    }

    throw new Error(errorMsg)
  }

  // Avisa sobre variáveis secundárias (Apenas LOG, não trava o frontend se não existirem ainda)
  const recommendedVars = ['VITE_STRIPE_PUBLISHABLE_KEY']
  const missingRecommended = recommendedVars.filter((v) => !import.meta.env[v])

  if (missingRecommended.length > 0) {
    console.warn(
      `[Khaos Kontrol Env] Falta de chaves secundárias. Algumas dependências de integração podem não renderizar: ${missingRecommended.join(', ')}`,
    )
  }
}
