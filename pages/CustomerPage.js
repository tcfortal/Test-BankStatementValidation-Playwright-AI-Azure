import { expect } from '@playwright/test';
import { validateBankConsistency } from '../ai/transactionValidator.js';


export class CustomerPage {
  constructor(page) {
    this.page = page;


    // elementos da tela de seleção de usuário
    this.userSelect = page.locator('#userSelect');
    this.loginBtn = page.getByRole('button', { name: 'Login' });

    // marcador da tela /account (quando loga)
    this.welcomeText = page.getByText('Welcome');
    this.accountBlock = page.locator('div.center').filter({ hasText: 'Account Number' }).first();
  }

  async selectCustomer(name) {
    await this.userSelect.waitFor({ state: 'visible', timeout: 15000 });
    await this.userSelect.selectOption({ label: name });
    await this.loginBtn.click();

    // confirma que entrou na conta
    await this.page.waitForURL('**/account', { timeout: 15000 });
    await expect(this.welcomeText).toBeVisible({ timeout: 15000 });
    await expect(this.accountBlock).toBeVisible({ timeout: 15000 });
  }



//....................getBalance.....................//
    async getBalance() {
      await this.accountBlock.waitFor({ state: 'visible', timeout: 15000 });
      const text = await this.accountBlock.innerText();

      const match = text.match(/Balance\s*:\s*([0-9]+)/i);
      if (!match) throw new Error(`Não consegui extrair Balance:\n${text}`);

      return match[1];
    }



//....................DEPOSITO.....................//


async deposit(amount) {
  // saldo antes
  const before = parseInt(await this.getBalance(), 10);

  // abre o fluxo de depósito
  await this.page.locator('button.tab', { hasText: 'Deposit' }).click();

    // pega o form específico de depósito
  const form = this.page.locator('form').filter({ hasText: 'Amount to be Deposited' });


  const input = form.locator('input[placeholder="amount"]');
  await expect(input).toBeVisible({ timeout: 15000 });
  await input.fill(String(amount));

  // clica no botão Deposit do form (submit)
  await form.getByRole('button', { name: /^Deposit$/ }).click();

  // espera o saldo refletir
  await expect
    .poll(async () => parseInt(await this.getBalance(), 10), { timeout: 15000 })
    .toBe(before + amount);
}





async withdraw(amount) {
  // saldo antes
  const before = parseInt(await this.getBalance(), 10);

  // abre o fluxo de saque (no app o botão da aba é "Withdrawl")
  await this.page.locator('button.tab', { hasText: 'Withdrawl' }).click();

  // pega o form específico de saque
  const form = this.page.locator('form').filter({ hasText: 'Amount to be Withdrawn' });

  const input = form.locator('input[placeholder="amount"]');
  await expect(input).toBeVisible({ timeout: 15000 });
  await input.fill(String(amount));

  // clica no botão Withdraw do form (submit)
  await form.getByRole('button', { name: /^Withdraw$/ }).click();

  // espera o saldo refletir
  await expect
    .poll(async () => parseInt(await this.getBalance(), 10), { timeout: 15000 })
    .toBe(before - amount);
}

async  validateTransactionsOnScreen(page, { expectedCredits = [], expectedDebits = [], expectedFinalBalance }) {
  const table = page.locator('table');
  const rows = page.locator('table tbody tr');

  await expect(table).toBeVisible({ timeout: 15000 });

  // 1) quantidade de transações
  const count = await rows.count();
  expect(count).toBe(expectedCredits.length + expectedDebits.length);
  

  // 2) pega texto da tabela (para validações simples + IA)
  const text = (await table.innerText()).trim();

  // valida presença básica
  expect(/Credit|Debit/i.test(text)).toBe(true);

  // 3) valida valores esperados (simples: só checar se aparecem no texto)
  for (const v of expectedCredits) {
    expect(text.includes(`\t${v}\tCredit`) || text.includes(`${v}\tCredit`) || text.includes(`${v} Credit`)).toBe(true);
  }
  for (const v of expectedDebits) {
    expect(text.includes(`\t${v}\tDebit`) || text.includes(`${v}\tDebit`) || text.includes(`${v} Debit`)).toBe(true);
  }

  // 4) IA valida o contexto geral + saldo final esperado
  const ai = await validateBankConsistency(text, expectedFinalBalance);
  expect(ai.pass, ai.reason).toBe(true);

  return { count, text, ai };
}




}






// import { expect } from '@playwright/test';

// export class CustomerPage {
//   constructor(page) {
//     this.page = page;

//     this.accountBlock = this.page
//       .locator('div.center')
//       .filter({ hasText: 'Account Number' })
//       .first();
//   }

//   async selectCustomer(name) {
//     await this.page.waitForSelector('#userSelect', { timeout: 15000 });
//     await this.page.selectOption('#userSelect', { label: name });
//     await this.page.getByRole('button', { name: 'Login' }).click();

//     await this.page.waitForURL('**/account', { timeout: 15000 });
//     await expect(this.page.getByText('Welcome')).toBeVisible({ timeout: 15000 });
//   }

  // async getBalance() {
  //   await this.accountBlock.waitFor({ state: 'visible', timeout: 15000 });
  //   const text = await this.accountBlock.innerText();

  //   const match = text.match(/Balance\s*:\s*([0-9]+)/i);
  //   if (!match) throw new Error(`Não consegui extrair Balance:\n${text}`);

  //   return match[1];
  // }

//   async deposit(amount) {
//     const before = parseInt(await this.getBalance(), 10);

//     await this.page.getByRole('button', { name: /^Deposit$/ }).click();

//     const form = this.page.locator('form').filter({ hasText: 'Amount to be Deposited' });
//     const input = form.locator('input[placeholder="amount"]');

//     await expect(input).toBeVisible({ timeout: 15000 });
//     await input.fill(String(amount));
//     await expect(input).toHaveValue(String(amount));

//     await form.getByRole('button', { name: /^Deposit$/ }).click({ force: true });

//     await expect
//       .poll(async () => parseInt(await this.getBalance(), 10), { timeout: 15000 })
//       .toBe(before + amount);
//   }

//   async withdraw(amount) {
//     const before = parseInt(await this.getBalance(), 10);

//     await this.page.getByRole('button', { name: 'Withdrawl' }).click();

//     const form = this.page.locator('form').filter({ hasText: 'Amount to be Withdrawn' });
//     const input = form.locator('input[placeholder="amount"]');

//     await expect(input).toBeVisible({ timeout: 15000 });
//     await input.fill(String(amount));
//     await expect(input).toHaveValue(String(amount));

//     await form.getByRole('button', { name: /^Withdraw$/ }).click({ force: true });

//     await expect
//       .poll(async () => parseInt(await this.getBalance(), 10), { timeout: 15000 })
//       .toBe(before - amount);
//   }

//   async ensureOnAccountPage() {
//     await this.accountBlock.waitFor({ state: 'visible', timeout: 15000 });
//     await expect(this.page.locator('button', { hasText: 'Transactions' }).first()).toBeVisible({
//       timeout: 15000,
//     });
//   }

//   // -------------------------------------------------------
//   // Aplica range no filtro de transações
//   // - model do Angular recebe Date (evita ngModel:datefmt)
//   // - valor do input recebe string SEM segundos (mais compatível)
//   // - se min/max forem muito apertados (segundos), usa fallback 24h
//   // -------------------------------------------------------
//   async setRangeViaAngularSmart() {
//     await this.page.waitForFunction(() => !!window.angular, null, { timeout: 15000 });

//     await this.page.evaluate(() => {
//       const startEl = document.querySelector('#start');
//       const endEl = document.querySelector('#end');
//       if (!startEl || !endEl) throw new Error('Inputs #start/#end não encontrados');

//       const minStr = startEl.getAttribute('min') || endEl.getAttribute('min');
//       const maxStr = endEl.getAttribute('max') || startEl.getAttribute('max');

//       const now = new Date();
//       let fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
//       let toDate = now;

//       // Se min/max existirem, tenta usar... mas só se a janela for razoável
//       if (minStr && maxStr) {
//         const minD = new Date(minStr);
//         const maxD = new Date(maxStr);
//         const windowMs = maxD - minD;

//         if (windowMs >= 5 * 60 * 1000) {
//           fromDate = minD;
//           toDate = maxD;
//         }
//       }

//       const pad = (n) => String(n).padStart(2, '0');
//       const fmtNoSeconds = (d) =>
//         `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
//         `T${pad(d.getHours())}:${pad(d.getMinutes())}`;

//       startEl.value = fmtNoSeconds(fromDate);
//       endEl.value = fmtNoSeconds(toDate);

//       // força watchers
//       startEl.focus();
//       startEl.blur();
//       endEl.focus();
//       endEl.blur();

//       startEl.dispatchEvent(new Event('input', { bubbles: true }));
//       startEl.dispatchEvent(new Event('change', { bubbles: true }));
//       endEl.dispatchEvent(new Event('input', { bubbles: true }));
//       endEl.dispatchEvent(new Event('change', { bubbles: true }));

//       const ng = window.angular;
//       const scope = ng.element(startEl).scope() || ng.element(startEl).isolateScope();
//       if (!scope) throw new Error('Scope Angular não encontrado');

//       const applyFn = () => {
//         scope.startDate = fromDate;
//         scope.endDate = toDate;
//       };

//       if (scope.$$phase) scope.$applyAsync(applyFn);
//       else scope.$apply(applyFn);

//       scope.$applyAsync(() => {});
//     });
//   }

//   async openTransactionsEnsureRows({ minRows = 1 } = {}) {
//   const txBtn = this.page.locator('button', { hasText: 'Transactions' }).first();
//   const backBtn = this.page.locator('button:has-text("Back")').first();

//   const table = this.page.locator('table');
//   const rows = this.page.locator('table tbody tr');

//   const waitRowsQuick = async (ms) => {
//     await expect(table).toBeVisible({ timeout: 15000 });
//     const start = Date.now();

//     while (Date.now() - start < ms) {
//       const c = await rows.count();
//       if (c >= minRows) return true;
//       await this.page.waitForTimeout(100);
//     }
//     return false;
//   };

//   // ✅ define aqui o que é "abrir + aplicar filtro"
//   const openAndFilter = async () => {
//     await this.ensureOnAccountPage();

//     await txBtn.click({ timeout: 15000 });
//     await this.page.waitForURL(/#\/listTx/, { timeout: 15000 });
//     await expect(table).toBeVisible({ timeout: 15000 });

//     // aplica o range (seu método atual)
//     await this.setRangeViaAngularSmart();
//   };

//   // ✅ loop com cooldowns (tenta, volta, tenta de novo)
//   const cooldowns = [0, 800, 1500, 2500];

//   for (let attempt = 0; attempt < cooldowns.length; attempt++) {
//     if (cooldowns[attempt] > 0) {
//       await this.page.waitForTimeout(cooldowns[attempt]);
//     }

//     await openAndFilter();

//     const ok = await waitRowsQuick(6000);
//     if (ok) return;

//     if (await backBtn.count()) {
//       await backBtn.click({ force: true });
//       await this.page.waitForURL('**/account', { timeout: 15000 });
//     } else {
//       break;
//     }
//   }

//   const txt = await table.innerText().catch(() => '');
//   throw new Error(
//     `Tabela de transações não carregou linhas após múltiplas tentativas (Back→Transactions).\nConteúdo:\n${txt}`
//   );
// }

//   async getTransactionsText() {
//     await this.openTransactionsEnsureRows({ minRows: 1 });
//     return (await this.page.locator('table').innerText()).trim();
//   }
// }