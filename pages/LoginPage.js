// Exporta a classe LoginPage (Page Object Model da página de login)
export class LoginPage {

  // O construtor recebe o objeto "page" do Playwright
  // Esse objeto representa a aba do navegador
  constructor(page) {
    // Armazena o page para usar nos métodos da classe
    this.page = page;
  }

  // Método responsável por acessar a página de login da aplicação
  async goTo() {

    // Navega para a URL do sistema de banco (AngularJS demo)
    // goto abre a página no navegador controlado pelo Playwright
    await this.page.goto(
      'https://www.globalsqa.com/angularJs-protractor/BankingProject/#/login'
    );
  }

  // Método que realiza a ação de clicar no botão "Customer Login"
  async loginAsCustomer() {

    // getByRole usa acessibilidade (ARIA) para encontrar o botão
    // Isso é mais robusto do que usar seletores CSS frágeis
    await this.page.getByRole('button', { name: 'Customer Login' }).click();
  }
}