import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { CustomerPage } from '../pages/CustomerPage.js';
import { notifyN8n } from '../utils/n8nNotifier.js';

test.setTimeout(60000);

// Envia resultado do teste para o n8n ao final (passando ou falhando)
test.afterEach(async ({}, testInfo) => {
  const payload = {
    event: 'playwright_result',
    title: testInfo.title,
    status: testInfo.status,
    expectedStatus: testInfo.expectedStatus,
    duration: testInfo.duration,
    file: testInfo.file,
    errors: testInfo.errors?.map(e => e.message) || [],
    timestamp: new Date().toISOString(),
    level: testInfo.status === testInfo.expectedStatus ? 'SUCCESS' : 'ERROR',
  };

  

  try {
    await notifyN8n(payload);
    console.log('[afterEach] notifyN8n() finalizou');
  } catch (e) {
    console.warn('[afterEach] notifyN8n() ERRO:', e?.message || e);
  }
});

test('Neville - deposits/withdraws + validate transactions', async ({ page }) => {
  const login = new LoginPage(page);
  const customer = new CustomerPage(page);

  await login.goTo();
  await login.loginAsCustomer();

  const wait1s = async () => page.waitForTimeout(1000);

  await customer.selectCustomer('Neville Longbottom');
  await expect(page.getByText('Welcome')).toBeVisible();

  // Saldo inicial (não assume 0)
  const initialBalance = parseInt(await customer.getBalance(), 10);

  // Cenário
  const expectedCredits = [100, 200, 500, 1000];
  const expectedDebits = [11,11];

  // Deposits
  for (const v of expectedCredits) {
    await customer.deposit(v);
    await wait1s();
  }

  // Withdraws
  for (const v of expectedDebits) {
    await customer.withdraw(v);
    await wait1s();
  }

  // Saldo final
  const finalBalance = parseInt(await customer.getBalance(), 10);

  // Saldo esperado
  const expectedFinalBalance =
    initialBalance +
    expectedCredits.reduce((a, b) => a + b, 0) -
    expectedDebits.reduce((a, b) => a + b, 0);

  expect(finalBalance).toBe(expectedFinalBalance);

  // Abre Transactions (truque back -> transactions)
  await page.getByRole('button', { name: 'Transactions' }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Transactions' }).click();

  // Valida tabela + contexto (lógica + IA) via método do CustomerPage
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