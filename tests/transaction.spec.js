
// Importa test/expect do Playwright Test
import { test, expect } from '@playwright/test';

// Importa o POM de login
import { LoginPage } from '../pages/LoginPage.js';

// Importa o POM de customer/conta
import { CustomerPage } from '../pages/CustomerPage.js';

// Importa a validação com IA
import { validateBankConsistency } from '../ai/transactionValidator.js';

// Importa a função que notifica um webhook do n8n
import { notifyN8n } from '../utils/n8nNotifier.js';

// Define timeout máximo por teste (60 segundos)
test.setTimeout(60000);

// 🔥 HOOK GLOBAL - dispara quando o teste termina
// afterEach executa após cada teste do arquivo (passando ou falhando)
test.afterEach(async ({}, testInfo) => {
  // Monta um payload com informações do resultado do teste
  const payload = {
    event: 'playwright_result',                // tipo de evento (você definiu um nome fixo)
    title: testInfo.title,                     // título do teste
    status: testInfo.status,                   // status real: 'passed', 'failed', 'timedOut', etc
    expectedStatus: testInfo.expectedStatus,   // status esperado (normalmente 'passed')
    duration: testInfo.duration,               // duração em ms
    file: testInfo.file,                       // arquivo onde está o teste
    errors: testInfo.errors?.map(e => e.message) || [], // lista com mensagens de erro (se houver)
    timestamp: new Date().toISOString()         // timestamp do momento do envio
  };

  // Decide o nível do evento com base em status vs expectedStatus
  // Se diferente, considera falha/erro
  if (testInfo.status !== testInfo.expectedStatus) {
    payload.level = 'ERROR';
  } else {
    payload.level = 'SUCCESS';
  }

  // Envia o payload para o webhook do n8n (se N8N_WEBHOOK_URL estiver configurado)
  await notifyN8n(payload);
});

// Define o teste principal
test('OpenAI Banking Validation - Deposit and Withdraw (2 rounds)', async ({ page }) => {
  // Instancia os POMs com a mesma page do Playwright
  const login = new LoginPage(page);
  const customer = new CustomerPage(page);

  // Abre a tela de login
  await login.goTo();

  // Clica em Customer Login
  await login.loginAsCustomer();

  // Seleciona o customer e entra na conta
  await customer.selectCustomer('Harry Potter');

  // Round 1
  await customer.deposit(1000); // deposita 1000
  await customer.withdraw(200); // saca 200

  // Lê o saldo após Round 1 e guarda como referência
  const initialBalance = parseInt(await customer.getBalance(), 10);

  // Round 2
  await customer.deposit(1001); // deposita 1001 (OBS: aqui você mudou de 1000 para 1001)
  await customer.withdraw(200); // saca 200

  // Lê saldo final após Round 2
  const finalBalance = parseInt(await customer.getBalance(), 10);

  // Valida se o saldo final bate com o cálculo esperado
  // ⚠️ ATENÇÃO: seu cálculo aqui está usando +1000 -200,
  // mas no Round 2 você fez deposit(1001). Isso tende a gerar falha de 1 unidade.
  expect(finalBalance).toBe(initialBalance + 1000 - 200);

  // Pega o texto da tabela de transações
  const transactionsText = await customer.getTransactionsText();

  // Sanity check: confirma que não veio vazio
  expect(transactionsText && transactionsText.trim().length > 0).toBeTruthy();

  // Sanity check: confirma que existe pelo menos Credit/Debit no texto
  // Se falhar, mostra a tabela no erro pra facilitar debug
  expect(
    /Credit|Debit/i.test(transactionsText),
    `Tabela parece sem transações:\n${transactionsText}`
  ).toBe(true);

  // Chama IA para validar consistência entre transações e saldo final esperado
  const aiResult = await validateBankConsistency(transactionsText, finalBalance);

  // Se IA retornar pass=false, o teste falha mostrando a reason
  expect(aiResult.pass, aiResult.reason).toBe(true);
});