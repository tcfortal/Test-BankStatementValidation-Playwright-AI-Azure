// Exporta uma função assíncrona que envia dados para o webhook do n8n
export async function notifyN8n(payload) {

  // Cria um AbortController para poder cancelar a requisição (timeout manual)
  const controller = new AbortController();

  // Define um timeout de 5 segundos
  // Se passar disso, aborta a requisição
  const timeout = setTimeout(() => controller.abort(), 5000); // 5s

  try {
    // Pega a URL do webhook a partir da variável de ambiente
    const url = process.env.N8N_WEBHOOK_URL;

    // Se não houver URL definida, não tenta enviar nada
    if (!url) {
      console.warn('⚠️ N8N_WEBHOOK_URL não definida');
      return;
    }

    // Se o payload não tiver sessionId, cria um automaticamente
    // ??= significa "atribui somente se for null ou undefined"
    payload.sessionId ??= `pw-${Date.now()}`;

    // Se não tiver timestamp, adiciona o horário atual
    payload.timestamp ??= new Date().toISOString();

    // Se existir array de erros, faz limpeza
    if (payload.errors) {

      // Remove códigos ANSI (cores do terminal)
      // Isso evita enviar lixo visual para logs ou sistemas externos
      payload.errors = payload.errors.map(err =>
        String(err).replace(/\u001b\[[0-9;]*m/g, '')
      );
    }

    // Faz a chamada HTTP para o webhook
    const res = await fetch(url, {

      // Método POST (envio de dados)
      method: 'POST',

      // Headers da requisição
      headers: {
        // Indica que o corpo é JSON
        'Content-Type': 'application/json',

        // Token opcional de autenticação para o webhook
        // Se não existir, envia vazio
        'x-hook-token': process.env.N8N_HOOK_TOKEN || '',
      },

      // Corpo da requisição (payload convertido para JSON)
      body: JSON.stringify(payload),

      // Passa o signal do AbortController para permitir cancelamento
      signal: controller.signal,
    });

    // Se a resposta HTTP não for OK (status 200-299)
    if (!res.ok) {

      // Loga erro com status e corpo da resposta (para debug)
      console.error('❌ N8N erro:', res.status, await res.text());

    } else {
      // Log de sucesso
      console.log('✅ enviado para n8n');
    }

  } catch (err) {

    // Se o erro for causado por timeout (abort)
    if (err.name === 'AbortError') {

      console.warn('⚠️ Timeout ao enviar para n8n');

    } else {
      // Qualquer outro erro (network, etc)
      console.error('❌ erro n8n:', err.message);
    }

  } finally {

    // Sempre limpa o timeout (evita vazamento de memória)
    clearTimeout(timeout);
  }
}