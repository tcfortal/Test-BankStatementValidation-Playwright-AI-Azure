import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { CustomerPage } from '../pages/CustomerPage.js';

test.setTimeout(60000);

test('Login - Neville Longbottom', async ({ page }) => {
  const login = new LoginPage(page);
  const customer = new CustomerPage(page);

  await login.goTo();
  await login.loginAsCustomer();


  const wait1s = async () => page.waitForTimeout(1000);

  await customer.selectCustomer('Neville Longbottom');

  // validação extra simples (opcional)
  await expect(page.getByText('Welcome')).toBeVisible();


const initialBalance = parseInt(await customer.getBalance(), 10);
await expect(initialBalance).toBe(0);


await customer.deposit(100)
await wait1s();
await customer.deposit(200)
await wait1s();
await customer.deposit(500)
await wait1s();
await customer.deposit(1000)


await customer.withdraw(100)
await wait1s();
await customer.withdraw(99)


const finalBalance = parseInt(await customer.getBalance(), 10);


await page.getByRole('button', {name: 'Transactions'}).click();
await page.getByRole('button', {name: 'Back'}).click();
await wait1s();
await wait1s();
await wait1s();
await page.getByRole('button', {name: 'Transactions'}).click();




// EXEMPLO DE USO (na tela de Transactions):
const expectedCredits = [100, 200, 500, 1000];
const expectedDebits = [100, 99];

const expectedFinalBalance =
  initialBalance +
  expectedCredits.reduce((a, b) => a + b, 0) -
  expectedDebits.reduce((a, b) => a + b, 0);



  expect(finalBalance).toBe(expectedFinalBalance);


// valida saldo
expect(finalBalance).toBe(expectedFinalBalance);

// já na tela Transactions:
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