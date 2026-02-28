import { Routes } from '@angular/router';

// 1. Guardiões de Rotas (Mantêm-se os imports normais)
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin.guard';

// ⚠️ Repare que apagámos todas as importações de componentes daqui!
// O Angular fará o download deles apenas quando for estritamente necessário.

export const routes: Routes = [
  // ===== ROTAS PÚBLICAS DESKTOP =====
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent) 
  },
  { 
    path: 'registro', 
    loadComponent: () => import('./components/registro/registro.component').then(c => c.RegistroComponent) 
  },

  // ===== ROTAS PÚBLICAS MOBILE =====
  { 
    path: 'login-mobile', 
    loadComponent: () => import('./mobile/login-mobile.component/login-mobile.component').then(c => c.LoginMobileComponent) 
  },

  // ===== ROTAS PROTEGIDAS DESKTOP =====
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(c => c.DashboardComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'fornecedores', 
    loadComponent: () => import('./components/fornecedor/fornecedor.component').then(c => c.FornecedorComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'notas-fornecedor', 
    loadComponent: () => import('./components/notas-fornecedor.component/notas-fornecedor.component').then(c => c.NotasFornecedorComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'financeiro', 
    loadComponent: () => import('./components/financeiro/financeiro.component').then(c => c.FinanceiroComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'emprestimo/novo', 
    loadComponent: () => import('./components/adicionar-emprestimo.component/adicionar-emprestimo.component').then(c => c.AdicionarEmprestimoComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'adicionar/pescados', 
    loadComponent: () => import('./components/classificacao-produto.component/classificacao-produto.component').then(c => c.ClassificacaoProdutoComponent), 
    canActivate: [authGuard], 
    title: 'Cardápio de Pescados' 
  },
  { 
    path: 'usuarios', 
    loadComponent: () => import('./components/gestao-usuarios.component/gestao-usuarios.component').then(c => c.GestaoUsuariosComponent), 
    canActivate: [adminGuard] 
  },
  { 
    path: 'historico-notas', 
    loadComponent: () => import('./components/historico-notas.component/historico-notas.component').then(c => c.HistoricoNotasComponent), 
    canActivate: [authGuard], 
    title: 'Histórico de Notas' 
  },
  { 
    path: 'auditoria', 
    loadComponent: () => import('./components/auditoria.component/auditoria.component').then(c => c.AuditoriaComponent), 
    canActivate: [adminGuard], 
    title: 'Auditoria do Sistema' 
  },
  { 
    path: 'boletos/novo', 
    loadComponent: () => import('./components/cadastro-boleto.component/cadastro-boleto.component').then(c => c.CadastroBoletoComponent), 
    canActivate: [authGuard], 
    title: 'Noé Maré - Cadastrar Boleto' 
  },
  { 
    path: 'configuracoes/alterar-senha', 
    loadComponent: () => import('./components/alterar-senha.component/alterar-senha.component').then(c => c.AlterarSenhaComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'historico-fornecedor', 
    loadComponent: () => import('./components/historico-fornecedor.component/historico-fornecedor.component').then(c => c.HistoricoFornecedorComponent), 
    canActivate: [authGuard], 
    title: 'Extrato de Fornecedores - Noemare' 
  },
  { 
    path: 'relatorios', 
    loadComponent: () => import('./components/relatorio-anual.component/relatorio-anual.component').then(c => c.RelatorioAnualComponent), 
    canActivate: [authGuard], 
    title: 'Relatório Anual' 
  },

  // ===== ROTAS PROTEGIDAS MOBILE =====
  { 
    path: 'home-mobile', 
    loadComponent: () => import('./mobile/home-mobile.component/home-mobile.component').then(c => c.HomeMobileComponent), 
    canActivate: [authGuard], 
    title: 'Noé Maré - Home' 
  },
  { 
    path: 'mobile/boletos/novo', 
    loadComponent: () => import('./mobile/boleto-mobile.component/boleto-mobile.component').then(c => c.BoletoMobileComponent), 
    canActivate: [authGuard], 
    title: 'Novo Boleto' 
  },
  { 
    path: 'novo-emprestimo-mobile', 
    loadComponent: () => import('./mobile/adicionar-emprestimo-mobile.component/adicionar-emprestimo-mobile.component')
      .then(m => m.AdicionarEmprestimoMobileComponent)
  },
  { 
    path: 'pescados-mobile', 
    loadComponent: () => import('./mobile/classificacao-produto-mobile.component/classificacao-produto-mobile.component')
      .then(m => m.ClassificacaoProdutoMobileComponent)
  },
  { 
    path: 'mobile/notas/novo', 
    loadComponent: () => import('./mobile/lancar-nota-mobile.component/lancar-nota-mobile.component').then(c => c.LancarNotaMobileComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'mobile/historico-notas', 
    loadComponent: () => import('./mobile/historico-notas-mobile.component/historico-notas-mobile.component').then(c => c.HistoricoNotasMobileComponent), 
    canActivate: [authGuard], 
    title: 'Histórico de Notas' 
  },
  { 
    path: 'mobile/fornecedores', 
    loadComponent: () => import('./mobile/fornecedores-mobile.component/fornecedores-mobile.component').then(c => c.FornecedoresMobileComponent), 
    canActivate: [authGuard], 
    title: 'Fornecedores' 
  },
  { 
    path: 'mobile/relatorio-anual', 
    loadComponent: () => import('./mobile/relatorio-anual-mobile.component/relatorio-anual-mobile.component').then(c => c.RelatorioAnualMobileComponent), 
    canActivate: [authGuard] 
  },
  { 
    path: 'historico-fornecedor-mobile', 
    loadComponent: () => import('./mobile/historico-fornecedor-mobile.component/historico-fornecedor-mobile.component').then(c => c.HistoricoFornecedorMobileComponent), 
    canActivate: [authGuard], 
    title: 'Extrato Fornecedor' 
  },

  // Rota Padrão
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];