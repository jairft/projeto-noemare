import { Component, OnInit, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { MatIconModule } from '@angular/material/icon'; 

// Importação dos seus Serviços
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service'; 
import { AnoContextoService } from '../../services/ano-contexto.service';
import { RelatorioService } from '../../services/relatorio.service'; // 👉 Importado para pegar o peso real

@Component({
  selector: 'app-home-mobile',
  standalone: true, 
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './home-mobile.component.html',
  styleUrl: './home-mobile.component.scss'
})
export class HomeMobileComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private anoContexto = inject(AnoContextoService);
  private relatorioService = inject(RelatorioService); // 👉 Injetado aqui

  // Variáveis Reativas
  userName: string = 'Carregando...';
  volumeTotal: string = 'Carregando...'; // Começa com texto de loading
  totalComprado: string = 'R$ 0,00';
  
  anosDisponiveis: number[] = [2024, 2025, 2026, 2027];
  anoSelecionado!: number;

  ngOnInit(): void {
    this.carregarDadosUsuario();
    
    this.anoContexto.anoSelecionado$.subscribe(ano => {
      this.anoSelecionado = ano;
      this.carregarResumo(ano); 
    });
  }

  carregarDadosUsuario(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userName = payload.nome || payload.sub?.split('@')[0] || 'Usuário';
      } catch (e) {
        console.error('Erro ao decodificar o token', e);
      }
    }
  }

  // 👉 Lógica idêntica à do Dashboard Desktop
  carregarResumo(ano: number): void {
    this.volumeTotal = 'Carregando...'; // Reset visual enquanto busca
    
    // 1. Busca os dados financeiros do Dashboard
    this.dashboardService.obterResumo(ano).subscribe({
      next: (res) => {
        // Calcula o Total Comprado (A Pagar + Pago no Mês)
        const totalCompradoCalculado = (res.totalAPagar || 0) + (res.totalPagoMes || 0);
        this.totalComprado = this.formatarMoeda(totalCompradoCalculado);

        // 2. Busca o Relatório Anual para extrair o Peso (Volume Total)
        this.relatorioService.obterResumoAnual().subscribe({
          next: (relatorio: any) => { 
            const peso = Number(relatorio.totalKgGeral) || 0;
            this.volumeTotal = `${peso.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG`;
          },
          error: (err) => {
            console.error('Erro ao carregar peso do relatório:', err);
            this.volumeTotal = '0,00 KG';
          }
        });
      },
      error: (err) => {
        console.error('Erro ao carregar os dados financeiros:', err);
        this.totalComprado = 'R$ 0,00';
        this.volumeTotal = '0,00 KG';
      }
    });
  }

  alterarAno(novoAno: any): void {
    this.anoContexto.setAno(Number(novoAno));
  }

  private formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }

  navigateTo(route: string) {
    this.router.navigate([`/${route}`]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login-mobile']);
  }
}