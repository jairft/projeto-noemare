import { Routes } from '@angular/router';

// 1. Guardião de Rotas
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin.guard';

// 2. Importações de Componentes Desktop
import { LoginComponent } from './components/login/login.component';
import { RegistroComponent } from './components/registro/registro.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NotasFornecedorComponent } from './components/notas-fornecedor.component/notas-fornecedor.component';
import { FornecedorComponent } from './components/fornecedor/fornecedor.component';
import { FinanceiroComponent } from './components/financeiro/financeiro.component';
import { AdicionarEmprestimoComponent } from './components/adicionar-emprestimo.component/adicionar-emprestimo.component';
import { ClassificacaoProdutoComponent } from './components/classificacao-produto.component/classificacao-produto.component';
import { GestaoUsuariosComponent } from './components/gestao-usuarios.component/gestao-usuarios.component';
import { HistoricoNotasComponent } from './components/historico-notas.component/historico-notas.component';
import { AuditoriaComponent } from './components/auditoria.component/auditoria.component'; 
import { CadastroBoletoComponent } from './components/cadastro-boleto.component/cadastro-boleto.component';

// 3. NOVAS IMPORTAÇÕES MOBILE
import { LoginMobileComponent } from './mobile/login-mobile.component/login-mobile.component';
import { HomeMobileComponent } from './mobile/home-mobile.component/home-mobile.component';
import { BoletoMobileComponent } from './mobile/boleto-mobile.component/boleto-mobile.component';
import { LancarNotaMobileComponent } from './mobile/lancar-nota-mobile.component/lancar-nota-mobile.component';
import { HistoricoNotasMobileComponent } from './mobile/historico-notas-mobile.component/historico-notas-mobile.component';
import { FornecedoresMobileComponent } from './mobile/fornecedores-mobile.component/fornecedores-mobile.component';
import { RelatorioAnualComponent } from './components/relatorio-anual.component/relatorio-anual.component';
import { RelatorioAnualMobileComponent } from './mobile/relatorio-anual-mobile.component/relatorio-anual-mobile.component';
import { AlterarSenhaComponent } from './components/alterar-senha.component/alterar-senha.component';
import { HistoricoFornecedorComponent } from './components/historico-fornecedor.component/historico-fornecedor.component';
import { HistoricoFornecedorMobileComponent } from './mobile/historico-fornecedor-mobile.component/historico-fornecedor-mobile.component';
// Importação do novo componente do boleto mobile (verifique se a pasta gerada foi exatamente essa)


export const routes: Routes = [
  // Rotas Públicas Desktop
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },

  // Rotas Públicas Mobile
  { path: 'login-mobile', component: LoginMobileComponent },

  // Rotas Protegidas Desktop
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'fornecedores', component: FornecedorComponent, canActivate: [authGuard] },
  { path: 'notas-fornecedor', component: NotasFornecedorComponent, canActivate: [authGuard] },
  { path: 'financeiro', component: FinanceiroComponent, canActivate: [authGuard] },
  { path: 'emprestimo/novo', component: AdicionarEmprestimoComponent, canActivate: [authGuard] },
  { 
    path: 'adicionar/pescados', 
    component: ClassificacaoProdutoComponent,
    canActivate: [authGuard],
    title: 'Cardápio de Pescados' 
  },
  { path: 'usuarios', component: GestaoUsuariosComponent, canActivate: [adminGuard] },
  { path: 'historico-notas', component: HistoricoNotasComponent, canActivate: [authGuard], title: 'Histórico de Notas' },
  { path: 'auditoria', component: AuditoriaComponent, canActivate: [adminGuard], title: 'Auditoria do Sistema' },
  { path: 'boletos/novo', component: CadastroBoletoComponent, canActivate: [authGuard], title: 'Noé Maré - Cadastrar Boleto' },
  { 
    path: 'configuracoes/alterar-senha', 
    component: AlterarSenhaComponent 
  },

  {
    path: 'historico-fornecedor',
    component: HistoricoFornecedorComponent,
    title: 'Extrato de Fornecedores - Noemare'
  },

  // ===== NOVAS ROTAS MOBILE PROTEGIDAS =====

   {
    path: 'historico-fornecedor-mobile',
    component: HistoricoFornecedorMobileComponent, // Ou o componente específico mobile se criar um
    title: 'Extrato Fornecedor'
  },
  { 
    path: 'home-mobile', 
    component: HomeMobileComponent, 
    canActivate: [authGuard], 
    title: 'Noé Maré - Home' 
  },
  { 
    path: 'mobile/boletos/novo', 
    component: BoletoMobileComponent, 
    canActivate: [authGuard], 
    title: 'Novo Boleto' 
  },
  { path: 'mobile/relatorio-anual', component: RelatorioAnualMobileComponent, canActivate: [authGuard] },
  
  { path: 'mobile/notas/novo', 
    component: LancarNotaMobileComponent, 
    canActivate: [authGuard] },
    { 
    path: 'mobile/historico-notas', 
    component: HistoricoNotasMobileComponent, 
    canActivate: [authGuard], 
    title: 'Histórico de Notas' 
  },
  { 
    path: 'mobile/fornecedores', 
    component: FornecedoresMobileComponent, 
    canActivate: [authGuard], 
    title: 'Fornecedores' 
  },
  { path: 'relatorios',
     component: RelatorioAnualComponent,
     title: 'Relatório Anual' },

  // Rota Padrão
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];