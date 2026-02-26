import 'dotenv/config';
import { defineConfig } from '@playwright/test';

/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default defineConfig({

  // ⏱ Tempo máximo por teste (60s)
  timeout: 60_000,

  // ⏱ Tempo máximo para expect
  expect: {
    timeout: 15_000,
  },

  // 🔁 Retry automático (somente em CI)
  retries: process.env.CI ? 2 : 0,

  // 🧵 Execução paralela
  workers: process.env.CI ? 2 : undefined,

  // 📂 Pasta dos testes (opcional, mas recomendado)
  testDir: './tests',

  // 📊 Relatórios (IMPORTANTE PARA AZURE)
  reporter: [
    ['list'], // console
    ['html', { outputFolder: 'playwright-report', open: 'never' }], // relatório HTML
    ['junit', { outputFile: 'test-results/junit/results.xml' }], // Azure DevOps
  ],

  // 📁 Pasta de outputs (screenshots, videos, traces)
  outputDir: 'test-results/artifacts',

  // 🌐 Configuração padrão dos testes
  use: {
    headless: true,

    // 🖼 Screenshot só em falha
    screenshot: 'only-on-failure',

    // 🎥 Vídeo em falha
    video: 'retain-on-failure',

    // 🔍 Trace para debug
    trace: 'retain-on-failure',

    // 🌐 Base URL (opcional, ajuda muito em escala)
    baseURL: 'https://www.globalsqa.com/angularJs-protractor/BankingProject/#/login',

    // ⏱ Timeout de ações (click, fill, etc)
    actionTimeout: 15_000,

    // ⏱ Timeout de navegação
    navigationTimeout: 30_000,
  },

  // 🌎 Projetos (rodar em múltiplos browsers)
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    // Pode ativar depois:
    // {
    //   name: 'firefox',
    //   use: { browserName: 'firefox' },
    // },
    // {
    //   name: 'webkit',
    //   use: { browserName: 'webkit' },
    // },
  ],

});