
// Importa a biblioteca oficial da OpenAI para poder fazer chamadas à API
import OpenAI from 'openai';

// Cria uma instância do cliente da OpenAI
// Essa instância será usada para enviar requisições para o modelo
const client = new OpenAI({
  // Aqui ele pega a chave da API de uma variável de ambiente
  // Isso é uma boa prática de segurança (não expor a chave no código)
  apiKey: process.env.OPENAI_API_KEY,
});

// Exporta uma função assíncrona chamada runOpenAI
// "async" significa que essa função trabalha com operações assíncronas (promises)
export async function runOpenAI(prompt) {

  // Faz uma chamada para a API da OpenAI usando o método responses.create
  // "await" faz o código esperar a resposta antes de continuar
  const resp = await client.responses.create({

    // Define qual modelo será utilizado
    // 'gpt-4.1-mini' é um modelo mais rápido e barato
    model: 'gpt-4.1-mini',

    // Define o texto de entrada (prompt) que será enviado para o modelo
    input: prompt,
  });

  // Retorna o texto gerado pelo modelo
  // resp.output_text contém a resposta da IA
  // || '' garante que, se for undefined, retorna uma string vazia
  // .trim() remove espaços em branco no início e no fim
  return (resp.output_text || '').trim();
}