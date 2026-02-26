// Exporta uma função assíncrona chamada notifyN8n
// Essa função envia dados (payload) para um webhook do n8n
export async function notifyN8n(payload) {

  // Obtém a URL do webhook a partir de uma variável de ambiente
  // Isso evita deixar a URL fixa no código (boa prática de segurança)
  const url = process.env.N8N_WEBHOOK_URL;

  // Se não existir URL configurada, simplesmente sai da função
  // (evita erro em ambiente local ou quando não quiser enviar notificação)
  if (!url) return;

  // Faz uma requisição HTTP para o webhook do n8n
  // usando o método POST
  await fetch(url, {

    // Define o método HTTP como POST (envio de dados)
    method: 'POST',

    // Define os headers da requisição
    headers: {
      // Informa que o corpo da requisição está em formato JSON
      'Content-Type': 'application/json'
    },

    // Converte o payload (objeto JS) em string JSON
    // para enviar no corpo da requisição
    body: JSON.stringify(payload),
  });
}