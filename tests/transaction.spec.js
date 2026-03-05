
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { CustomerPage } from '../pages/CustomerPage.js';

// Define o tempo máximo permitido para o teste inteiro (60 segundos)
test.setTimeout(60000);

// O Playwright injeta { page } que é a aba do navegador controlada pelo teste
test('Login - Neville Longbottom', async ({ page }) => {
  // Cria uma instância do LoginPage usando a mesma page (mesma aba)
  const login = new LoginPage(page);

  // Cria uma instância do CustomerPage usando a mesma page
  const customer = new CustomerPage(page);

  // Abre a URL do sistema (método implementado no LoginPage)
  await login.goTo();

  // Clica em "Customer Login" (método implementado no LoginPage)
  await login.loginAsCustomer();

  // Cria uma função auxiliar que espera 1 segundo (útil para dar tempo de UI atualizar)
  const wait1s = async () => page.waitForTimeout(1000);

  // Seleciona o usuário Neville Longbottom no select e clica Login
  await customer.selectCustomer('Neville Longbottom');

  // Validação simples: confirma que o texto "Welcome" está visível (ou seja, logou)
  await expect(page.getByText('Welcome')).toBeVisible();

  // Lê o saldo atual (string), converte pra número inteiro (base 10) e guarda em initialBalance
  const initialBalance = parseInt(await customer.getBalance(), 10);

  // Valida que o saldo inicial é 0 (isso pode falhar se o usuário já tiver saldo)
  await expect(initialBalance).toBe(0);

  // Faz um depósito de 100
  await customer.deposit(100);

  // Espera 1 segundo
  await wait1s();

  // Faz um depósito de 200
  await customer.deposit(200);

  // Espera 1 segundo
  await wait1s();

  // Faz um depósito de 500
  await customer.deposit(500);

  // Espera 1 segundo
  await wait1s();

  // Faz um depósito de 1000
  await customer.deposit(1000);

  // Faz um saque de 100
  await customer.withdraw(100);

  // Espera 1 segundo
  await wait1s();

  // Faz um saque de 99
  await customer.withdraw(99);

  // Lê o saldo final após todas as operações
  const finalBalance = parseInt(await customer.getBalance(), 10);

  // Clica no botão "Transactions" para ir para a tela de transações
  await page.getByRole('button', { name: 'Transactions' }).click();

  // Clica no botão "Back" para voltar para a tela da conta
  await page.getByRole('button', { name: 'Back' }).click();

  // Espera 1 segundo (1ª vez)
  await wait1s();

  // Espera 1 segundo (2ª vez)
  await wait1s();

  // Espera 1 segundo (3ª vez)
  await wait1s();

  // Entra novamente em "Transactions" (você usa isso porque às vezes só carrega na 2ª entrada)
  await page.getByRole('button', { name: 'Transactions' }).click();

  // Define os valores esperados de créditos (depósitos) que devem aparecer na tabela
  const expectedCredits = [100, 200, 500, 1000];

  // Define os valores esperados de débitos (saques) que devem aparecer na tabela
  const expectedDebits = [100, 99];

  // Calcula o saldo final esperado:
  // saldo inicial + soma dos créditos - soma dos débitos
  const expectedFinalBalance =
    initialBalance +
    expectedCredits.reduce((a, b) => a + b, 0) -
    expectedDebits.reduce((a, b) => a + b, 0);

  // Valida que o saldo final calculado bate com o saldo final esperado
  expect(finalBalance).toBe(expectedFinalBalance);

  // (Duplicado) Valida novamente que o saldo final calculado bate com o saldo esperado
  // Obs: essa linha é redundante porque você já validou acima
  expect(finalBalance).toBe(expectedFinalBalance);

  // Chama a validação de transações na tela:
  // - valida quantidade de transações
  // - valida presença dos valores
  // - valida contexto com IA (dependendo da implementação desse método)
  await customer.validateTransactionsOnScreen(page, {
    expectedCredits,
    expectedDebits,
    expectedFinalBalance,
  });
});































// import { test, expect } from '@playwright/test';
// import { LoginPage } from '../pages/LoginPage.js';
// import { CustomerPage } from '../pages/CustomerPage.js';
// import { validateBankConsistency } from '../ai/transactionValidator.js';
// import { notifyN8n } from '../utils/n8nNotifier.js';

// test.setTimeout(150000); // 150s (CI + UI + IA)

// test.afterEach(async ({}, testInfo) => {
//   const payload = {
//     event: 'playwright_result',
//     title: testInfo.title,
//     status: testInfo.status,
//     expectedStatus: testInfo.expectedStatus,
//     duration: testInfo.duration,
//     file: testInfo.file,
//     errors: testInfo.errors?.map((e) => e.message) || [],
//     timestamp: new Date().toISOString(),
//     level: testInfo.status !== testInfo.expectedStatus ? 'ERROR' : 'SUCCESS',
//   };

//   // não bloqueia o fim do teste/pipeline
//   notifyN8n(payload).catch(() => {});
// });

// test('OpenAI Banking Validation - Neville (deposit/withdraw sequence)', async ({ page }) => {
//   const login = new LoginPage(page);
//   const customer = new CustomerPage(page);

//   // 1) login com Neville Longbottom
//   await login.goTo();
//   await login.loginAsCustomer();
//   await customer.selectCustomer('Neville Longbottom');

//   // saldo inicial para cálculo do esperado
//   const initialBalance = parseInt(await customer.getBalance(), 10);

//   // helper para esperar 1s entre transações
//   const wait1s = async () => page.waitForTimeout(1000);

//   // 2) depósito 1000
//   await customer.deposit(1000);
//   await wait1s();

//   // 3) saque 200
//   await customer.withdraw(200);
//   await wait1s();

//   // 4) depósito 500
//   await customer.deposit(500);
//   await wait1s();

//   // 5) saque 99 e já ir para Transactions
//   await customer.withdraw(99);
// await page.waitForTimeout(2500); // dá tempo do app registrar e refletir na lista

//   // saldo final esperado (determinístico)
//   const expectedFinalBalance = initialBalance + 1000 - 200 + 500 - 99;

//   const finalBalance = parseInt(await customer.getBalance(), 10);
//   expect(finalBalance).toBe(expectedFinalBalance);

//   // 6) em Transactions, validar o contexto da tabela com IA
//   const transactionsText = await customer.getTransactionsText();

//   expect(transactionsText && transactionsText.trim().length > 0).toBeTruthy();
//   expect(/Credit|Debit/i.test(transactionsText), `Tabela parece sem transações:\n${transactionsText}`).toBe(true);

//   const aiResult = await validateBankConsistency(transactionsText, finalBalance);
//   expect(aiResult.pass, aiResult.reason).toBe(true);
// });