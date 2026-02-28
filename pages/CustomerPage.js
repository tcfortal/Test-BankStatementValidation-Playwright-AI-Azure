// Importa o expect do Playwright Test para fazer asserções (validações)
import { expect } from '@playwright/test';

// Converte um objeto Date para o formato aceito por inputs do tipo datetime-local:
// "YYYY-MM-DDTHH:mm:ss"
function toDatetimeLocal(d) {
  // Função auxiliar para garantir 2 dígitos (ex: 3 -> "03")
  const pad = (n) => String(n).padStart(2, '0');

  // Monta a string final no padrão do input datetime-local
  // getMonth() começa em 0, por isso soma +1
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

// Exporta a Page Object Model (POM) da página de Customer (cliente)
export class CustomerPage {
  // Recebe o objeto "page" do Playwright (aba/navegador)
  constructor(page) {
    this.page = page; // guarda para usar em todos os métodos

    // Cria um locator para o bloco central que contém "Account Number"
    // .locator('div.center') pode retornar mais de um elemento,
    // então usamos filter + first() pra escolher o primeiro que tem esse texto
    this.accountBlock = this.page
      .locator('div.center')
      .filter({ hasText: 'Account Number' })
      .first();
  }

  // Faz login selecionando um customer pelo nome no select e clicando Login
  async selectCustomer(name) {
    // Espera o select existir na tela (até 15s)
    await this.page.waitForSelector('#userSelect', { timeout: 15000 });

    // Seleciona a opção pelo label (texto visível) igual ao nome informado
    await this.page.selectOption('#userSelect', { label: name });

    // Clica no botão "Login" usando role (mais robusto que CSS puro)
    await this.page.getByRole('button', { name: 'Login' }).click();

    // Espera a navegação para a página /account (até 15s)
    await this.page.waitForURL('**/account', { timeout: 15000 });

    // Confirma que aparece o texto "Welcome" (garante que logou mesmo)
    await expect(this.page.getByText('Welcome')).toBeVisible({ timeout: 15000 });
  }

  // Lê o saldo atual exibido na página e retorna como string (apenas números)
  async getBalance() {
    // Espera o bloco da conta estar visível
    await this.accountBlock.waitFor({ state: 'visible', timeout: 15000 });

    // Pega o texto completo do bloco
    const text = await this.accountBlock.innerText();

    // Procura algo como "Balance : 1234" (case-insensitive)
    const match = text.match(/Balance\s*:\s*([0-9]+)/i);

    // Se não conseguiu extrair, lança erro com o texto para debug
    if (!match) throw new Error(`Não consegui extrair Balance:\n${text}`);

    // Retorna o grupo capturado (somente números)
    return match[1];
  }

  // Executa um depósito e valida que o saldo final aumentou corretamente
  async deposit(amount) {
    // Captura o saldo ANTES do depósito (converte para número)
    const before = parseInt(await this.getBalance(), 10);

    // Abre a aba/fluxo de depósito (botão Deposit)
    await this.page.getByRole('button', { name: /^Deposit$/ }).click();

    // Localiza o form específico pelo texto "Amount to be Deposited"
    const form = this.page.locator('form').filter({ hasText: 'Amount to be Deposited' });

    // Localiza o input de valor do depósito pelo placeholder
    const input = form.locator('input[placeholder="amount"]');

    // Garante que o input está visível
    await expect(input).toBeVisible({ timeout: 15000 });

    // Preenche com o valor do depósito (convertendo para string)
    await input.fill(String(amount));

    // Confirma que o input realmente ficou com o valor
    await expect(input).toHaveValue(String(amount));

    // Localiza o botão de submit do depósito dentro do form
    const submit = form.getByRole('button', { name: /^Deposit$/ });

    // Clica para submeter
    // force: true ignora algumas restrições (ex: overlay, animação)
    await submit.click({ force: true });

    // Faz um polling: fica verificando o saldo até bater com o esperado ou estourar timeout
    // Isso é melhor do que um waitForTimeout fixo
    await expect
      .poll(async () => parseInt(await this.getBalance(), 10), { timeout: 15000 })
      .toBe(before + amount);
  }

  // Executa um saque e valida que o saldo final diminuiu corretamente
  async withdraw(amount) {
    // Captura o saldo ANTES do saque
    const before = parseInt(await this.getBalance(), 10);

    // Abre a aba/fluxo de saque
    // OBS: o texto "Withdrawl" parece um typo do app (muito comum em demos)
    await this.page.getByRole('button', { name: 'Withdrawl' }).click();

    // Localiza o form específico pelo texto "Amount to be Withdrawn"
    const form = this.page.locator('form').filter({ hasText: 'Amount to be Withdrawn' });

    // Localiza o input do valor do saque
    const input = form.locator('input[placeholder="amount"]');

    // Garante que o input está visível
    await expect(input).toBeVisible({ timeout: 15000 });

    // Preenche com o valor do saque
    await input.fill(String(amount));

    // Confirma que foi preenchido
    await expect(input).toHaveValue(String(amount));

    // Localiza o botão de submit do saque ("Withdraw")
    const submit = form.getByRole('button', { name: /^Withdraw$/ });

    // Clica para submeter (force para reduzir flakiness)
    await submit.click({ force: true });

    // Polling do saldo: espera até saldo = before - amount
    await expect
      .poll(async () => parseInt(await this.getBalance(), 10), { timeout: 15000 })
      .toBe(before - amount);
  }

  // Abre a página de transações e aplica um range de tempo para garantir que aparecem registros
async openTransactions() {
  // ✅ garante que está na tela principal da conta (onde existem os botões)
  await this.accountBlock.waitFor({ state: 'visible', timeout: 30000 });

  const txBtn = this.page.getByRole('button', { name: /^Transactions$/ });
  await expect(txBtn).toBeVisible({ timeout: 30000 });

  await txBtn.click({ timeout: 30000 });
  await this.page.waitForURL(/#\/listTx/, { timeout: 30000 });

  const start = this.page.locator('#start');
  const end = this.page.locator('#end');
  const table = this.page.locator('table');
  const rows = this.page.locator('table tbody tr');

  await expect(start).toBeVisible({ timeout: 30000 });
  await expect(end).toBeVisible({ timeout: 30000 });
  await expect(table).toBeVisible({ timeout: 30000 });

  // ✅ range maior para CI (24h)
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const applyRange = async () => {
    await start.fill(toDatetimeLocal(oneDayAgo));
    await end.fill(toDatetimeLocal(now));

    // Angular às vezes só reage no blur + events
    await start.evaluate(el => el.blur());
    await end.evaluate(el => el.blur());

    await start.dispatchEvent('input');
    await start.dispatchEvent('change');
    await end.dispatchEvent('input');
    await end.dispatchEvent('change');
  };

  // aplica filtro e espera linhas
  try {
    await applyRange();
    await expect(rows.first()).toBeVisible({ timeout: 30000 });
    return;
  } catch {
    // fallback: voltar e abrir novamente, reaplicar filtro e esperar linhas
    const back = this.page.locator('button:has-text("Back")').first();
    if (await back.count()) {
      await back.click({ force: true });
      await this.page.waitForURL('**/account', { timeout: 30000 });

      await expect(txBtn).toBeVisible({ timeout: 30000 });
      await txBtn.click({ timeout: 30000 });
      await this.page.waitForURL(/#\/listTx/, { timeout: 30000 });

      await expect(table).toBeVisible({ timeout: 30000 });
      await applyRange();
      await expect(rows.first()).toBeVisible({ timeout: 30000 });
      return;
    }

    throw new Error('Não foi possível carregar linhas na tabela de transações (sem botão Back para fallback).');
  }
}

  // Retorna o texto da tabela de transações (útil pra validação com IA ou asserts)
  async getTransactionsText() {
    // Garante que está na tela de transações com range aplicado e tabela visível
    await this.openTransactions();

    // Localiza a tabela
    const table = this.page.locator('table');

    // Garante visibilidade
    await expect(table).toBeVisible({ timeout: 15000 });

    // Retorna o texto completo da tabela (trim remove espaços extras)
    return (await table.innerText()).trim();
  }
}