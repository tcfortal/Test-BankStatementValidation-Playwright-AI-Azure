// Importa a função runOpenAI do arquivo openaiEngine.js
// Ela é responsável por mandar o prompt para a OpenAI e devolver o texto de resposta
import { runOpenAI } from './openaiEngine.js';

// Função utilitária para tentar detectar se o texto da tabela de transações está vazio
// (por exemplo: só tem cabeçalho e nenhuma transação)
function isProbablyEmptyTable(text) {
  // Garante que 'text' vire string e remove espaços no começo e fim
  const t = String(text || '').trim();

  // Se depois de trim a string ficou vazia, considera tabela vazia
  if (!t) return true;

  // Verifica se o texto parece conter os cabeçalhos da tabela
  // (tenta achar "Date-Time", "Amount" e "Transaction Type", ignorando maiúsculas/minúsculas)
  const hasHeaders =
    /Date-?Time/i.test(t) &&          // acha "DateTime" ou "Date-Time" (por causa do -?)
    /Amount/i.test(t) &&              // acha "Amount"
    /Transaction Type/i.test(t);      // acha "Transaction Type"

  // Verifica se há algum indício de transação por tipo (Credit ou Debit)
  const hasCreditOrDebit = /Credit|Debit/i.test(t);

  // Verifica se existe algum número no texto (pode indicar uma linha de transação)
  // OBS: isso é um heurístico simples: qualquer número pode disparar
  const hasMoneyRow = /\b\d+\b/.test(t); // "alguma linha com número"

  // Se tem cabeçalho mas não tem "Credit/Debit" nem números,
  // então provavelmente é só header sem transações
  if (hasHeaders && !hasCreditOrDebit && !hasMoneyRow) return true;

  // Caso contrário, considera que não é uma tabela vazia
  return false;
}

// Tenta extrair um JSON de dentro de um texto qualquer
// Útil porque às vezes o modelo pode retornar texto extra antes/depois do JSON
function extractJson(raw) {
  // Regex pega do primeiro "{" até o último "}" (inclui múltiplas linhas por causa do [\s\S])
  const match = String(raw || '').match(/\{[\s\S]*\}/);

  // Se encontrou, retorna o trecho que parece JSON; se não, retorna null
  return match ? match[0] : null;
}

// Exporta a função principal que valida consistência do banco
// Ela recebe:
// - transactionsText: o texto da tabela de transações
// - expectedBalance: o saldo final esperado (número ou string)
export async function validateBankConsistency(transactionsText, expectedBalance) {

  // 1) valida input antes de gastar tokens (boa prática: evitar chamar IA desnecessariamente)

  // Se não veio texto algum, já falha com um motivo claro
  if (!transactionsText || String(transactionsText).trim().length === 0) {
    return {
      pass: false, // indica que a validação falhou
      reason: 'Tabela de transações não fornecida para validação (transactionsText vazio).', // motivo
    };
  }

  // Se o texto parece ser só cabeçalho e sem linhas, falha com orientação do que verificar
  if (isProbablyEmptyTable(transactionsText)) {
    return {
      pass: false,
      reason:
        'Tabela de transações parece vazia (apenas headers/sem linhas). Verifique filtro de data e o Reset.',
    };
  }

  // 2) prompt bem restrito para JSON
  // Aqui você cria um prompt para a IA agir como "auditor QA"
  // e retornar SOMENTE JSON com as chaves definidas
  const prompt = `
Você é um auditor QA de banco.

Você receberá o TEXTO de uma tabela de transações e um saldo final esperado.
Sua tarefa é verificar consistência entre transações e saldo final.

TEXTO DA TABELA:
${transactionsText}

SALDO FINAL ESPERADO: ${expectedBalance}

Regras de resposta:
- Responda APENAS com JSON válido (sem texto fora do JSON).
- Use exatamente estas chaves: "pass" (boolean) e "reason" (string curta).
- Se não der para concluir com confiança, retorne pass=false.

Formato EXATO:
{"pass": true, "reason": "..."}

Agora responda.
`.trim(); // trim() remove espaços e linhas em branco extras no começo/fim do prompt

  // Chama a OpenAI com o prompt e recebe a resposta crua (texto)
  const raw = await runOpenAI(prompt);

  // Tenta extrair o JSON de dentro do texto retornado
  const jsonStr = extractJson(raw);

  // Se não conseguiu extrair algo que pareça JSON, falha e retorna a resposta recebida
  if (!jsonStr) {
    return { pass: false, reason: `Resposta não veio em JSON: ${raw}` };
  }

  // Tenta fazer parse do JSON extraído
  try {
    const obj = JSON.parse(jsonStr);

    // normaliza e valida estrutura

    // Garante que a chave pass existe e é boolean
    // (isso evita aceitar "pass": "true" como string, por exemplo)
    if (typeof obj.pass !== 'boolean') {
      return { pass: false, reason: `JSON inválido (pass não é boolean): ${jsonStr}` };
    }

    // Retorna no formato padronizado (pass e reason)
    return {
      pass: obj.pass,                 // boolean vindo do modelo
      reason: String(obj.reason || ''), // garante que reason seja string (mesmo se vier null/undefined)
    };
  } catch {
    // Se deu erro no parse (JSON quebrado), falha e devolve a resposta crua
    return { pass: false, reason: `Falha ao parsear JSON: ${raw}` };
  }
}