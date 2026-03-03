import { Component, OnInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// Angular Material
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Gráficos
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType, Chart } from 'chart.js';

// Services e Models
import { NotaFornecedorService } from '../../services/nota-fornecedor.service';
import { DashboardService } from '../../services/dashboard.service';
import { NotifyService } from '../../services/notify.service'; 
import { BoletoService } from '../../services/boleto.service'; 
import { AnoContextoService } from '../../services/ano-contexto.service'; 
import { RelatorioService } from '../../services/relatorio.service';
import { RelatorioAnualResponse } from '../../models/relatorio-anual';

// Componentes de Modal
import { HistoricoPagamentoComponent } from '../financeiro/historico-pagamento.component/historico-pagamento.component';
import { QrMobileDialogComponent } from '../qr-mobile-dialog.component/qr-mobile-dialog.component';
import { ResumoDiaDialogComponent } from '../resumo-dia-dialog/resumo-dia-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatSidenavModule, MatListModule, MatIconModule,
    MatToolbarModule, MatButtonModule, MatCardModule,
    MatTableModule, MatTooltipModule, MatMenuModule, MatDialogModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  
  private readonly router = inject(Router);
  private readonly notaService = inject(NotaFornecedorService);
  private readonly dashboardService = inject(DashboardService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService); 
  private readonly boletoService = inject(BoletoService); 
  private readonly anoContexto = inject(AnoContextoService); 
  private readonly relatorioService = inject(RelatorioService); 
  private readonly cdr = inject(ChangeDetectorRef);

  userName: string = 'Carregando...';        
  userRole: string = '...';

  anoSelecionado!: number;
  anosDisponiveis: number[] = [];

  kpis: any[] = [];
  colunasExibidas: string[] = ['icone', 'data', 'descricao', 'status', 'valor', 'acoes'];
  movimentacoes: any[] = []; 

  dataAtual: string = '';
  horaAtual: string = '';

  notificacoes: any[] = [];
  totalKgCentro: string = '0,00';
  
  isLoadingKPIs: boolean = true; 
  isLoadingMovs: boolean = true;
  isLoadingRosca: boolean = true; 

  @ViewChild('barChart') barChart: BaseChartDirective | undefined;
  @ViewChild('donutChart') donutChart: BaseChartDirective | undefined;

  // ==========================================================
  // CONFIGURAÇÕES DOS GRÁFICOS
  // ==========================================================
  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    datasets: [{
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Inicia zerado para animar depois
      label: 'Volume Comprado (KG)',
      backgroundColor: '#2563eb', hoverBackgroundColor: '#1d4ed8', borderRadius: 6, barPercentage: 0.6
    }]
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 1500, easing: 'easeOutQuart' }, // 👉 Garante animação suave
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a', padding: 12, titleFont: { family: 'Sora', size: 14 },
        bodyFont: { family: 'Sora', size: 13, weight: 'bold' },
        callbacks: { label: (context) => ` ${context.parsed.y} KG` }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Sora', weight: 'bold' }, color: '#94a3b8' }, border: { display: false } },
      y: { grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Sora' }, color: '#94a3b8' }, border: { display: false } }
    }
  };

  public doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#2563eb', '#0ea5e9', '#38bdf8', '#10b981', '#f59e0b', '#94a3b8'],
      hoverOffset: 12, borderWidth: 3, borderColor: '#ffffff', borderRadius: 2
    }]
  };

  public doughnutChartType: 'doughnut' = 'doughnut';
  
  public doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true, maintainAspectRatio: false, cutout: '75%',
    animation: { duration: 2000, animateRotate: true, animateScale: true }, // 👉 Efeito de rotação
    plugins: {
      legend: { display: true, position: 'right', labels: { usePointStyle: true, pointStyle: 'circle', font: { family: 'Sora', size: 11, weight: 600 }, color: '#475569', padding: 20 } },
      tooltip: { backgroundColor: '#0f172a', padding: 12, cornerRadius: 10, titleFont: { family: 'Sora', size: 13 }, bodyFont: { family: 'Sora', size: 12, weight: 'bold' }, callbacks: { label: (context) => ` ${context.label}: ${context.parsed} KG` } }
    }
  };

  public doughnutChartPlugins: any[] = [{
    id: 'centerText',
    beforeDraw: (chart: any) => {
      const { ctx, chartArea: { left, top, width, height } } = chart;
      ctx.save();
      ctx.font = 'bold 20px Sora'; ctx.fillStyle = '#0f172a'; ctx.textAlign = 'center';
      ctx.fillText(this.totalKgCentro, left + width / 2, top + height / 2 + 5);
      ctx.font = '600 10px Sora'; ctx.fillStyle = '#94a3b8';
      ctx.fillText('TOTAL KG', left + width / 2, top + height / 2 + 22);
      ctx.restore();
    }
  }];

  ngOnInit(): void {
    this.atualizarRelogio();
    setInterval(() => this.atualizarRelogio(), 1000);
    this.carregarDadosUsuario();
    this.carregarNotificacoes();
    this.anosDisponiveis = this.anoContexto.anosDisponiveis;
    
    this.anoContexto.anoSelecionado$.subscribe(ano => {
      this.anoSelecionado = ano;
      this.carregarResumo();
      this.carregarMovimentacoesRecentes();
      this.verificarResumoDoDia(ano);
    });
  }

  verificarResumoDoDia(ano: number): void {
    const jaVisualizou = sessionStorage.getItem('resumo_visto');
    if (!jaVisualizou) {
      this.boletoService.buscarNotificacoes(ano).subscribe({
        next: (notificacoes: any[]) => {
          const alertas = notificacoes.filter(n => n.tipo === 'AVISO' || n.tipo === 'URGENTE');
          if (alertas.length > 0) {
            this.abrirModalResumoDia(alertas);
            sessionStorage.setItem('resumo_visto', 'true');
          }
        },
        error: (err) => console.error('Erro ao verificar resumo diário:', err)
      });
    }
  }

  abrirModalResumoDia(alertas: any[]): void {
    this.dialog.open(ResumoDiaDialogComponent, {
      panelClass: 'notif-dialog-panel',
      backdropClass: 'modal-backdrop-blur',
      width: '460px',
      maxWidth: '95vw',
      data: { alertas } 
    });
  }

  mudarAno(ano: number): void { this.anoContexto.setAno(ano); }

  carregarNotificacoes(): void {
    this.boletoService.buscarNotificacoes(this.anoSelecionado).subscribe({
      next: (dados) => { this.notificacoes = dados; },
      error: (err) => { console.error('Erro ao carregar notificações:', err); }
    });
  }

  irParaBoleto(id: number): void { this.router.navigate(['/boletos/novo']); }

  carregarResumo(): void {
    // 👉 1. KPIs e GRÁFICO DE BARRAS
    this.isLoadingKPIs = true;
    this.dashboardService.obterResumo().subscribe({
      next: (res: any) => { 
        const totalCompradoCalculado = (res.totalAPagar || 0) + (res.totalPagoMes || 0);
        
        this.kpis = [
          { titulo: 'Volume Total (Safra)', valor: this.formatarPeso(res.volumeTotalAno || 0), icone: 'scale', type: 'info' },
          { titulo: 'Total Comprado (Safra)', valor: this.formatarMoeda(totalCompradoCalculado), icone: 'shopping_cart', type: 'primary' },
          { titulo: 'Saldo em Aberto', valor: this.formatarMoeda(res.totalAPagar || 0), icone: 'account_balance_wallet', type: 'danger' },
          { titulo: 'Notas Pendentes', valor: (res.notasPendentes || 0).toString(), icone: 'description', type: 'warning' }
        ];

        this.totalKgCentro = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(res.volumeTotalAno || 0);

        // 🟢 PASSO PARA REATIVAR ANIMAÇÃO (BARRAS):
        this.isLoadingKPIs = false; // Desliga loading primeiro
        this.cdr.detectChanges();   // Força o Angular a desenhar o <canvas>

        setTimeout(() => {          // Espera o canvas existir no DOM para injetar dados e ANIMAR
          if (res.volumePorMes) {
            const dadosMeses = [];
            for (let i = 1; i <= 12; i++) {
              dadosMeses.push(res.volumePorMes[i] || 0);
            }
            this.barChartData.datasets[0].data = dadosMeses;
            this.barChart?.update();
          }
        }, 50);
      },
      error: (err) => {
        console.error('Erro ao carregar KPIs:', err);
        this.isLoadingKPIs = false;
      }
    });

    // 👉 2. GRÁFICO DE ROSCA
    this.isLoadingRosca = true; 
    this.relatorioService.obterResumoAnual().subscribe({
      next: (relatorio: any) => {
        const itensLagosta = (relatorio.itens || [])
          .filter((item: any) => (item.produto || '').toUpperCase().includes('LAGOSTA'))
          .sort((a: any, b: any) => (b.quantidadeKg || 0) - (a.quantidadeKg || 0));

        // 🟢 PASSO PARA REATIVAR ANIMAÇÃO (ROSCA):
        this.isLoadingRosca = false; 
        this.cdr.detectChanges();

        setTimeout(() => {
          if (itensLagosta.length > 0) {
            this.doughnutChartData.labels = itensLagosta.map((i: any) => i.produto);
            this.doughnutChartData.datasets[0].data = itensLagosta.map((i: any) => i.quantidadeKg);
          } else {
            this.doughnutChartData.labels = [];
            this.doughnutChartData.datasets[0].data = [];
          }
          this.donutChart?.update();
        }, 50);
      },
      error: (err) => {
        console.error('Erro ao carregar gráfico de rosca:', err);
        this.isLoadingRosca = false;
      }
    });
  }

  carregarMovimentacoesRecentes(): void {
    this.isLoadingMovs = true;
    this.notaService.listarTodas().subscribe({
      next: (notas) => {
        this.movimentacoes = notas
          .sort((a, b) => {
            const dataA = a.dataNota ? new Date(a.dataNota).getTime() : 0;
            const dataB = b.dataNota ? new Date(b.dataNota).getTime() : 0;
            return dataB - dataA; 
          })
          .slice(0, 4)
          .map(nota => {
            return {
              icone: 'arrow_downward', 
              tipo: 'Saída', 
              data: nota.dataNota ? new Date(nota.dataNota).toLocaleDateString('pt-BR') : '---',
              descricao: nota.descricao || `Compra - ${nota.fornecedorNome || '---'}`,
              status: nota.status, 
              valor: this.formatarMoeda(nota.valorTotal), 
              notaOriginal: nota 
            };
          });
        this.isLoadingMovs = false;
        this.cdr.detectChanges();
      },
      error: (err) => { 
        console.error(err); 
        this.notify.erro('Erro ao carregar movimentações.'); 
        this.isLoadingMovs = false;
      }
    });
  }

  abrirModalHistorico(nota: any): void {
    const idReal = nota?.id || nota?.idNota; 
    if (idReal) this.dialog.open(HistoricoPagamentoComponent, { width: '600px', data: { id: idReal } });
  }

  private formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  }

  private formatarPeso(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor || 0) + ' KG';
  }

  carregarDadosUsuario(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userName = payload.nome || 'Usuário';
        this.userRole = (payload.role || 'GERENTE').replace('ROLE_', '');
      } catch (e) { this.sair(); }
    } else { this.sair(); }
  }

  atualizarRelogio(): void {
    const agora = new Date();
    this.dataAtual = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    this.horaAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  abrirModalQrCode(): void { this.dialog.open(QrMobileDialogComponent, { width: '400px', panelClass: 'noemare-dialog' }); }

  sair(): void { 
    localStorage.removeItem('token'); 
    sessionStorage.removeItem('resumo_visto'); 
    this.router.navigate(['/login']); 
  }
}